import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"

export async function GET(req: NextRequest) {
  const session = await auth()
  if ((session as any)?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const productId = searchParams.get("productId") || undefined
  const days = Number(searchParams.get("days") || "90")

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  const items = await prisma.orderItem.findMany({
    where: {
      order: { createdAt: { gte: since }, status: "PAID" },
      ...(productId ? { productId } : {}),
    },
    include: { order: true },
    orderBy: { createdAt: "asc" },
  })

  // Aggregate per day
  const series = new Map<string, number>()
  for (const it of items) {
    const day = new Date(it.createdAt)
    day.setHours(0, 0, 0, 0)
    const key = day.toISOString()
    series.set(key, (series.get(key) || 0) + it.quantity)
  }

  const points = Array.from(series.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, qty]) => ({ date, qty }))

  // Simple exponential smoothing
  const alpha = 0.5
  let forecast = points.length ? points[0].qty : 0
  for (const p of points) {
    forecast = alpha * p.qty + (1 - alpha) * forecast
  }

  return NextResponse.json({ points, forecastDaily: forecast })
}