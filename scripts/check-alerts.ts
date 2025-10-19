import { prisma } from "../lib/db"
import { sendAlertEmail } from "../lib/email"

async function run() {
  const now = new Date()
  const since1h = new Date(now.getTime() - 60 * 60 * 1000)
  const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  // Low stock: products with inStock=false or stockLevel<=0
  const lowStock = await prisma.product.findMany({
    where: { OR: [{ inStock: false }, { stockLevel: { lte: 0 } }] },
    select: { id: true, name: true, stockLevel: true, reorderPoint: true, inStock: true },
    take: 20,
  })

  // Failed webhooks: infer from audit logs or metrics (if persisted)
  const webhookErrorsLastHour = await prisma.auditLog.count({
    where: {
      action: { in: ["webhook.error", "stripe.webhook.error", "carrier.webhook.error"] },
      createdAt: { gte: since1h },
    },
  })

  // High refund rates: refunds created last 24h / orders last 24h
  const ordersLast24 = await prisma.order.count({ where: { createdAt: { gte: since24h } } })
  const refundsLast24 = await prisma.refund.count({ where: { createdAt: { gte: since24h } } })
  const refundRate = ordersLast24 ? refundsLast24 / ordersLast24 : 0

  // Shipment SLA breaches: shipments stuck in PRE_TRANSIT/IN_TRANSIT for >7 days
  const stuckShipments = await prisma.shipment.findMany({
    where: {
      status: { in: ["PRE_TRANSIT", "IN_TRANSIT"] },
      shippedAt: { lte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
    },
    select: { id: true, orderId: true, status: true, shippedAt: true },
    take: 50,
  })

  const alerts: string[] = []

  if (lowStock.length > 0) alerts.push(`Low stock products: ${lowStock.length}`)
  if (webhookErrorsLastHour > 3) alerts.push(`Webhook errors in last hour: ${webhookErrorsLastHour}`)
  if (refundRate > 0.3) alerts.push(`High refund rate: ${(refundRate * 100).toFixed(1)}%`)
  if (stuckShipments.length > 0) alerts.push(`Shipments delayed >7d: ${stuckShipments.length}`)

  const recipient = process.env.ALERT_EMAIL || ""
  if (alerts.length && recipient) {
    try {
      await sendAlertEmail(recipient, {
        subject: "[NV Mercantile] Operational Alerts",
        body: alerts.join("\n"),
      })
      // Record an audit log entry
      await prisma.auditLog.create({ data: { action: "alerts.sent", payloadHash: "", ip: null, userAgent: null } as any })
    } catch {
      // ignore
    }
  }
}

run().then(() => process.exit(0))