import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { limit } from "@/lib/rate-limit"
import { getClientIp } from "@/lib/security"

export async function GET(req: NextRequest) {
  // Basic public rate limit by IP to mitigate scraping/DoS on product listings
  const ip = getClientIp(req)
  const ok = await limit(`products:${ip}`)
  if (!ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  const { searchParams } = new URL(req.url)
  const page = Number(searchParams.get("page") ?? "1")
  const pageSize = Math.min(Number(searchParams.get("pageSize") ?? "20"), 100)
  const categorySlug = searchParams.get("category") ?? undefined
  const q = searchParams.get("q") ?? undefined
  const minPrice = searchParams.get("minPrice")
  const maxPrice = searchParams.get("maxPrice")
  const materials = searchParams.get("materials") // comma-separated
  const applications = searchParams.get("applications") // comma-separated
  const inStock = searchParams.get("inStock")
  const ratingMin = searchParams.get("ratingMin")
  const sort = searchParams.get("sort") // price_asc | price_desc | newest | rating_desc

  const where: any = {}
  if (categorySlug) where.category = { is: { slug: categorySlug } }
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { subtitle: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { material: { contains: q, mode: "insensitive" } },
      { applications: { hasSome: [q.toLowerCase()] } },
    ]
  }
  if (minPrice) {
    where.price = { ...(where.price || {}), gte: Number(minPrice) }
  }
  if (maxPrice) {
    where.price = { ...(where.price || {}), lte: Number(maxPrice) }
  }
  if (materials) {
    const list = materials.split(",").map((m) => m.trim()).filter(Boolean)
    if (list.length) where.material = { in: list }
  }
  if (applications) {
    const list = applications.split(",").map((a) => a.trim().toLowerCase()).filter(Boolean)
    if (list.length) where.applications = { hasSome: list }
  }
  if (inStock === "true") {
    where.OR = [...(where.OR || []), { inStock: true }, { stockLevel: { gt: 0 } }]
  }
  if (ratingMin) {
    where.rating = { gte: Number(ratingMin) }
  }

  let orderBy: any = { createdAt: "desc" }
  if (sort === "price_asc") orderBy = { price: "asc" }
  else if (sort === "price_desc") orderBy = { price: "desc" }
  else if (sort === "rating_desc") orderBy = { rating: "desc" }
  else if (sort === "newest") orderBy = { createdAt: "desc" }

  const [items, total, materialsAgg, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy,
      include: { category: true },
    }),
    prisma.product.count({ where }),
    prisma.product.groupBy({ by: ["material"], _count: { _all: true } }),
    prisma.category.findMany({
      where: { isVisible: true },
      orderBy: { order: "asc" },
      include: { _count: { select: { products: true } } },
    }),
  ])

  // derive application facets from current result set (could be from full set if needed)
  const appsCount = new Map<string, number>()
  for (const p of items) {
    for (const a of p.applications || []) {
      appsCount.set(a, (appsCount.get(a) || 0) + 1)
    }
  }
  const applicationsAgg = Array.from(appsCount.entries()).map(([name, count]) => ({ name, count }))

  const res = NextResponse.json({
    page,
    pageSize,
    total,
    items,
    facets: {
      categories: categories.map((c) => ({ slug: c.slug, name: c.name, count: c._count.products })),
      materials: materialsAgg.map((m) => ({ name: m.material, count: m._count._all })),
      applications: applicationsAgg,
    },
  })

  // Short TTL CDN caching
  const ttl = 120 // seconds
  res.headers.set("Cache-Control", `public, s-maxage=${ttl}, stale-while-revalidate=600`)
  res.headers.set("CDN-Cache-Control", `public, s-maxage=${ttl}`)
  res.headers.set("Vary", "Accept, Accept-Encoding")

  return res
}