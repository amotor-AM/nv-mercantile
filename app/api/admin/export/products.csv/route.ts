import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"

export async function GET() {
  const session = await auth()
  const role = (session as any)?.user?.role
  if (!["ADMIN", "MANAGER"].includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const products = await prisma.product.findMany({
    orderBy: { name: "asc" },
    take: 2000,
  })
  const lines = ["id,slug,name,price,stockLevel,inStock"]
  for (const p of products) {
    lines.push([p.id, p.slug, p.name.replace(/,/g, " "), String(p.price), String(p.stockLevel), p.inStock ? "true" : "false"].join(","))
  }
  return new NextResponse(lines.join("\n"), { headers: { "Content-Type": "text/csv" } })
}