import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { addDays, formatISO9075 } from "date-fns"

function fmt(d: Date) {
  return formatISO9075(d, { representation: "date" })
}

export async function GET() {
  const session = await auth()
  const role = (session as any)?.user?.role
  if (!["ADMIN","MANAGER"].includes(role)) {
    return new Response("Unauthorized", { status: 401 })
  }

  const today = new Date()
  const start = addDays(today, -90)

  // Sales series
  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: start }, status: { in: ["PAID","FULFILLED","REFUNDED"] } },
    orderBy: { createdAt: "asc" },
    select: { createdAt: true, total: true },
  })
  const salesMap: Record<string, number> = {}
  for (const o of orders) {
    const key = fmt(o.createdAt)
    salesMap[key] = (salesMap[key] || 0) + o.total / 100
  }
  const days: string[] = []
  for (let d = new Date(start); d <= today; d = addDays(d, 1)) days.push(fmt(d))
  const salesSeries = days.map((date) => ({ date, revenue: Number((salesMap[date] || 0).toFixed(2)) }))

  // Top products by revenue
  const items = await prisma.orderItem.groupBy({
    by: ["productId"],
    _sum: { quantity: true, price: true },
  })
  const productIds = items.map((i) => i.productId)
  const prods = await prisma.product.findMany({ where: { id: { in: productIds } } })
  const nameMap = new Map(prods.map((p) => [p.id, p.name]))
  const topProducts = items
    .map((it) => ({
      productId: it.productId,
      revenue: (it._sum.price || 0) / 100,
      name: nameMap.get(it.productId) || it.productId,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 12)

  // Cohort retention (monthly)
  // cohort key = first order month (YYYY-MM)
  const allOrders = await prisma.order.findMany({
    where: { createdAt: { gte: addDays(today, -365) } },
    orderBy: { createdAt: "asc" },
    select: { email: true, createdAt: true, id: true },
  })
  const byEmail = new Map<string, { createdAt: Date }[]>()
  for (const o of allOrders) {
    const arr = byEmail.get(o.email) || []
    arr.push({ createdAt: o.createdAt })
    byEmail.set(o.email, arr)
  }
  const cohortsTmp: Record<string, number[]> = {}
  for (const [email, list] of byEmail) {
    list.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    const first = list[0].createdAt
    const cohort = `${first.getFullYear()}-${String(first.getMonth() + 1).padStart(2, "0")}`
    const vals = cohortsTmp[cohort] || Array(6).fill(0)
    for (const o of list) {
      const diffMonths = (o.createdAt.getFullYear() - first.getFullYear()) * 12 + (o.createdAt.getMonth() - first.getMonth())
      if (diffMonths >= 0 && diffMonths < vals.length) vals[diffMonths] += 1
    }
    cohortsTmp[cohort] = vals
  }
  const cohorts = Object.entries(cohortsTmp)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([cohort, counts]) => {
      const total = counts[0] || 1
      return {
        cohort,
        values: counts.map((c) => Math.min(1, c / total)),
      }
    })
    .slice(-12)

  return new Response(JSON.stringify({ salesSeries, topProducts, cohorts }), { status: 200, headers: { "Content-Type": "application/json" } })
}