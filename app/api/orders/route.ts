import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/auth"
import { OrderCreateSchema } from "@/lib/validation"
import { normalizeCountryCode } from "@/lib/utils"

export async function GET(req: NextRequest) {
  const session = await auth()
  const role = (session as any)?.user?.role
  const isPrivileged = ["ADMIN","MANAGER","SUPPORT"].includes(role)

  const { searchParams } = new URL(req.url)
  const emailParam = searchParams.get("email") ?? undefined
  const userIdParam = searchParams.get("userId") ?? undefined

  const where: any = {}

  if (isPrivileged) {
    if (userIdParam) where.userId = userIdParam
    if (emailParam) where.email = emailParam
  } else {
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    // Non-admin can only view their own orders
    where.OR = [
      { userId: session.user.id },
      ...(session.user.email ? [{ email: session.user.email }] : []),
    ]
  }

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      items: true,
      ...(isPrivileged ? { rmas: { include: { items: { include: { orderItem: true } } } } } : {}),
    } as any,
  })
  return NextResponse.json(orders)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  const json = await req.json().catch(() => null)
  if (!json) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })

  const parsed = OrderCreateSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 422 })
  }
  const { email, userId, items, shipping } = parsed.data

  const ids = items.map((i) => i.productId)
  const products = await prisma.product.findMany({
    where: {
      OR: [
        { id: { in: ids } },
        { slug: { in: ids } },
      ],
    },
  })
  const productMap = new Map<string, (typeof products)[number]>()
  for (const p of products) {
    productMap.set(p.id, p)
    productMap.set(p.slug, p)
  }

  const allowBackorder = (process.env.ALLOW_BACKORDER || "false").toLowerCase() === "true"
  if (!allowBackorder) {
    for (const it of items) {
      const p = productMap.get(it.productId)
      if (!p) return NextResponse.json({ error: `Invalid product ${it.productId}` }, { status: 400 })
      if ((p.stockLevel ?? 0) < it.quantity) {
        return NextResponse.json({ error: "Insufficient stock", productId: p.id }, { status: 409 })
      }
    }
  }

  const orderItems = items.map((i) => {
    const p = productMap.get(i.productId)
    if (!p) throw new Error("Invalid product: " + i.productId)
    return {
      productId: p.id,
      name: p.name,
      price: Math.round(p.price * 100), // never trust client price
      quantity: i.quantity,
    }
  })

  const total = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0)

  const order = await prisma.order.create({
    data: {
      orderNumber: "NV-" + Date.now().toString(36).toUpperCase(),
      email,
      userId: session?.user?.id ?? userId,
      status: "PENDING",
      total,
      currency: "usd",
      items: { create: orderItems },
      shippingName: shipping?.name,
      shippingPhone: shipping?.phone,
      shippingAddress: shipping?.address,
      shippingAddress1: shipping?.addressLine1,
      shippingAddress2: shipping?.addressLine2,
      shippingCity: shipping?.city,
      shippingState: shipping?.state,
      shippingPostalCode: shipping?.postalCode,
      shippingCountry: shipping?.country,
      shippingLat: shipping?.lat,
      shippingLng: shipping?.lng,
    },
    include: { items: true },
  })

  return NextResponse.json(order, { status: 201 })
}