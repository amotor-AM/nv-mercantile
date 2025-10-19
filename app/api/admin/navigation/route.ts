import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { getClientIp, logAdminAction } from "@/lib/security"

export async function GET(req: NextRequest) {
  const session = await auth()
  const role = (session as any)?.user?.role
  if (!["ADMIN", "MANAGER"].includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { searchParams } = new URL(req.url)
  const location = searchParams.get("location") as "HEADER" | "FOOTER" | null
  const where: any = {}
  if (location) where.location = location
  const items = await prisma.navigationItem.findMany({
    where,
    orderBy: [{ location: "asc" }, { order: "asc" }],
    take: 1000,
  })
  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  const role = (session as any)?.user?.role
  if (!["ADMIN", "MANAGER"].includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const body = await req.json().catch(() => ({}))
  const location = (body.location || "HEADER").toUpperCase()
  const key = String(body.key || "").trim()
  const label = String(body.label || "").trim() || key
  const url = String(body.url || "").trim()
  const icon = body.icon ? String(body.icon) : null
  const isVisible = body.isVisible === undefined ? true : !!body.isVisible
  if (!key || !url) return NextResponse.json({ error: "key and url required" }, { status: 422 })

  const maxOrder = await prisma.navigationItem.aggregate({
    where: { location },
    _max: { order: true },
  })
  const order = (maxOrder._max.order ?? 0) + 1

  const created = await prisma.navigationItem.create({
    data: { location, key, label, url, icon, isVisible, order },
  })

  await logAdminAction({
    userId: session?.user?.id ?? null,
    action: "navigation.create",
    targetType: "NavigationItem",
    targetId: created.id,
    payload: body,
    ip: getClientIp(req),
    userAgent: req.headers.get("user-agent"),
  })

  return NextResponse.json(created, { status: 201 })
}