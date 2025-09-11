import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/auth"
import Stripe from "stripe"
import { sendRefundEmail } from "@/lib/email"

export async function POST(req: NextRequest, { params }: { params: { id: string; rmaId: string } }) {
  const session = await auth()
  const role = (session as any)?.user?.role
  if (!["ADMIN","MANAGER","SUPPORT","WAREHOUSE"].includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const body = await req.json().catch(() => ({}))
  const received = body.received as { returnItemId: string; qty: number }[]
  if (!received?.length) return NextResponse.json({ error: "received required" }, { status: 400 })

  const rma = await prisma.returnRequest.findUnique({
    where: { id: params.rmaId },
    include: { items: { include: { orderItem: true } }, order: true },
  })
  if (!rma) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Update received quantities and compute refund amount
  let refundCents = 0
  for (const rec of received) {
    const it = rma.items.find((x) => x.id === rec.returnItemId)
    if (!it) continue
    const qty = Math.min(rec.qty, it.requestedQty)
    await prisma.returnItem.update({ where: { id: it.id }, data: { receivedQty: qty } })
    refundCents += qty * it.orderItem.price
    // Restock returned quantity (optional)
    await prisma.product.update({
      where: { id: it.orderItem.productId },
      data: { stockLevel: { increment: qty }, inStock: true },
    })
    await prisma.inventoryMovement.create({
      data: { productId: it.orderItem.productId, type: "RESTOCK", quantity: qty, note: `RMA ${rma.id}` },
    })
  }

  await prisma.returnRequest.update({ where: { id: rma.id }, data: { status: "RECEIVED" } })

  if (refundCents > 0) {
    // Create partial refund
    if (rma.order.paymentProvider === "stripe" && rma.order.paymentIntentId) {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", { apiVersion: "2024-06-20" })
      const rf = await stripe.refunds.create({ payment_intent: rma.order.paymentIntentId, amount: refundCents })
      await prisma.refund.create({
        data: {
          orderId: rma.orderId,
          amount: refundCents,
          reason: `RMA ${rma.id}`,
          provider: "stripe",
          providerRefundId: rf.id,
          status: refundCents >= rma.order.total ? "FULL" : "PARTIAL",
          processedAt: new Date(),
        },
      })
      await prisma.order.update({
        where: { id: rma.orderId },
        data: { refundStatus: refundCents >= rma.order.total ? "FULL" : "PARTIAL", status: refundCents >= rma.order.total ? "REFUNDED" : rma.order.status },
      })
    } else {
      await prisma.refund.create({
        data: {
          orderId: rma.orderId,
          amount: refundCents,
          reason: `RMA ${rma.id}`,
          provider: rma.order.paymentProvider ?? null,
          status: refundCents >= rma.order.total ? "FULL" : "PARTIAL",
          processedAt: new Date(),
        } as any,
      })
    }
    try { await sendRefundEmail(rma.orderId) } catch {}
  }

  return NextResponse.json({ ok: true, refundCents })
}