import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  const role = (session as any)?.user?.role
  if (!["ADMIN","MANAGER"].includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const images = await prisma.productImage.findMany({ where: { productId: params.id }, orderBy: { position: "asc" } })
  return NextResponse.json(images)
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  const role = (session as any)?.user?.role
  if (!["ADMIN","MANAGER"].includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const body = await req.json().catch(() => ({}))
  if (!body.url) return NextResponse.json({ error: "url required" }, { status: 400 })
  const count = await prisma.productImage.count({ where: { productId: params.id } })
  const img = await prisma.productImage.create({
    data: { productId: params.id, url: body.url, alt: body.alt ?? null, position: count },
  })
  return NextResponse.json(img, { status: 201 })
}