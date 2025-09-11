import { test, expect } from "@playwright/test"

test("admin route redirects to sign in when unauthenticated", async ({ page }) => {
  const res = await page.goto("/admin")
  // NextAuth default sign-in route
  await expect(page).toHaveURL(/\/api\/auth\/signin/)
  expect(res?.status()).toBeLessThan(400)
})