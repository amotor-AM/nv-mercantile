import { describe, it, expect, vi, beforeAll, afterAll } from "vitest"
import { prisma } from "../../lib/db"
import { POST as importProductsPost } from "../../app/api/admin/import/products/route"

// Mock auth to return ADMIN role
vi.mock("../../auth", () => ({
  auth: async () => ({ user: { id: "u_admin", role: "ADMIN", email: "admin@test.local" } }),
}))

describe("Admin Import Products API (CSV)", () => {
  let categoryId: string

  beforeAll(async () => {
    const c = await prisma.category.create({
      data: { slug: "fasteners", name: "Fasteners", isVisible: true, order: 1 },
    })
    categoryId = c.id
  })

  afterAll(async () => {
    await prisma.product.deleteMany({ where: { categoryId } })
    await prisma.category.delete({ where: { id: categoryId } })
  })

  it("imports products and maps category slug to categoryId", async () => {
    const csv = [
      "slug,name,price,category,material,stockLevel",
      "bolt-m6,Hex Bolt M6,0.75,fasteners,steel,10",
      "nut-m6,Hex Nut M6,0.25,fasteners,steel,50",
    ].join("\n")

    const file = new Blob([csv], { type: "text/csv" }) as any
    const formData = new FormData()
    formData.set("file", file)

    const req = new Request("http://localhost/api/admin/import/products", {
      method: "POST",
      body: formData as any,
    }) as any

    const res = await importProductsPost(req)
    expect(res.status).toBe(200)
    const json: any = await res.json()
    expect(json?.updated).toBe(2)

    const p1 = await prisma.product.findUnique({ where: { slug: "bolt-m6" } })
    const p2 = await prisma.product.findUnique({ where: { slug: "nut-m6" } })
    expect(p1?.categoryId).toBe(categoryId)
    expect(p2?.categoryId).toBe(categoryId)
  })
})