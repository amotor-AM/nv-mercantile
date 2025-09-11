import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"

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
  const body = await req.json().catch(() => ({}))
  const { slug, name, subtitle, price, material, category, leadTime } = body
  if (!slug || !name || typeof price !== "number") {
    return NextResponse.json({ error: "slug, name, price required" }, { status: 400 })
  }
  const created = await prisma.product.create({
    data: {
      slug, name, subtitle: subtitle ?? "", price, material: material ?? "", category: category ?? "", leadTime: leadTime ?? "2-3 weeks",
      description: body.description ?? "", image: body.image ?? "", dimensions: body.dimensions ?? "", weight: body.weight ?? "",
      specifications: body.specifications ?? {}, applications: body.applications ?? [],
      inStock: true, stockLevel: body.stockLevel ?? 0, safetyStock: body.safetyStock ?? 0, reorderPoint: body.reorderPoint ?? 0, leadTimeDays: body.leadTimeDays ?? 7,
    },
  })
  return NextResponse.json(created, { status: 201 })
}