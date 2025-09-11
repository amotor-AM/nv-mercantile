import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/auth"

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  const order = await prisma.order.findUnique({ where: { id: params.id }, include: { items: true } })
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const isAdmin = (session as any)?.user?.role === "ADMIN"
  const isOwner =
    session?.user?.id && (order.userId === session.user.id || order.email === session.user.email)

  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  return NextResponse.json(order)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  const isAdmin = (session as any)?.user?.role === "ADMIN"
  if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const status = body.status as string | undefined
  if (!status) return NextResponse.json({ error: "status required" }, { status: 400 })
  const order = await prisma.order.update({ where: { id: params.id }, data: { status } as any })
  return NextResponse.json(order)
}