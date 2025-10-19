import { NextRequest, NextResponse } from "next/server"
import paypal from "@paypal/checkout-server-sdk"
import { prisma } from "@/lib/db"
import { incCounter } from "@/lib/metrics"
import { computeBoundedStockLevel, recomputeProductInStock } from "@/lib/inventory"
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
  const response = await client.execute(captureReq as any)

  // Attempt to locate order by custom_id from original create request
  const purchase = (response.result.purchase_units || [])[0]
  const customId = purchase?.custom_id
  if (customId) {
    const allowBackorder = (process.env.ALLOW_BACKORDER || "false").toLowerCase() === "true"
    const order = await prisma.order.update({
      where: { id: customId },
      data: { status: "PAID", paymentProvider: "paypal" },
      include: { items: true },
    })

    // Idempotency guard per item: skip if SALE movement already exists for this order
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
        data: { stockLevel: nextLevel },
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

    await incCounter("payment_success")
  }

  return NextResponse.json({ ok: true })
}