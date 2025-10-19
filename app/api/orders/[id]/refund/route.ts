import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import Stripe from "stripe"
import paypal from "@paypal/checkout-server-sdk"
import { auth } from "@/auth"
import { sendRefundEmail } from "@/lib/email"
import { logAdminAction, getClientIp } from "@/lib/security"
import * as Sentry from "@sentry/nextjs"

function getPayPalClient() {
  const env = process.env.PAYPAL_ENV || "sandbox"
  const clientId = process.env.PAYPAL_CLIENT_ID || ""
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET || ""
  if (!clientId || !clientSecret) return null
  const environment =
    env === "live"
      ? new paypal.core.LiveEnvironment(clientId, clientSecret)
      : new paypal.core.SandboxEnvironment(clientId, clientSecret)
  return new paypal.core.PayPalHttpClient(environment)
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  const isAdmin = (session as any)?.user?.role === "ADMIN"
  if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const order = await prisma.order.findUnique({ where: { id: params.id } })
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 })

  try {
    if (order.paymentProvider === "stripe" && order.paymentIntentId) {
      const stripeSecret = process.env.STRIPE_SECRET_KEY || ""
      if (!stripeSecret) return NextResponse.json({ error: "Stripe not configured" }, { status: 500 })
      const stripe = new Stripe(stripeSecret, { apiVersion: "2024-06-20" })
      // Refund entire amount
      await stripe.refunds.create({ payment_intent: order.paymentIntentId })
    } else if (order.paymentProvider === "paypal" && order.paymentProcessedId) {
      const client = getPayPalClient()
      if (!client) return NextResponse.json({ error: "PayPal not configured" }, { status: 500 })
      const reqRefund = new (paypal.payments as any).CapturesRefundRequest(order.paymentProcessedId)
      reqRefund.requestBody({
        amount: { currency_code: order.currency.toUpperCase(), value: (order.total / 100).toFixed(2) },
      })
      await client.execute(reqRefund)
    }
  } catch (e: any) {
    try { Sentry.captureException(e) } catch {}
    return NextResponse.json({ error: e?.message || "Refund provider error" }, { status: 500 })
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
      payload: { paymentProvider: order.paymentProvider, paymentIntentId: order.paymentIntentId, paymentProcessedId: order.paymentProcessedId },
      ip: getClientIp(req as any),
      userAgent: (req as any).headers.get("user-agent"),
    })
  } catch {}

  return NextResponse.json({ ok: true })
}