import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { prisma } from "@/lib/db"
import { sendOrderConfirmationEmail } from "@/lib/email"
import { incCounter } from "@/lib/metrics"
import { getClientIp, logAdminAction } from "@/lib/security"

import { computeBoundedStockLevel, recomputeProductInStock } from "@/lib/inventory"

async function finalizePaidOrder(orderId: string, paymentIntentId?: string) {
  const allowBackorder = (process.env.ALLOW_BACKORDER || "false").toLowerCase() === "true"

  // Update order and decrement stock from items
  const order = await prisma.order.update({
    where: { id: orderId },
    data: { status: "PAID", ...(paymentIntentId ? { paymentIntentId } : {}) },
    include: { items: true },
  })

  // Idempotency guard: if SALE movements already exist for this order, skip processing
  // This checks per item to also support partial order updates if necessary.
  for (const it of order.items) {
    const already = await prisma.inventoryMovement.findFirst({
      where: { productId: it.productId, type: "SALE", note: `Order ${order.orderNumber}` },
    })
    if (already) continue

    const product = await prisma.product.findUnique({ where: { id: it.productId } })
    if (!product) continue
    const nextLevel = computeBoundedStockLevel(product.stockLevel ?? 0, -Math.abs(it.quantity), allowBackorder)
    await prisma.product.update({
      where: { id: it.productId },
      data: {
        stockLevel: nextLevel, // set explicitly to avoid multiple writes
      },
    })

    await prisma.inventoryMovement.create({
      data: {
        productId: it.productId,
        type: "SALE",
        quantity: -Math.abs(it.quantity),
        note: `Order ${order.orderNumber}`,
      },
    })

    await recomputeProductInStock(prisma, it.productId)
  }

  // Metrics: count successful payments
  await incCounter("payment_success")

  // Send order confirmation email (best-effort)
  try {
    await sendOrderConfirmationEmail(orderId)
  } catch (e) {
    // swallow email errors
  }
}

export async function POST(req: NextRequest) {
  const stripeSecret = process.env.STRIPE_SECRET_KEY || ""
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ""
  if (!stripeSecret || !webhookSecret) {
    await incCounter("webhook_error_stripe")
    try {
      await logAdminAction({
        action: "webhook.error",
        targetType: "Stripe",
        targetId: null,
        payload: { reason: "not_configured" },
        ip: getClientIp(req),
        userAgent: req.headers.get("user-agent"),
      })
    } catch {}
    return NextResponse.json({ error: "Stripe webhook not configured" }, { status: 500 })
  }

  const payload = await req.text()
  const sig = req.headers.get("stripe-signature") || ""
  const stripe = new Stripe(stripeSecret, { apiVersion: "2024-06-20" })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(payload, sig, webhookSecret)
  } catch (err: any) {
    await incCounter("webhook_error_stripe")
    try {
      await logAdminAction({
        action: "webhook.error",
        targetType: "Stripe",
        targetId: null,
        payload: { error: err?.message || String(err) },
        ip: getClientIp(req),
        userAgent: req.headers.get("user-agent"),
      })
    } catch {}
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 })
  }

  await incCounter("webhook_ok_stripe")

  switch (event.type) {
    case "payment_intent.succeeded": {
      const pi = event.data.object as Stripe.PaymentIntent
      const orderId = pi.metadata?.orderId
      if (orderId) {
        await finalizePaidOrder(orderId, pi.id)
      }
      break
    }
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session
      const orderId = (session.metadata as any)?.orderId || session.client_reference_id || ""
      if (orderId) {
        await finalizePaidOrder(orderId, String(session.payment_intent ?? ""))
      }
      break
    }
    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge
      const orderId = (charge.metadata as any)?.orderId
      if (orderId) {
        await prisma.order.update({
          where: { id: orderId },
          data: { status: "REFUNDED", refundStatus: "FULL" },
        })
      }
      break
    }
    default:
      break
  }

  return NextResponse.json({ received: true })
}

export const config = {
  api: {
    bodyParser: false,
  },
}