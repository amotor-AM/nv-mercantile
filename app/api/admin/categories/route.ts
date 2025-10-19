import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { getClientIp, logAdminAction } from "@/lib/security"

export async function GET() {
  const session = await auth()
  const role = (session as any)?.user?.role
  if (!["ADMIN", "MANAGER"].includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const items = await prisma.category.findMany({
    orderBy: { order: "asc" },
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
  const slug = String(body.slug || "").trim()
  const name = String(body.name || "").trim() || slug
  const description = body.description ? String(body.description) : null
  const parentId = body.parentId ? String(body.parentId) : null
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 422 })

  // Determine next order
  const maxOrder = await prisma.category.aggregate({ _max: { order: true } })
  const order = (maxOrder._max.order ?? 0) + 1

  const created = await prisma.category.create({
    data: { slug, name, description, parentId: parentId ?? undefined, order, isVisible: true },
  })

  await logAdminAction({
    userId: session?.user?.id ?? null,
    action: "category.create",
    targetType: "Category",
    targetId: created.id,
    payload: body,
    ip: getClientIp(req),
    userAgent: req.headers.get("user-agent"),
  })

  return NextResponse.json(created, { status: 201 })
}