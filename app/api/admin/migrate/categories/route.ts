import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"

export async function POST(req: NextRequest) {
  const session = await auth()
  const role = (session as any)?.user?.role
  if (!["ADMIN", "MANAGER"].includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Check if legacy column exists (Postgres)
  const existsRows: Array<{ exists: boolean }> = await prisma.$queryRawUnsafe(
    `SELECT EXISTS(
      SELECT 1 
      FROM information_schema.columns 
      WHERE (table_name = 'Product' OR table_name = 'product') 
        AND column_name = 'category'
    ) as exists`
  )
  const exists = existsRows[0]?.exists
  if (!exists) {
    return NextResponse.json({ ok: true, migrated: 0, note: "legacy category column not found" })
  }

  // Read distinct categories
  const cats: Array<{ category: string }> = await prisma.$queryRawUnsafe(
    `SELECT DISTINCT category FROM "Product" WHERE category IS NOT NULL AND category <> ''`
  )

  let migrated = 0
  for (const c of cats) {
    const slug = String(c.category).trim()
    if (!slug) continue
    const cat = await prisma.category.upsert({
      where: { slug },
      update: {},
      create: { slug, name: slug.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase()), order: migrated },
    })
    await prisma.$executeRawUnsafe(
      `UPDATE "Product" SET "categoryId" = $1 WHERE category = $2`,
      cat.id,
      slug
    )
    migrated++
  }

  return NextResponse.json({ ok: true, migrated })
}