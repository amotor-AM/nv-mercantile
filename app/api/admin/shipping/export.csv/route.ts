import { auth } from "@/auth"
import { prisma } from "@/lib/db"

export async function GET() {
  const session = await auth()
  const role = (session as any)?.user?.role
  if (!["ADMIN","MANAGER","WAREHOUSE"].includes(role)) {
    return new Response("Unauthorized", { status: 401 })
  }
  const orders = await prisma.order.findMany({
    where: { status: { in: ["PAID", "FULFILLED"] } },
    orderBy: { createdAt: "desc" },
    take: 2000,
  })

  const header = ["orderNumber","name","address","email","phone","trackingNumber","carrier","total"]
  const rows = [
    header.join(","),
    ...orders.map((o) =>
      [o.orderNumber, csv(o.shippingName), csv(o.shippingAddress), csv(o.email), csv(o.shippingPhone), csv(o.trackingNumber), csv(o.trackingCarrier), (o.total/100).toFixed(2)].join(",")
    ),
  ]
  const body = rows.join("\n")
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=shipping_export.csv",
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