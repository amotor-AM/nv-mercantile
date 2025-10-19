import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const location = searchParams.get("location") as "HEADER" | "FOOTER" | null
  const where: any = { isVisible: true }
  if (location) where.location = location
  const items = await prisma.navigationItem.findMany({
    where,
    orderBy: [{ location: "asc" }, { order: "asc" }],
    take: 1000,
  })
  return NextResponse.json(items)
}