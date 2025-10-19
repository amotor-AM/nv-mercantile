import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  const userId = (session as any)?.user?.id
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const dev = await prisma.userDevice.findUnique({ where: { id: params.id } })
  if (!dev || dev.userId !== userId) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await prisma.userDevice.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}