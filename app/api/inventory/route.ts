import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/auth"

export async function GET(req: NextRequest) {
  const session = await auth()
  if ((session as any)?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q") || ""
  const lowStockOnly = searchParams.get("lowStockOnly") === "true"

  const where: any = {}
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { subtitle: { contains: q, mode: "insensitive" } },
      { material: { contains: q, mode: "insensitive" } },
      { category: { contains: q, mode: "insensitive" } },
    ]
  }
  if (lowStockOnly) {
    where.OR = [
      { inStock: false },
      { stockLevel: { lte: 0 } },
    ]
  }

  const products = await prisma.product.findMany({
    where,
    orderBy: { name: "asc" },
    take: 500,
  })

  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
  const sales = await prisma.orderItem.groupBy({
    by: ["productId"],
    _sum: { quantity: true },
    where: {
      order: { createdAt: { gte: since }, status: "PAID" },
    },
  })
  const salesMap = new Map<string, number>()
  for (const s of sales) {
    salesMap.set(s.productId, s._sum.quantity ?? 0)
  }

  const items = products.map((p) => {
    const sold90 = salesMap.get(p.id) || 0
    const avgDaily = sold90 / 90
    const forecastLead = Math.round(avgDaily * p.leadTimeDays)
    const recommendedReorder = Math.max(0, forecastLead + p.safetyStock - p.stockLevel)
    return {
      id: p.id,
      name: p.name,
      stockLevel: p.stockLevel,
      safetyStock: p.safetyStock,
      reorderPoint: p.reorderPoint,
      leadTimeDays: p.leadTimeDays,
      inStock: p.inStock,
      avgDaily,
      forecastLead,
      recommendedReorder,
      material: p.material,
      category: p.category,
    }
  })

  return NextResponse.json({ items })
}