import { test, expect } from "@playwright/test"

test("admin route redirects to sign in when unauthenticated", async ({ page }) => {
  const res = await page.goto("/admin")
  await expect(page).toHaveURL(/\/signin/)
  expect(res?.status()).toBeLessThan(400)
})