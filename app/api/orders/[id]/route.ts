import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const order = await prisma.order.findUnique({ where: { id: params.id }, include: { items: true } })
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(order)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}))
  const status = body.status as string | undefined
  if (!status) return NextResponse.json({ error: "status required" }, { status: 400 })
  const order = await prisma.order.update({ where: { id: params.id }, data: { status } as any })
  return NextResponse.json(order)
}