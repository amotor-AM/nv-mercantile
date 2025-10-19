import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { getSeries } from "@/lib/metrics"

export async function GET(req: NextRequest) {
  const session = await auth()
  const role = (session as any)?.user?.role
  if (!["ADMIN", "MANAGER"].includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  // Orders per hour (last 24h)
  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: since24h } },
    select: { createdAt: true, status: true, paymentProvider: true },
  })
  const hoursMap: Record<string, number> = {}
  for (const o of orders) {
    const bucket = `${o.createdAt.getFullYear()}-${String(o.createdAt.getMonth() + 1).padStart(2, "0")}-${String(o.createdAt.getDate()).padStart(2, "0")} ${String(o.createdAt.getHours()).padStart(2, "0")}`
    hoursMap[bucket] = (hoursMap[bucket] || 0) + 1
  }
  const ordersPerHour = Object.entries(hoursMap).map(([bucket, count]) => ({ bucket, count })).sort((a, b) => (a.bucket < b.bucket ? -1 : 1))

  // Conversion rate (last 24h): paid or fulfilled / total
  const totalOrders = orders.length
  const converted = orders.filter((o) => o.status === "PAID" || o.status === "FULFILLED").length
  const conversionRate = totalOrders ? converted / totalOrders : 0

  // Payment success ratio (Stripe and PayPal)
  const stripeOrders = orders.filter((o) => o.paymentProvider === "stripe")
  const paypalOrders = orders.filter((o) => o.paymentProvider === "paypal")
  const stripePaid = stripeOrders.filter((o) => o.status === "PAID").length
  const paypalPaid = paypalOrders.filter((o) => o.status === "PAID").length
  const stripeSuccessRatio = stripeOrders.length ? stripePaid / stripeOrders.length : 0
  const paypalSuccessRatio = paypalOrders.length ? paypalPaid / paypalOrders.length : 0

  // Webhook error/ok counts from Redis metrics
  const series = await getSeries(["webhook_error_stripe", "webhook_ok_stripe", "webhook_error_carrier", "webhook_ok_carrier"], 24)
  const webhook = {
    stripe: {
      ok: series.webhook_ok_stripe.reduce((s, p) => s + p.value, 0),
      error: series.webhook_error_stripe.reduce((s, p) => s + p.value, 0),
    },
    carrier: {
      ok: series.webhook_ok_carrier.reduce((s, p) => s + p.value, 0),
      error: series.webhook_error_carrier.reduce((s, p) => s + p.value, 0),
    },
  }

  // Shipment exceptions (last 24h)
  const shipmentExceptions = await prisma.shipment.count({
    where: { status: "EXCEPTION", updatedAt: { gte: since24h } },
  })

  // Low stock (current)
  const lowStockCount = await prisma.product.count({
    where: {
      OR: [{ inStock: false }, { stockLevel: { lte: 0 } }],
    },
  })

  return NextResponse.json({
    ordersPerHour,
    conversionRate,
    paymentSuccessRatio: { stripe: stripeSuccessRatio, paypal: paypalSuccessRatio },
    webhook,
    shipmentExceptions,
    lowStockCount,
    series,
  })
}