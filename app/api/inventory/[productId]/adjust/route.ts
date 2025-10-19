import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { InventoryAdjustSchema } from "@/lib/validation"
import { getClientIp, logAdminAction } from "@/lib/security"
import { nextStockState, recomputeProductInStock } from "@/lib/inventory"

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

  // Atomic transaction with serializable isolation to avoid race conditions
  const updated = await prisma.$transaction(async (tx) => {
    const fresh = await tx.product.findUnique({ where: { id: product.id }, select: { stockLevel: true } })
    const { stockLevel } = nextStockState(fresh?.stockLevel ?? 0, delta)
    const upd = await tx.product.update({
      where: { id: product.id },
      data: {
        stockLevel,
      },
    })
    await tx.inventoryMovement.create({
      data: {
        productId: product.id,
        type,
        quantity: delta,
        note,
      },
    })
    // Recompute inStock from product stock and variant aggregates
    await recomputeProductInStock(tx, product.id)
    // Return product after recompute
    return tx.product.findUnique({ where: { id: product.id } })
  }, { isolationLevel: "Serializable" } as any)

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