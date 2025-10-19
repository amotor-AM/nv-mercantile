import { Resend } from "resend"
import { render } from "@react-email/render"
import OrderConfirmationEmail from "@/emails/templates/OrderConfirmationEmail"
import SignInEmail from "@/emails/templates/SignInEmail"
import OrderShippedEmail from "@/emails/templates/OrderShippedEmail"
import RefundProcessedEmail from "@/emails/templates/RefundProcessedEmail"
import ShipmentOutForDeliveryEmail from "@/emails/templates/ShipmentOutForDeliveryEmail"
import ShipmentDeliveredEmail from "@/emails/templates/ShipmentDeliveredEmail"
import ShipmentExceptionEmail from "@/emails/templates/ShipmentExceptionEmail"
import { prisma } from "./db"

const resendApiKey = process.env.RESEND_API_KEY || ""
const from = process.env.RESEND_FROM || "NV Mercantile <no-reply@example.com>"
const inventoryAlertTo = process.env.INVENTORY_ALERT_EMAIL || ""

export const resend = resendApiKey ? new Resend(resendApiKey) : null

export async function sendOrderConfirmationEmail(orderId: string) {
  if (!resend) return

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: true } } },
  })
  if (!order) return

  const html = render(
    OrderConfirmationEmail({
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      total: order.total,
      currency: order.currency,
      items: order.items.map((it) => ({
        name: it.name,
        quantity: it.quantity,
        price: it.price,
      })),
      shippingName: order.shippingName || "",
      shippingAddress: order.shippingAddress || "",
    })
  )

  await resend.emails.send({
    from,
    to: [order.email],
    subject: `Your NV Mercantile Order ${order.orderNumber} is confirmed`,
    html,
  })
}

export async function sendOrderShippedEmail(orderId: string, opts?: { trackingUrl?: string; trackingNumber?: string }) {
  if (!resend) return
  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order) return
  const html = render(
    OrderShippedEmail({
      orderNumber: order.orderNumber,
      trackingUrl: opts?.trackingUrl,
      trackingNumber: opts?.trackingNumber,
    })
  )
  await resend.emails.send({
    from,
    to: [order.email],
    subject: `Your NV Mercantile Order ${order.orderNumber} has shipped`,
    html,
  })
}

export async function sendShipmentOutForDeliveryEmail(orderId: string, opts?: { trackingUrl?: string; trackingNumber?: string }) {
  if (!resend) return
  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order) return
  const html = render(
    ShipmentOutForDeliveryEmail({
      orderNumber: order.orderNumber,
      trackingUrl: opts?.trackingUrl,
      trackingNumber: opts?.trackingNumber,
    })
  )
  await resend.emails.send({
    from,
    to: [order.email],
    subject: `Order ${order.orderNumber} is out for delivery`,
    html,
  })
}

export async function sendShipmentDeliveredEmail(orderId: string, opts?: { trackingUrl?: string; trackingNumber?: string }) {
  if (!resend) return
  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order) return
  const html = render(
    ShipmentDeliveredEmail({
      orderNumber: order.orderNumber,
      trackingUrl: opts?.trackingUrl,
      trackingNumber: opts?.trackingNumber,
    })
  )
  await resend.emails.send({
    from,
    to: [order.email],
    subject: `Order ${order.orderNumber} has been delivered`,
    html,
  })
}

export async function sendShipmentExceptionEmail(orderId: string, opts?: { trackingUrl?: string; trackingNumber?: string }) {
  if (!resend) return
  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order) return
  const html = render(
    ShipmentExceptionEmail({
      orderNumber: order.orderNumber,
      trackingUrl: opts?.trackingUrl,
      trackingNumber: opts?.trackingNumber,
    })
  )
  await resend.emails.send({
    from,
    to: [order.email],
    subject: `Issue with your Order ${order.orderNumber} shipment`,
    html,
  })
}

export async function sendRefundEmail(orderId: string) {
  if (!resend) return
  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order) return
  const html = render(
    RefundProcessedEmail({
      orderNumber: order.orderNumber,
      amount: order.total,
      currency: order.currency,
    })
  )
  await resend.emails.send({
    from,
    to: [order.email],
    subject: `Your refund for Order ${order.orderNumber} was processed`,
    html,
  })
}

export async function sendSignInEmail(to: string, url: string) {
  if (!resend) return

  const html = render(SignInEmail({ url }))

  await resend.emails.send({
    from,
    to: [to],
    subject: "Sign in to NV Mercantile",
    html,
  })
}

export async function sendRmaRequestedEmail(orderId: string, rmaId: string) {
  if (!resend) return
  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order) return
  const html = `<p>We received your return request (RMA ${rmaId}) for Order ${order.orderNumber}. Our team will review it shortly.</p>`
  await resend.emails.send({
    from,
    to: [order.email],
    subject: `Return request received for Order ${order.orderNumber}`,
    html,
  })
}

export async function sendRmaApprovedEmail(orderId: string, rmaId: string) {
  if (!resend) return
  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order) return
  const html = `<p>Your return request (RMA ${rmaId}) for Order ${order.orderNumber} has been approved. Please ship your items back.</p>`
  await resend.emails.send({
    from,
    to: [order.email],
    subject: `RMA Approved for Order ${order.orderNumber}`,
    html,
  })
}

export async function sendLowStockReportEmail(items: { name: string; stockLevel: number; safetyStock: number; reorderPoint: number }[]) {
  if (!resend || !inventoryAlertTo) return
  const rows = items.map((i) => `<li>${i.name}: stock ${i.stockLevel} (safety ${i.safetyStock}, reorder ${i.reorderPoint})</li>`).join("")
  const html = `<h3>Low Stock Alert</h3><ul>${rows}</ul>`
  await resend.emails.send({ from, to: [inventoryAlertTo], subject: "Low stock alert", html })
}

export async function sendReorderReportEmail(
  rows: { name: string; recommendedReorder: number; leadTimeDays: number }[]
) {
  if (!resend || !inventoryAlertTo) return
  const list = rows.map((r) => `<li>${r.name}: reorder ${r.recommendedReorder} (lead ${r.leadTimeDays} days)</li>`).join("")
  const html = `<h3>Reorder Recommendations</h3><ul>${list}</ul>`
  await resend.emails.send({ from, to: [inventoryAlertTo], subject: "Reorder recommendations", html })
}