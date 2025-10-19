import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"

export async function GET(req: NextRequest) {
  const session = await auth()
  const role = (session as any)?.user?.role
  if (!["ADMIN", "MANAGER"].includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const users = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "MANAGER"] } },
    include: { devices: true },
    orderBy: { role: "asc" },
  })

  const report = users.map((u) => ({
    id: u.id,
    email: u.email,
    role: u.role,
    twoFactorEnabled: !!u.twoFactorEnabled,
    devices: u.devices.map((d) => ({
      id: d.id,
      name: d.name,
      trusted: d.trusted,
      lastSeen: d.lastSeen,
      userAgent: d.userAgent,
      ip: d.ip,
    })),
  }))

  const { searchParams } = new URL(req.url)
  const format = searchParams.get("format")
  if (format === "csv") {
    const lines = ["id,email,role,twoFactorEnabled,devicesCount"]
    for (const r of report) {
      lines.push([r.id, r.email || "", r.role, r.twoFactorEnabled ? "true" : "false", String(r.devices.length)].join(","))
    }
    return new NextResponse(lines.join("\n"), {
      headers: { "Content-Type": "text/csv" },
    })
  }

  return NextResponse.json({ users: report })
}