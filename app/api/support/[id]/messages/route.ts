import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  const role = (session as any)?.user?.role
  const ticket = await prisma.supportTicket.findUnique({ where: { id: params.id } })
  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const isAdmin = ["ADMIN", "MANAGER", "SUPPORT"].includes(role)
  const isOwner = session?.user?.id && (ticket.userId === session.user.id || ticket.email === session.user.email)
  if (!isAdmin && !isOwner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const msgs = await prisma.supportMessage.findMany({ where: { ticketId: ticket.id }, orderBy: { createdAt: "asc" } })
  return NextResponse.json(msgs)
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  const role = (session as any)?.user?.role
  const ticket = await prisma.supportTicket.findUnique({ where: { id: params.id } })
  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const isAgent = ["ADMIN", "MANAGER", "SUPPORT"].includes(role)
  const isOwner = session?.user?.id && (ticket.userId === session.user.id || ticket.email === session.user.email)
  if (!isAgent && !isOwner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  if (!body.body) return NextResponse.json({ error: "body required" }, { status: 400 })

  const message = await prisma.supportMessage.create({
    data: {
      ticketId: ticket.id,
      author: isAgent ? "AGENT" : "CUSTOMER",
      body: body.body,
    },
  })
  await prisma.supportTicket.update({
    where: { id: ticket.id },
    data: { status: (body.status as any) ?? ticket.status, updatedAt: new Date() },
  })

  return NextResponse.json(message, { status: 201 })
}