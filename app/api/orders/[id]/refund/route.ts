import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import Stripe from "stripe"

export async function POST(_: Request, { params }: { params: { id: string } }) {
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
  return NextResponse.json({ ok: true })
}