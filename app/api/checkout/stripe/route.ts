import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import Stripe from "stripe"

const stripeSecret = process.env.STRIPE_SECRET_KEY || ""
const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: "2024-06-20" }) : null

export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 })
  }
  const { orderId } = (await req.json().catch(() => ({}))) as { orderId?: string }
  if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 })

  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } })
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 })

  const paymentIntent = await stripe.paymentIntents.create({
    amount: order.total,
    currency: order.currency,
    metadata: { orderId: order.id, orderNumber: order.orderNumber },
    automatic_payment_methods: { enabled: true },
  })

  await prisma.order.update({
    where: { id: order.id },
    data: { status: "AWAITING_PAYMENT", paymentProvider: "stripe", paymentIntentId: paymentIntent.id },
  })

  return NextResponse.json({ clientSecret: paymentIntent.client_secret })
}