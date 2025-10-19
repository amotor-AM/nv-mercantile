import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { recomputeProductInStock } from "@/lib/inventory"

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  const role = (session as any)?.user?.role
  if (!["ADMIN","MANAGER"].includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const variants = await prisma.variant.findMany({ where: { productId: params.id }, orderBy: { createdAt: "desc" } })
  return NextResponse.json(variants)
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  const role = (session as any)?.user?.role
  if (!["ADMIN","MANAGER"].includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const body = await req.json().catch(() => ({}))
  const { sku, price, attributes, stockLevel } = body
  if (!sku || typeof price !== "number") {
    return NextResponse.json({ error: "sku and price required" }, { status: 400 })
  }
  const v = await prisma.variant.create({
    data: {
      productId: params.id,
      sku,
      price,
      attributes: attributes ?? {},
      stockLevel: Number(stockLevel ?? 0),
    },
  })
  // Recompute product inStock based on aggregate variant + product stock
  await recomputeProductInStock(prisma, params.id)
  return NextResponse.json(v, { status: 201 })
}