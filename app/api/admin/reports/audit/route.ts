import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"

export async function GET(req: NextRequest) {
  const session = await auth()
  const role = (session as any)?.user?.role
  if (!["ADMIN", "MANAGER"].includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const since = searchParams.get("since")
  const until = searchParams.get("until")
  const format = searchParams.get("format")

  const where: any = {}
  if (since) where.createdAt = { ...(where.createdAt || {}), gte: new Date(since) }
  if (until) where.createdAt = { ...(where.createdAt || {}), lte: new Date(until) }

  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 5000,
  })

  if (format === "csv") {
    const lines = ["id,userId,action,targetType,targetId,ip,userAgent,createdAt"]
    for (const l of logs) {
      lines.push([
        l.id,
        l.userId || "",
        l.action || "",
        l.targetType || "",
        l.targetId || "",
        l.ip || "",
        (l.userAgent || "").replace(/,/g, " "),
        l.createdAt.toISOString(),
      ].join(","))
    }
    return new NextResponse(lines.join("\n"), { headers: { "Content-Type": "text/csv" } })
  }

  return NextResponse.json({ logs })
}