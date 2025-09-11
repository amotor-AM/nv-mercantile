import { NextRequest, NextResponse } from "next/server"
import paypal from "@paypal/checkout-server-sdk"
import { prisma } from "@/lib/db"

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

export async function POST(req: NextRequest) {
  const client = getPayPalClient()
  if (!client) return NextResponse.json({ error: "PayPal not configured" }, { status: 500 })
  const { orderId } = (await req.json().catch(() => ({}))) as { orderId?: string }
  if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 })

  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } })
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 })

  const request = new paypal.orders.OrdersCreateRequest()
  request.prefer("return=representation")
  request.requestBody({
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: {
          currency_code: order.currency.toUpperCase(),
          value: (order.total / 100).toFixed(2),
        },
        custom_id: order.id,
      },
    ],
    application_context: {
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/order-confirmation?provider=paypal`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout?cancelled=1`,
    },
  })

  const response = await client.execute(request as any)
  await prisma.order.update({
    where: { id: order.id },
    data: { status: "AWAITING_PAYMENT", paymentProvider: "paypal", paymentIntentId: String(response.result.id) },
  })

  const approve = response.result.links?.find((l: any) => l.rel === "approve")?.href
  return NextResponse.json({ id: response.result.id, approveUrl: approve })
}