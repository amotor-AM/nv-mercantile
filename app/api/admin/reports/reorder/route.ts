import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { sendReorderReportEmail } from "@/lib/email"

export async function GET() {
  const session = await auth()
  const role = (session as any)?.user?.role
  if (!["ADMIN","MANAGER"].includes(role)) {
    return new Response("Unauthorized", { status: 401 })
  }

  const products = await prisma.product.findMany({
    orderBy: { name: "asc" },
    take: 1000,
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

  const rows = products
    .map((p) => {
      const sold90 = salesMap.get(p.id) || 0
      const avgDaily = sold90 / 90
      const forecastLead = Math.round(avgDaily * p.leadTimeDays)
      const recommendedReorder = Math.max(0, forecastLead + p.safetyStock - p.stockLevel)
      return {
        id: p.id,
        name: p.name,
        recommendedReorder,
        leadTimeDays: p.leadTimeDays,
      }
    })
    .filter((r) => r.recommendedReorder > 0)
    .slice(0, 200)

  try { await sendReorderReportEmail(rows) } catch {}

  return new Response(JSON.stringify({ count: rows.length }), { status: 200 })
}