import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { parse } from "csv-parse/sync"
import { logAdminAction, getClientIp } from "@/lib/security"

export async function POST(req: NextRequest) {
  const session = await auth()
  const role = (session as any)?.user?.role
  if (!["ADMIN", "MANAGER"].includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get("file")
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: "file field required" }, { status: 400 })
  }
  const buf = Buffer.from(await file.arrayBuffer())
  const records = parse(buf, { columns: true, skip_empty_lines: true })

  let updated = 0
  for (const r of records) {
    const slug = r.slug || r.id
    if (!slug) continue
    const price = Number(r.price ?? 0)
    let categoryId: string | undefined = undefined
    const categorySlug = r.category || ""
    if (categorySlug) {
      const cat = await prisma.category.findUnique({ where: { slug: categorySlug } })
      categoryId = cat?.id ?? undefined
    }
    const data: any = {
      slug,
      name: r.name || slug,
      subtitle: r.subtitle || "",
      price: isNaN(price) ? 0 : price,
      material: r.material || "",
      leadTime: r.leadTime || "2-3 weeks",
      leadTimeDays: Number(r.leadTimeDays ?? 7),
      stockLevel: Number(r.stockLevel ?? 0),
      safetyStock: Number(r.safetyStock ?? 0),
      reorderPoint: Number(r.reorderPoint ?? 0),
      inStock: String(r.inStock).toLowerCase() === "true",
      description: r.description || "",
      image: r.image || "",
      dimensions: r.dimensions || "",
      weight: r.weight || "",
      specifications: {},
      applications: [],
      categoryId,
    }
    await prisma.product.upsert({
      where: { slug },
      create: data,
      update: data,
    })
    updated++
  }

  try {
    await logAdminAction({
      userId: session?.user?.id ?? null,
      action: "import.products",
      targetType: "Product",
      targetId: null,
      payload: { count: updated, filename: (file as any).name ?? null },
      ip: getClientIp(req),
      userAgent: req.headers.get("user-agent"),
    })
  } catch {}

  return NextResponse.json({ ok: true, updated })
}