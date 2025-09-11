import { test, expect } from "@playwright/test"

test("inventory API requires admin", async ({ request }) => {
  const res = await request.get("/api/inventory")
  expect(res.status()).toBe(401)
})