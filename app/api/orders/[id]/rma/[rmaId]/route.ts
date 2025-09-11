import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/auth"
import { sendRmaApprovedEmail } from "@/lib/email"

export async function GET(_: NextRequest, { params }: { params: { id: string; rmaId: string } }) {
  const session = await auth()
  const order = await prisma.order.findUnique({ where: { id: params.id } })
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const role = (session as any)?.user?.role
  const isOwner = session?.user?.id && (order.userId === session.user.id || order.email === session.user.email)
  if (!isOwner && !["ADMIN","MANAGER","SUPPORT"].includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const rma = await prisma.returnRequest.findUnique({
    where: { id: params.rmaId },
    include: { items: { include: { orderItem: true } } },
  })
  if (!rma) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(rma)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string; rmaId: string } }) {
  const session = await auth()
  const role = (session as any)?.user?.role
  if (!["ADMIN","MANAGER","SUPPORT"].includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const body = await req.json().catch(() => ({}))
  const status = body.status as "APPROVED" | "REJECTED" | "IN_TRANSIT" | "RECEIVED" | undefined
  if (!status) return NextResponse.json({ error: "status required" }, { status: 400 })
  const rma = await prisma.returnRequest.update({ where: { id: params.rmaId }, data: { status } })
  if (status === "APPROVED") {
    try { await sendRmaApprovedEmail(rma.orderId, rma.id) } catch {}
  }
  return NextResponse.json(rma)
}