import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/auth"
import { OrderCreateSchema } from "@/lib/validation"
import { normalizeCountryCode } from "@/lib/utils"
import { limit } from "@/lib/rate-limit"
import { getClientIp } from "@/lib/security"
import * as Sentry from "@sentry/nextjs"

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
  // Rate limit order creation per IP
  const ip = getClientIp(req)
  const ok = await limit(`orders:create:${ip}`)
  if (!ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 })

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

  const normalizedCountry = normalizeCountryCode(shipping?.country) || shipping?.country || "US"

  // Server-side address verification via Google Geocoding API (optional but enforced if key present)
  const geocodeKey = process.env.GOOGLE_MAPS_GEOCODE_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""
  let normalizedAddress1 = shipping?.addressLine1 || ""
  let normalizedAddress2 = shipping?.addressLine2 || ""
  let normalizedCity = shipping?.city || ""
  let normalizedState = shipping?.state || ""
  let normalizedPostal = shipping?.postalCode || ""
  let normalizedLat = shipping?.lat
  let normalizedLng = shipping?.lng

  const addressToCheck =
    [shipping?.addressLine1, shipping?.addressLine2, shipping?.city, shipping?.state, shipping?.postalCode, normalizedCountry]
      .filter(Boolean)
      .join(" ") || [shipping?.address, normalizedCountry].filter(Boolean).join(" ")

  if (geocodeKey && addressToCheck) {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addressToCheck)}&key=${geocodeKey}`
      const resp = await fetch(url)
      const data = await resp.json()
      if (data.status !== "OK" || !Array.isArray(data.results) || data.results.length === 0) {
        return NextResponse.json({ error: "Invalid address" }, { status: 422 })
      }
      const best = data.results[0]
      const comps = best.address_components || []
      const getComp = (type: string) => comps.find((c: any) => (c.types || []).includes(type))
      const streetNumber = getComp("street_number")?.short_name || ""
      const route = getComp("route")?.short_name || ""
      const locality = getComp("locality")?.short_name || getComp("postal_town")?.short_name || ""
      const admin1 = getComp("administrative_area_level_1")?.short_name || ""
      const postal = getComp("postal_code")?.short_name || ""
      const countryShort = getComp("country")?.short_name || normalizedCountry

      normalizedAddress1 = [streetNumber, route].filter(Boolean).join(" ") || normalizedAddress1
      normalizedCity = locality || normalizedCity
      normalizedState = admin1 || normalizedState
      normalizedPostal = postal || normalizedPostal
      const countryNorm = normalizeCountryCode(countryShort) || normalizedCountry

      normalizedLat = best.geometry?.location?.lat ?? normalizedLat
      normalizedLng = best.geometry?.location?.lng ?? normalizedLng

      // Override normalizedCountry with geocode result
      // Use 2-letter code where possible
      const finalCountry = countryNorm || normalizedCountry

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
          shippingAddress1: normalizedAddress1 || shipping?.addressLine1,
          shippingAddress2: normalizedAddress2 || shipping?.addressLine2,
          shippingCity: normalizedCity || shipping?.city,
          shippingState: normalizedState || shipping?.state,
          shippingPostalCode: normalizedPostal || shipping?.postalCode,
          shippingCountry: finalCountry,
          shippingLat: normalizedLat,
          shippingLng: normalizedLng,
        },
        include: { items: true },
      })

      return NextResponse.json(order, { status: 201 })
    } catch (e) {
      try { Sentry.captureException(e as any) } catch {}
      return NextResponse.json({ error: "Address verification failed" }, { status: 500 })
    }
  }

  // Fallback without geocoding
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
      shippingCountry: normalizedCountry,
      shippingLat: shipping?.lat,
      shippingLng: shipping?.lng,
    },
    include: { items: true },
  })

  return NextResponse.json(order, { status: 201 })
}