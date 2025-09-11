import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  const role = (session as any)?.user?.role
  if (!["ADMIN", "MANAGER"].includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const body = await req.json().catch(() => ({}))
  const data: any = {}
  const fields = ["name","subtitle","price","material","category","leadTime","image","description","dimensions","weight","stockLevel","safetyStock","reorderPoint","leadTimeDays","inStock"]
  for (const f of fields) {
    if (body[f] !== undefined) data[f] = body[f]
  }
  const updated = await prisma.product.update({ where: { id: params.id }, data })
  return NextResponse.json(updated)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  const role = (session as any)?.user?.role
  if (!["ADMIN", "MANAGER"].includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  await prisma.product.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}