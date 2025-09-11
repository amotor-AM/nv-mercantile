import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"

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
  const body = await req.json().catch(() => ({}))
  const email = body.email ?? session?.user?.email
  if (!body.subject || !body.body || !email) {
    return NextResponse.json({ error: "subject, body, email required" }, { status: 400 })
  }
  const ticket = await prisma.supportTicket.create({
    data: {
      email,
      subject: body.subject,
      userId: session?.user?.id ?? null,
      status: "OPEN",
      messages: {
        create: [
          {
            author: "CUSTOMER",
            body: body.body,
          },
        ],
      },
    },
  })
  return NextResponse.json(ticket, { status: 201 })
}