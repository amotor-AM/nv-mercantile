import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { InventoryAdjustSchema } from "@/lib/validation"
import { getClientIp, logAdminAction } from "@/lib/security"

export async function POST(req: NextRequest, { params }: { params: { productId: string } }) {
  const session = await auth()
  const role = (session as any)?.user?.role
  if (!["ADMIN", "MANAGER"].includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const json = await req.json().catch(() => ({}))
  const parsed = InventoryAdjustSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 422 })
  }
  const { quantity, type, note } = parsed.data

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

  await logAdminAction({
    userId: session?.user?.id ?? null,
    action: "inventory.adjust",
    targetType: "Product",
    targetId: product.id,
    payload: { quantity, type, note },
    ip: getClientIp(req),
    userAgent: req.headers.get("user-agent"),
  })

  return NextResponse.json({ ok: true, product: updated })
}