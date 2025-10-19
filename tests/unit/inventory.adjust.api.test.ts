import { describe, it, expect, vi, beforeAll, afterAll } from "vitest"
import { prisma } from "../../lib/db"

// Mock auth to return ADMIN role for API route
vi.mock("@/auth", () => ({
  auth: async () => ({ user: { id: "u_admin", role: "ADMIN", email: "admin@test.local" } }),
}))

// Import route handler
import { POST as adjustPost } from "../../app/api/inventory/[productId]/adjust/route"

describe("Inventory Adjust API", () => {
  let productId: string

  beforeAll(async () => {
    const p = await prisma.product.create({
      data: {
        slug: "test-widget",
        name: "Test Widget",
        subtitle: "",
        price: 10,
        material: "steel",
        leadTime: "2-3 weeks",
        description: "",
        image: "",
        dimensions: "",
        weight: "",
        specifications: {},
        applications: [],
        inStock: true,
        stockLevel: 5,
        safetyStock: 0,
        reorderPoint: 0,
        leadTimeDays: 7,
      },
    })
    productId = p.id
  })

  afterAll(async () => {
    await prisma.inventoryMovement.deleteMany({ where: { productId } })
    await prisma.product.delete({ where: { id: productId } })
  })

  it("restocks and creates movement", async () => {
    const payload = { quantity: 3, type: "RESTOCK", note: "Test restock" }
    const req = new Request(`http://localhost/api/inventory/${productId}/adjust`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    }) as any

    const res = await adjustPost(req, { params: { productId } } as any)
    expect(res.status).toBe(200)
    const json: any = await res.json()
    expect(json?.product?.stockLevel).toBe(8)

    const movements = await prisma.inventoryMovement.findMany({ where: { productId }, orderBy: { createdAt: "desc" } })
    expect(movements[0]?.type).toBe("RESTOCK")
    expect(movements[0]?.quantity).toBe(3)
  })

  it("adjusts negative and does not set inStock to false if existing true and delta negative but not zero", async () => {
    const payload = { quantity: -2, type: "ADJUSTMENT", note: "Test adjust" }
    const req = new Request(`http://localhost/api/inventory/${productId}/adjust`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    }) as any

    const res = await adjustPost(req, { params: { productId } } as any)
    expect(res.status).toBe(200)
    const json: any = await res.json()
    expect(json?.product?.stockLevel).toBe(6)
    expect(json?.product?.inStock).toBe(true)
  })
})