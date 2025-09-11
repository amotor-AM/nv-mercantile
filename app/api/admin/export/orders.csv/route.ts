import { auth } from "@/auth"
import { prisma } from "@/lib/db"

export async function GET() {
  const session = await auth()
  const role = (session as any)?.user?.role
  if (!["ADMIN", "MANAGER"].includes(role)) {
    return new Response("Unauthorized", { status: 401 })
  }
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: true },
    take: 5000,
  })
  const rows = [
    ["orderNumber", "email", "status", "total", "currency", "createdAt", "updatedAt"].join(","),
    ...orders.map((o) =>
      [o.orderNumber, o.email, o.status, (o.total / 100).toFixed(2), o.currency, o.createdAt.toISOString(), o.updatedAt.toISOString()].join(",")
    ),
  ]
  const body = rows.join("\n")
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=orders.csv",
    },
  })
}