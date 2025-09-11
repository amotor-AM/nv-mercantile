import { Resend } from "resend"
import { render } from "@react-email/render"
import OrderConfirmationEmail from "@/emails/templates/OrderConfirmationEmail"
import SignInEmail from "@/emails/templates/SignInEmail"
import OrderShippedEmail from "@/emails/templates/OrderShippedEmail"
import RefundProcessedEmail from "@/emails/templates/RefundProcessedEmail"
import { prisma } from "./db"

const resendApiKey = process.env.RESEND_API_KEY || ""
const from = process.env.RESEND_FROM || "NV Mercantile <no-reply@example.com>"

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