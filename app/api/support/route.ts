import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { SupportCreateSchema } from "@/lib/validation"
import { limit } from "@/lib/rate-limit"
import { getClientIp } from "@/lib/security"

export async function GET() {
  const session = await auth()
  const role = (session as any)?.user?.role
  const isAdmin = ["ADMIN", "MANAGER", "SUPPORT"].includes(role)
  const where: any = {}
  if (!isAdmin) {
    if (!session?.user) return NextResponse.json([], { status: 200 })
    where.OR = [{ userId: session.user.id }, { email: session.user.email ?? "" }]
  }
  const tickets = await prisma.supportTicket.findMany({
    where,
    orderBy: { updatedAt: "desc" },
  })
  return NextResponse.json(tickets)
}

export async function POST(req: NextRequest) {
  const session = await auth()

  // Basic public rate limit to mitigate spam
  const ip = getClientIp(req)
  const ok = await limit(`support:${ip}`)
  if (!ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 })

  const json = await req.json().catch(() => ({}))
  const parsed = SupportCreateSchema.safeParse(json)
  const email = parsed.success ? parsed.data.email ?? session?.user?.email : session?.user?.email
  if (!parsed.success || !email) {
    return NextResponse.json({ error: "Invalid input" }, { status: 422 })
  }

  const ticket = await prisma.supportTicket.create({
    data: {
      email,
      subject: parsed.data.subject,
      userId: session?.user?.id ?? null,
      status: "OPEN",
      messages: {
        create: [
          {
            author: "CUSTOMER",
            body: parsed.data.body,
          },
        ],
      },
    },
  })
  return NextResponse.json(ticket, { status: 201 })
}