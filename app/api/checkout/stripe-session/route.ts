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

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: `${baseUrl}/order-confirmation?order=${order.id}`,
    cancel_url: `${baseUrl}/checkout?cancelled=1`,
    client_reference_id: order.id,
    metadata: { orderId: order.id, orderNumber: order.orderNumber },
    line_items: order.items.map((i) => ({
      quantity: i.quantity,
      price_data: {
        currency: order.currency,
        unit_amount: i.price,
        product_data: {
          name: i.name,
          metadata: { productId: i.productId },
        },
      },
    })),
  })

  await prisma.order.update({
    where: { id: order.id },
    data: { status: "AWAITING_PAYMENT", paymentProvider: "stripe", paymentIntentId: String(session.payment_intent) },
  })

  return NextResponse.json({ url: session.url })
}