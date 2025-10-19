import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"

export async function POST(req: NextRequest) {
  const session = await auth()
  const role = (session as any)?.user?.role
  if (!["ADMIN", "MANAGER", "SUPPORT"].includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const daysParam = body.days as number | undefined
  const days = Number.isFinite(daysParam) ? Number(daysParam) : Number(process.env.SUPPORT_TICKET_RETENTION_DAYS || "365")
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const { count } = await prisma.supportMessage.updateMany({
    where: { createdAt: { lt: cutoff }, body: { not: "[redacted]" } },
    data: { body: "[redacted]" },
  })

  return NextResponse.json({ redacted: count })
}