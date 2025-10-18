import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/auth"
import Stripe from "stripe"
import { sendRefundEmail } from "@/lib/email"
import { RefundCreateSchema } from "@/lib/validation"
import { getClientIp, logAdminAction } from "@/lib/security"

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  const role = (session as any)?.user?.role
  const order = await prisma.order.findUnique({ where: { id: params.id } })
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const isOwner = session?.user?.id && (order.userId === session.user.id || order.email === session.user.email)
  if (!isOwner && !["ADMIN","MANAGER","SUPPORT"].includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const refunds = await prisma.refund.findMany({ where: { orderId: order.id }, orderBy: { createdAt: "desc" } })
  return NextResponse.json(refunds)
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  const role = (session as any)?.user?.role
  if (!["ADMIN","MANAGER","SUPPORT"].includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const json = await req.json().catch(() => ({}))
  const parsed = RefundCreateSchema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 422 })
  const { amount, reason } = parsed.data

  const order = await prisma.order.findUnique({ where: { id: params.id } })
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 })

  let providerRefundId: string | undefined
  if (order.paymentProvider === "stripe" && order.paymentIntentId) {
    const stripeSecret = process.env.STRIPE_SECRET_KEY || ""
    if (!stripeSecret) return NextResponse.json({ error: "Stripe not configured" }, { status: 500 })
    const stripe = new Stripe(stripeSecret, { apiVersion: "2024-06-20" })
    const refund = await stripe.refunds.create({ payment_intent: order.paymentIntentId, amount })
    providerRefundId = refund.id
  } else {
    // PayPal or others: manual bookkeeping for now
  }

  const rec = await prisma.refund.create({
    data: {
      orderId: order.id,
      amount,
      reason,
      provider: order.paymentProvider ?? null,
      providerRefundId: providerRefundId ?? null,
      status: amount >= order.total ? "FULL" : "PARTIAL",
      processedAt: new Date(),
    } as any,
  })

  // Update order.refundStatus
  const refunds = await prisma.refund.findMany({ where: { orderId: order.id } })
  const totalRefunded = refunds.reduce((s, r) => s + r.amount, 0)
  await prisma.order.update({
    where: { id: order.id },
    data: { refundStatus: totalRefunded >= order.total ? "FULL" : "PARTIAL", status: totalRefunded >= order.total ? "REFUNDED" : order.status },
  })

  await logAdminAction({
    userId: session?.user?.id ?? null,
    action: "refund.create",
    targetType: "Order",
    targetId: order.id,
    payload: { amount, reason, providerRefundId },
    ip: getClientIp(req),
    userAgent: req.headers.get("user-agent"),
  })

  try { await sendRefundEmail(order.id) } catch {}

  return NextResponse.json(rec, { status: 201 })
}