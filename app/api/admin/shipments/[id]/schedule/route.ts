import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  const role = (session as any)?.user?.role
  const isPrivileged = ["ADMIN", "MANAGER", "WAREHOUSE"].includes(role)
  if (!isPrivileged) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const shipment = await prisma.shipment.findUnique({ where: { id: params.id } })
  if (!shipment) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Stub - record an event
  await prisma.shipmentEvent.create({
    data: {
      shipmentId: shipment.id,
      status: shipment.status,
      description: "Pickup scheduled",
      occurredAt: new Date(),
    },
  })

  return NextResponse.json({ ok: true })
}