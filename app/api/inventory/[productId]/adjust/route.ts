import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"

export async function POST(req: NextRequest, { params }: { params: { productId: string } }) {
  const session = await auth()
  const role = (session as any)?.user?.role
  if (!["ADMIN", "MANAGER"].includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { quantity, type, note } = (await req.json().catch(() => ({}))) as {
    quantity?: number
    type?: "RESTOCK" | "ADJUSTMENT"
    note?: string
  }

  if (!quantity || !type) {
    return NextResponse.json({ error: "quantity and type required" }, { status: 400 })
  }

  const product = await prisma.product.findUnique({ where: { id: params.productId } })
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 })

  let delta = quantity
  if (type === "ADJUSTMENT") {
    delta = quantity
  } else if (type === "RESTOCK") {
    delta = Math.abs(quantity)
  }

  const updated = await prisma.product.update({
    where: { id: product.id },
    data: {
      stockLevel: { increment: delta },
      inStock: product.inStock || delta > 0 ? true : product.inStock,
    },
  })

  await prisma.inventoryMovement.create({
    data: {
      productId: product.id,
      type,
      quantity: delta,
      note,
    },
  })

  return NextResponse.json({ ok: true, product: updated })
}