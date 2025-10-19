import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { getClientIp, logAdminAction } from "@/lib/security"

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  const role = (session as any)?.user?.role
  if (!["ADMIN", "MANAGER"].includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const body = await req.json().catch(() => ({}))
  const data: any = {}
  ;["location","key","label","url","icon","order","isVisible"].forEach((k) => {
    if (body[k] !== undefined) data[k] = body[k]
  })
  const updated = await prisma.navigationItem.update({ where: { id: params.id }, data })
  await logAdminAction({
    userId: session?.user?.id ?? null,
    action: "navigation.update",
    targetType: "NavigationItem",
    targetId: params.id,
    payload: data,
    ip: getClientIp(req),
    userAgent: req.headers.get("user-agent"),
  })
  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  const role = (session as any)?.user?.role
  if (!["ADMIN", "MANAGER"].includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  await prisma.navigationItem.delete({ where: { id: params.id } })
  await logAdminAction({
    userId: session?.user?.id ?? null,
    action: "navigation.delete",
    targetType: "NavigationItem",
    targetId: params.id,
    payload: {},
    ip: getClientIp(req),
    userAgent: req.headers.get("user-agent"),
  })
  return NextResponse.json({ ok: true })
}