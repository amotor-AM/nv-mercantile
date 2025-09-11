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

export async function GET(req: NextRequest) {
  const client = getPayPalClient()
  if (!client) return NextResponse.json({ error: "PayPal not configured" }, { status: 500 })

  const { searchParams } = new URL(req.url)
  const token = searchParams.get("token")
  if (!token) return NextResponse.json({ error: "token required" }, { status: 400 })

  const captureReq = new paypal.orders.OrdersCaptureRequest(token)
  captureReq.requestBody({})
  const response = await client.execute(captureReq as any)

  // Attempt to locate order by custom_id from original create request
  const purchase = (response.result.purchase_units || [])[0]
  const customId = purchase?.custom_id
  if (customId) {
    await prisma.order.update({
      where: { id: customId },
      data: { status: "PAID", paymentProvider: "paypal" },
    })
  }

  return NextResponse.json({ ok: true })
}