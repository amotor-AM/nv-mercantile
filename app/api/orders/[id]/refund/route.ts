import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import Stripe from "stripe"
import { auth } from "@/auth"
import { sendRefundEmail } from "@/lib/email"
import { logAdminAction, getClientIp } from "@/lib/security"

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  const isAdmin = (session as any)?.user?.role === "ADMIN"
  if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const order = await prisma.order.findUnique({ where: { id: params.id } })
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 })

  if (order.paymentProvider === "stripe" && order.paymentIntentId) {
    const stripeSecret = process.env.STRIPE_SECRET_KEY || ""
    if (!stripeSecret) return NextResponse.json({ error: "Stripe not configured" }, { status: 500 })
    const stripe = new Stripe(stripeSecret, { apiVersion: "2024-06-20" })
    // Refund entire amount
    await stripe.refunds.create({ payment_intent: order.paymentIntentId })
  }

  await prisma.order.update({ where: { id: order.id }, data: { status: "REFUNDED", refundStatus: "FULL" } })
  try {
    await sendRefundEmail(order.id)
  } catch {}

  try {
    await logAdminAction({
      userId: session?.user?.id ?? null,
      action: "order.refund",
      targetType: "Order",
      targetId: order.id,
      payload: { paymentProvider: order.paymentProvider, paymentIntentId: order.paymentIntentId },
      ip: getClientIp(req as any),
      userAgent: (req as any).headers.get("user-agent"),
    })
  } catch {}

  return NextResponse.json({ ok: true })
}