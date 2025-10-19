import { test, expect } from "@playwright/test"

test.describe("Webhook endpoints", () => {
  test("Stripe webhook returns 500 when not configured", async ({ request }) => {
    const res = await request.post("/api/webhooks/stripe", {
      headers: { "stripe-signature": "test" },
      data: "{}",
    })
    expect(res.status()).toBe(500)
  })

  test("Carrier webhook returns 400 on missing tracking", async ({ request }) => {
    const res = await request.post("/api/webhooks/carrier", {
      data: { provider: "mock", status: "in_transit" },
    })
    expect(res.status()).toBe(400)
  })
})