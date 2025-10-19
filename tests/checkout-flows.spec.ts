import { test, expect } from "@playwright/test"

test.describe("Checkout flows", () => {
  test("Stripe checkout not configured returns error", async ({ request }) => {
    const res = await request.post("/api/checkout/stripe", { data: { orderId: "missing" } })
    expect(res.status()).toBe(500)
  })

  test("PayPal checkout not configured returns error", async ({ request }) => {
    const res = await request.post("/api/checkout/paypal", { data: { orderId: "missing" } })
    expect(res.status()).toBe(500)
  })
})