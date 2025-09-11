import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/auth"
import { sendOrderShippedEmail } from "@/lib/email"

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  const order = await prisma.order.findUnique({ where: { id: params.id }, include: { items: true } })
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

  const body = await req.json().catch(() => ({}))
  const status = body.status as string | undefined
  const data: any = {}
  if (status) data.status = status
  if (body.trackingCarrier !== undefined) data.trackingCarrier = body.trackingCarrier
  if (body.trackingNumber !== undefined) data.trackingNumber = body.trackingNumber
  if (body.trackingUrl !== undefined) data.trackingUrl = body.trackingUrl
  if (body.shippedAt !== undefined) data.shippedAt = new Date(body.shippedAt)

  if (!Object.keys(data).length) return NextResponse.json({ error: "no changes" }, { status: 400 })

  const order = await prisma.order.update({ where: { id: params.id }, data })

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