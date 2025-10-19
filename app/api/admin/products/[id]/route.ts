import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { ProductUpdateSchema } from "@/lib/validation"
import { getClientIp, logAdminAction } from "@/lib/security"
import { recomputeInStock } from "@/lib/inventory"

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  const role = (session as any)?.user?.role
  if (!["ADMIN", "MANAGER"].includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const json = await req.json().catch(() => ({}))
  const parsed = ProductUpdateSchema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 422 })

  const data = { ...parsed.data } as any
  if (parsed.data.categoryId) {
    data.categoryId = parsed.data.categoryId
  } else if (typeof (parsed.data as any).category === "string") {
    const cat = await prisma.category.findUnique({ where: { slug: (parsed.data as any).category } })
    data.categoryId = cat?.id ?? null
    delete data.category
  }

  // If stockLevel is being updated and inStock was not explicitly provided, recompute inStock
  if (Object.prototype.hasOwnProperty.call(parsed.data, "stockLevel") && typeof parsed.data.stockLevel === "number" && !Object.prototype.hasOwnProperty.call(parsed.data, "inStock")) {
    data.inStock = recomputeInStock(parsed.data.stockLevel)
  }

  const updated = await prisma.product.update({ where: { id: params.id }, data })
  await logAdminAction({
    userId: session?.user?.id ?? null,
    action: "product.update",
    targetType: "Product",
    targetId: params.id,
    payload: parsed.data,
    ip: getClientIp(req),
    userAgent: req.headers.get("user-agent"),
  })
  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  const role = (session as any)?.user?.role
  if (!["ADMIN", "MANAGER"].includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  await prisma.product.delete({ where: { id: params.id } })
  await logAdminAction({
    userId: session?.user?.id ?? null,
    action: "product.delete",
    targetType: "Product",
    targetId: params.id,
    payload: {},
    ip: getClientIp(req),
    userAgent: req.headers.get("user-agent"),
  })
  return NextResponse.json({ ok: true })
}