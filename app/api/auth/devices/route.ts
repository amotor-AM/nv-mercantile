import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"

export async function GET() {
  const session = await auth()
  const userId = (session as any)?.user?.id
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const devices = await prisma.userDevice.findMany({ where: { userId }, orderBy: { lastSeen: "desc" } })
  return NextResponse.json(devices)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  const userId = (session as any)?.user?.id
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const name = String(body.name || "Trusted device")

  const created = await prisma.userDevice.create({
    data: {
      userId,
      name,
      userAgent: req.headers.get("user-agent") || "",
      trusted: true,
      lastSeen: new Date(),
    },
  })

  return NextResponse.json(created, { status: 201 })
}