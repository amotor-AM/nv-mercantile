import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"

export async function GET() {
  const session = await auth()
  const role = (session as any)?.user?.role
  if (!["ADMIN", "MANAGER"].includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 1000,
  })
  const lines = ["id,orderNumber,email,status,total,currency,createdAt"]
  for (const o of orders) {
    lines.push([o.id, o.orderNumber, o.email, o.status, String(o.total), o.currency, o.createdAt.toISOString()].join(","))
  }
  return new NextResponse(lines.join("\n"), { headers: { "Content-Type": "text/csv" } })
}