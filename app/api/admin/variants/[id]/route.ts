import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { getClientIp, logAdminAction } from "@/lib/security"

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

  // Optional attribute governance validation
  if (data.attributes && typeof data.attributes === "object") {
    const defs = await prisma.allowedAttribute.findMany({ where: { isActive: true } })
    const map = new Map(defs.map((d) => [d.key, d]))
    for (const [k, v] of Object.entries(data.attributes)) {
      const def = map.get(k)
      if (!def) {
        return NextResponse.json({ error: `Unknown attribute: ${k}` }, { status: 422 })
      }
      if (def.options.length && typeof v === "string" && !def.options.includes(v)) {
        return NextResponse.json({ error: `Invalid value for ${k}: ${v}` }, { status: 422 })
      }
    }
  }

  const v = await prisma.variant.update({ where: { id: params.id }, data })

  await logAdminAction({
    userId: (session as any)?.user?.id ?? null,
    action: "variant.update",
    targetType: "Variant",
    targetId: params.id,
    payload: body,
    ip: getClientIp(req),
    userAgent: req.headers.get("user-agent"),
  })

  return NextResponse.json(v)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  const role = (session as any)?.user?.role
  if (!["ADMIN","MANAGER"].includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  await prisma.variant.delete({ where: { id: params.id } })

  await logAdminAction({
    userId: (session as any)?.user?.id ?? null,
    action: "variant.delete",
    targetType: "Variant",
    targetId: params.id,
    ip: getClientIp(req),
    userAgent: req.headers.get("user-agent"),
  })

  return NextResponse.json({ ok: true })
}