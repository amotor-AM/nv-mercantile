import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"

export async function GET() {
  const session = await auth()
  const role = (session as any)?.user?.role
  if (!["ADMIN", "MANAGER", "SUPPORT"].includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const shipments = await prisma.shipment.findMany({
    orderBy: { createdAt: "desc" },
    include: { order: true },
    take: 2000,
  })

  const lines = ["id,orderNumber,carrier,service,trackingNumber,status,createdAt,shippedAt,deliveredAt"]
  for (const s of shipments) {
    lines.push([
      s.id,
      s.order?.orderNumber || "",
      s.carrier || "",
      s.service || "",
      s.trackingNumber || "",
      s.status,
      s.createdAt.toISOString(),
      s.shippedAt ? s.shippedAt.toISOString() : "",
      s.deliveredAt ? s.deliveredAt.toISOString() : "",
    ].join(","))
  }

  return new NextResponse(lines.join("\n"), { headers: { "Content-Type": "text/csv" } })
}