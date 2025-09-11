import { auth } from "@/auth"
import { prisma } from "@/lib/db"

export async function GET() {
  const session = await auth()
  const role = (session as any)?.user?.role
  if (!["ADMIN", "MANAGER"].includes(role)) {
    return new Response("Unauthorized", { status: 401 })
  }
  const products = await prisma.product.findMany({
    orderBy: { name: "asc" },
    take: 5000,
  })
  const header = [
    "id","slug","name","subtitle","price","material","category","inStock","stockLevel","safetyStock","reorderPoint","leadTime","leadTimeDays"
  ]
  const rows = [
    header.join(","),
    ...products.map((p) =>
      [
        p.id, p.slug, csv(p.name), csv(p.subtitle), p.price, csv(p.material), csv(p.category), p.inStock, p.stockLevel, p.safetyStock, p.reorderPoint, csv(p.leadTime), p.leadTimeDays
      ].join(",")
    ),
  ]
  const body = rows.join("\n")
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=products.csv",
    },
  })
}

function csv(val: any) {
  if (val === null || val === undefined) return ""
  const s = String(val)
  if (s.includes(",") || s.includes("\"") || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}