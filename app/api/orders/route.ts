import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get("email") ?? undefined
  const userId = searchParams.get("userId") ?? undefined

  const where: any = {}
  if (userId) where.userId = userId
  if (email) where.email = email

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { items: true },
  })
  return NextResponse.json(orders)
}

export async function POST(req: NextRequest) {
  const data = await req.json().catch(() => null)
  if (!data) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })

  const { email, userId, items, shipping } = data as {
    email: string
    userId?: string
    items: { productId: string; name: string; price: number; quantity: number }[]
    shipping?: { name?: string; phone?: string; address?: string }
  }

  if (!email || !items?.length) {
    return NextResponse.json({ error: "Missing email or items" }, { status: 400 })
  }

  const products = await prisma.product.findMany({
    where: { id: { in: items.map((i) => i.productId) } },
  })
  const productMap = new Map(products.map((p) => [p.id, p]))

  const orderItems = items.map((i) => {
    const p = productMap.get(i.productId)
    if (!p) throw new Error("Invalid product: " + i.productId)
    return {
      productId: p.id,
      name: p.name,
      price: Math.round((i.price ?? p.price) * 100),
      quantity: i.quantity,
    }
  })

  const total = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0)

  const order = await prisma.order.create({
    data: {
      orderNumber: "NV-" + Date.now().toString(36).toUpperCase(),
      email,
      userId,
      status: "PENDING",
      total,
      currency: "usd",
      items: { create: orderItems },
      shippingName: shipping?.name,
      shippingPhone: shipping?.phone,
      shippingAddress: shipping?.address,
    },
    include: { items: true },
  })

  return NextResponse.json(order, { status: 201 })
}