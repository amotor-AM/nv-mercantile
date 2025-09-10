import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const page = Number(searchParams.get("page") ?? "1")
  const pageSize = Math.min(Number(searchParams.get("pageSize") ?? "20"), 100)
  const category = searchParams.get("category") ?? undefined
  const q = searchParams.get("q") ?? undefined

  const where: any = {}
  if (category) where.category = category
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { subtitle: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ]
  }

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.count({ where }),
  ])

  return NextResponse.json({
    page,
    pageSize,
    total,
    items,
  })
}