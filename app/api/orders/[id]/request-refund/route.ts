import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/auth"

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const order = await prisma.order.findUnique({ where: { id: params.id } })
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const isOwner =
    session.user.id === order.userId || (!!session.user.email && session.user.email === order.email)
  if (!isOwner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  if (order.status === "REFUNDED") {
    return NextResponse.json({ error: "Already refunded" }, { status: 400 })
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { refundStatus: "REQUESTED" },
  })

  return NextResponse.json(updated)
}