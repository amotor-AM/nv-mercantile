import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { ProductCreateSchema } from "@/lib/validation"
import { getClientIp, logAdminAction } from "@/lib/security"
import { recomputeInStock, recomputeProductInStock } from "@/lib/inventory"

export async function GET() {
  const session = await auth()
  const role = (session as any)?.user?.role
  if (!["ADMIN", "MANAGER"].includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const items = await prisma.product.findMany({
    orderBy: { name: "asc" },
    take: 1000,
    include: { category: true },
  })
  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  const role = (session as any)?.user?.role
  if (!["ADMIN", "MANAGER"].includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const json = await req.json().catch(() => ({}))
  const parsed = ProductCreateSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 422 })
  }

  const body = parsed.data

  // Optional attribute governance validation
  const defs = await prisma.allowedAttribute.findMany({ where: { key: { in: ["material","leadTime","tolerance"] }, isActive: true } })
  const map = new Map(defs.map((d) => [d.key, d]))
  for (const key of ["material","leadTime","tolerance"] as const) {
    const def = map.get(key)
    const val = (body as any)[key]
    if (def && def.options.length && val && !def.options.includes(val)) {
      return NextResponse.json({ error: `Invalid ${key}: ${val}` }, { status: 422 })
    }
  }

  let categoryId: string | null = null
  if (body.categoryId) {
    categoryId = body.categoryId
  } else if (body.category) {
    const cat = await prisma.category.findUnique({ where: { slug: body.category } })
    categoryId = cat?.id ?? null
  }
  const stockLevel = body.stockLevel ?? 0
  const created = await prisma.product.create({
    data: {
      slug: body.slug,
      name: body.name,
      subtitle: body.subtitle ?? "",
      price: body.price,
      material: body.material ?? "",
      leadTime: body.leadTime ?? "2-3 weeks",
      description: body.description ?? "",
      image: body.image ?? "",
      dimensions: body.dimensions ?? "",
      weight: body.weight ?? "",
      specifications: body.specifications ?? {},
      applications: body.applications ?? [],
      inStock: recomputeInStock(stockLevel),
      stockLevel,
      safetyStock: body.safetyStock ?? 0,
      reorderPoint: body.reorderPoint ?? 0,
      leadTimeDays: body.leadTimeDays ?? 7,
      categoryId: categoryId ?? undefined,
    },
  })

  // Recompute product inStock aggregating variants (no-op if none yet)
  await recomputeProductInStock(prisma, created.id)

  await logAdminAction({
    userId: session?.user?.id ?? null,
    action: "product.create",
    targetType: "Product",
    targetId: created.id,
    payload: body,
    ip: getClientIp(req),
    userAgent: req.headers.get("user-agent"),
  })

  return NextResponse.json(created, { status: 201 })
}