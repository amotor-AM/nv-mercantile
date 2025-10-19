import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/auth"
import { sendRmaRequestedEmail } from "@/lib/email"
import { RmaStartSchema } from "@/lib/validation"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const json = await req.json().catch(() => ({}))
  const parsed = RmaStartSchema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 422 })

  const { reason, items } = parsed.data

  const order = await prisma.order.findUnique({ where: { id: params.id }, include: { items: true } })
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const isOwner = session.user.id && (order.userId === session.user.id || order.email === session.user.email)
  if (!isOwner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Validate items belong to order
  const itemMap = new Map(order.items.map((i) => [i.id, i]))
  for (const it of items) {
    const oi = itemMap.get(it.orderItemId)
    if (!oi || it.quantity <= 0 || it.quantity > oi.quantity) {
      return NextResponse.json({ error: "Invalid items" }, { status: 400 })
    }
  }

  const rma = await prisma.returnRequest.create({
    data: {
      orderId: order.id,
      reason: reason ?? null,
      status: "REQUESTED",
      items: {
        create: items.map((it) => ({
          orderItemId: it.orderItemId,
          requestedQty: it.quantity,
        })),
      },
    },
    include: { items: true },
  })

  try { await sendRmaRequestedEmail(order.id, rma.id) } catch {}

  return NextResponse.json(rma, { status: 201 })
}

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  const order = await prisma.order.findUnique({ where: { id: params.id } })
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const role = (session as any)?.user?.role
  const isOwner = session?.user?.id && (order.userId === session.user.id || order.email === session.user.email)
  if (!isOwner && !["ADMIN","MANAGER","SUPPORT"].includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const rmas = await prisma.returnRequest.findMany({
    where: { orderId: order.id },
    include: { items: { include: { orderItem: true } } },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(rmas)
}