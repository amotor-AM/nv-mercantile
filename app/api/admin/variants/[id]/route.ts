import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  const role = (session as any)?.user?.role
  if (!["ADMIN","MANAGER"].includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const body = await req.json().catch(() => ({}))
  const data: any = {}
  ;["sku","price","attributes","stockLevel"].forEach((k) => {
    if (body[k] !== undefined) data[k] = body[k]
  })
  const v = await prisma.variant.update({ where: { id: params.id }, data })
  return NextResponse.json(v)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  const role = (session as any)?.user?.role
  if (!["ADMIN","MANAGER"].includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  await prisma.variant.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}