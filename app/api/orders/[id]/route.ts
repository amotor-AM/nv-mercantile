import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/auth"
import { sendOrderShippedEmail } from "@/lib/email"
import { OrderUpdateSchema } from "@/lib/validation"
import { getClientIp, logAdminAction } from "@/lib/security"

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      items: true,
      shipments: {
        include: {
          items: { include: { orderItem: { include: { product: true } } } },
          events: { orderBy: { occurredAt: "asc" } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  })
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const role = (session as any)?.user?.role
  const isPrivileged = ["ADMIN", "MANAGER"].includes(role)
  const isOwner =
    session?.user?.id && (order.userId === session.user.id || order.email === session.user.email)

  if (!isPrivileged && !isOwner) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  return NextResponse.json(order)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  const role = (session as any)?.user?.role
  const isPrivileged = ["ADMIN", "MANAGER"].includes(role)
  if (!isPrivileged) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const json = await req.json().catch(() => ({}))
  const parsed = OrderUpdateSchema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 422 })

  const data: any = { ...parsed.data }
  if (data.shippedAt !== undefined) data.shippedAt = new Date(data.shippedAt)

  const order = await prisma.order.update({ where: { id: params.id }, data })

  await logAdminAction({
    userId: session?.user?.id ?? null,
    action: "order.update",
    targetType: "Order",
    targetId: params.id,
    payload: parsed.data,
    ip: getClientIp(req),
    userAgent: req.headers.get("user-agent"),
  })

  if (data.status === "FULFILLED") {
    try {
      await sendOrderShippedEmail(order.id, {
        trackingUrl: order.trackingUrl ?? undefined,
        trackingNumber: order.trackingNumber ?? undefined,
      })
    } catch {}
  }

  return NextResponse.json(order)
}