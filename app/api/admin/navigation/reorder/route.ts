import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { getClientIp, logAdminAction } from "@/lib/security"

export async function POST(req: NextRequest) {
  const session = await auth()
  const role = (session as any)?.user?.role
  if (!["ADMIN", "MANAGER"].includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const body = await req.json().catch(() => ({}))
  const items: Array<{ id: string; order: number }> = Array.isArray(body?.items) ? body.items : []
  if (!items.length) return NextResponse.json({ ok: true, updated: 0 })

  let updated = 0
  for (const it of items) {
    await prisma.navigationItem.update({ where: { id: it.id }, data: { order: it.order } })
    updated++
  }

  await logAdminAction({
    userId: session?.user?.id ?? null,
    action: "navigation.reorder",
    targetType: "NavigationItem",
    targetId: null,
    payload: { items },
    ip: getClientIp(req),
    userAgent: req.headers.get("user-agent"),
  })

  return NextResponse.json({ ok: true, updated })
}