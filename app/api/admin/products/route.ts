import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { ProductCreateSchema } from "@/lib/validation"
import { getClientIp, logAdminAction } from "@/lib/security"

export async function GET() {
  const session = await auth()
  const role = (session as any)?.user?.role
  if (!["ADMIN", "MANAGER"].includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const items = await prisma.product.findMany({
    orderBy: { name: "asc" },
    take: 1000,
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
  const created = await prisma.product.create({
    data: {
      slug: body.slug,
      name: body.name,
      subtitle: body.subtitle ?? "",
      price: body.price,
      material: body.material ?? "",
      category: body.category ?? "",
      leadTime: body.leadTime ?? "2-3 weeks",
      description: body.description ?? "",
      image: body.image ?? "",
      dimensions: body.dimensions ?? "",
      weight: body.weight ?? "",
      specifications: body.specifications ?? {},
      applications: body.applications ?? [],
      inStock: true,
      stockLevel: body.stockLevel ?? 0,
      safetyStock: body.safetyStock ?? 0,
      reorderPoint: body.reorderPoint ?? 0,
      leadTimeDays: body.leadTimeDays ?? 7,
    },
  })

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