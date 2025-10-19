import { test, expect } from "@playwright/test"

test.describe("Returns (RMA)", () => {
  test("Unauthorized user cannot create RMA", async ({ request }) => {
    const res = await request.post("/api/orders/order123/rma", {
      data: { reason: "test", items: [{ orderItemId: "item1", quantity: 1 }] },
    })
    expect(res.status()).toBe(401)
  })

  test("Unauthorized user cannot list RMA", async ({ request }) => {
    const res = await request.get("/api/orders/order123/rma")
    expect([401, 404]).toContain(res.status())
  })
})