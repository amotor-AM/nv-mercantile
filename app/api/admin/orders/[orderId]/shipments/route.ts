import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { CreateShipmentSchema } from "@/lib/validation"
import { createShipmentAndMaybePurchaseLabel } from "@/lib/shipping"

export async function GET(_: NextRequest, { params }: { params: { orderId: string } }) {
  const session = await auth()
  const role = (session as any)?.user?.role
  const isPrivileged = ["ADMIN", "MANAGER", "WAREHOUSE", "SUPPORT"].includes(role)
  if (!isPrivileged) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const shipments = await prisma.shipment.findMany({
    where: { orderId: params.orderId },
    orderBy: { createdAt: "desc" },
    include: {
      items: { include: { orderItem: { include: { product: true } } } },
      events: { orderBy: { occurredAt: "asc" } },
    },
  })
  return NextResponse.json(shipments)
}

export async function POST(req: NextRequest, { params }: { params: { orderId: string } }) {
  const session = await auth()
  const role = (session as any)?.user?.role
  const isPrivileged = ["ADMIN", "MANAGER", "WAREHOUSE"].includes(role)
  if (!isPrivileged) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const json = await req.json().catch(() => null)
  if (!json) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })

  const parsed = CreateShipmentSchema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 422 })

  try {
    const shipment = await createShipmentAndMaybePurchaseLabel({
      orderId: params.orderId,
      ...parsed.data,
    })
    return NextResponse.json(shipment, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to create shipment" }, { status: 400 })
  }
}