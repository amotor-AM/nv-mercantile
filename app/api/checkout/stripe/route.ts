import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { prisma } from "@/lib/db"
import { limit } from "@/lib/rate-limit"
import { getClientIp } from "@/lib/security"
import * as Sentry from "@sentry/nextjs"

const stripeSecret = process.env.STRIPE_SECRET_KEY || ""
const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: "2024-06-20" }) : null

export async function POST(req: NextRequest) {
  // Rate limit checkout intent creation per IP
  const ip = getClientIp(req)
  const ok = await limit(`checkout:stripe:${ip}`)
  if (!ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 })

  if (!stripe) return NextResponse.json({ error: "Stripe not configured" }, { status: 500 })
  const { orderId } = (await req.json().catch(() => ({}))) as { orderId?: string }
  if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 })

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  })
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 })

  // Ensure total is up to date
  const amount = order.items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  let clientSecret: string | undefined

  try {
    if (order.paymentIntentId) {
      // Update existing PaymentIntent amount if needed
      const pi = await stripe.paymentIntents.retrieve(order.paymentIntentId)
      if (pi.status === "requires_payment_method" || pi.status === "requires_confirmation") {
        const updated = await stripe.paymentIntents.update(pi.id, {
          amount,
          currency: order.currency,
          metadata: { orderId: order.id, orderNumber: order.orderNumber },
          automatic_payment_methods: { enabled: true },
        })
        clientSecret = updated.client_secret || undefined
        await prisma.order.update({
          where: { id: order.id },
          data: { status: "AWAITING_PAYMENT", paymentProvider: "stripe", total: amount },
        })
      } else {
        // Create a new PI if previous is in a terminal state (rare)
        const created = await stripe.paymentIntents.create({
          amount,
          currency: order.currency,
          metadata: { orderId: order.id, orderNumber: order.orderNumber },
          automatic_payment_methods: { enabled: true },
        })
        clientSecret = created.client_secret || undefined
        await prisma.order.update({
          where: { id: order.id },
          data: { status: "AWAITING_PAYMENT", paymentProvider: "stripe", paymentIntentId: created.id, total: amount },
        })
      }
    } else {
      const pi = await stripe.paymentIntents.create({
        amount,
        currency: order.currency,
        metadata: { orderId: order.id, orderNumber: order.orderNumber },
        automatic_payment_methods: { enabled: true },
      })
      clientSecret = pi.client_secret || undefined
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "AWAITING_PAYMENT", paymentProvider: "stripe", paymentIntentId: pi.id, total: amount },
      })
    }
  } catch (e: any) {
    try { Sentry.captureException(e) } catch {}
    return NextResponse.json({ error: e.message }, { status: 500 })
  }

  if (!clientSecret) {
    return NextResponse.json({ error: "Unable to create payment" }, { status: 500 })
  }

  return NextResponse.json({ clientSecret })
}