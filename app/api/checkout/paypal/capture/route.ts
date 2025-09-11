import { NextRequest, NextResponse } from "next/server"
import paypal from "@paypal/checkout-server-sdk"
import { prisma } from "@/lib/db"
import { sendOrderConfirmationEmail } from "@/lib/email"

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

export async function GET(req: NextRequest) {
  const client = getPayPalClient()
  if (!client) return NextResponse.json({ error: "PayPal not configured" }, { status: 500 })
  const { searchParams } = new URL(req.url)
  const token = searchParams.get("token")
  if (!token) return NextResponse.json({ error: "token required" }, { status: 400 })

  const captureReq = new paypal.orders.OrdersCaptureRequest(token)
  captureReq.requestBody({})

  try {
    const response = await client.execute(captureReq as any)
    // Update order to PAID and decrement stock
    const order = await prisma.order.findFirst({
      where: { paymentIntentId: token },
      include: { items: true },
    })
    if (order) {
      await prisma.order.update({ where: { id: order.id }, data: { status: "PAID" } })
      for (const it of order.items) {
        await prisma.product.update({
          where: { id: it.productId },
          data: {
            stockLevel: { decrement: it.quantity },
          },
        })
        const prod = await prisma.product.findUnique({ where: { id: it.productId } })
        if (prod && prod.stockLevel - it.quantity <= 0) {
          await prisma.product.update({ where: { id: it.productId }, data: { inStock: false } })
        }
        await prisma.inventoryMovement.create({
          data: {
            productId: it.productId,
            type: "SALE",
            quantity: -Math.abs(it.quantity),
            note: `Order ${order.orderNumber}`,
          },
        })
      }
      try {
        await sendOrderConfirmationEmail(order.id)
      } catch {}
    }
    return NextResponse.json({ ok: true, result: response.result })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}