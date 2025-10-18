import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { ProductUpdateSchema } from "@/lib/validation"
import { getClientIp, logAdminAction } from "@/lib/security"

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  const role = (session as any)?.user?.role
  if (!["ADMIN", "MANAGER"].includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const json = await req.json().catch(() => ({}))
  const parsed = ProductUpdateSchema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 422 })

  const updated = await prisma.product.update({ where: { id: params.id }, data: parsed.data })
  await logAdminAction({
    userId: session?.user?.id ?? null,
    action: "product.update",
    targetType: "Product",
    targetId: params.id,
    payload: parsed.data,
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
  await prisma.product.delete({ where: { id: params.id } })
  await logAdminAction({
    userId: session?.user?.id ?? null,
    action: "product.delete",
    targetType: "Product",
    targetId: params.id,
    payload: {},
    ip: getClientIp(req),
    userAgent: req.headers.get("user-agent"),
  })
  return NextResponse.json({ ok: true })
}