import { test, expect } from "@playwright/test"

test("sign in page renders", async ({ page }) => {
  await page.goto("/signin")
  await expect(page.getByRole("heading", { name: /sign in to nv mercantile/i })).toBeVisible()
  await expect(page.getByRole("button", { name: /continue with github/i })).toBeVisible()
  await expect(page.getByRole("button", { name: /email me a sign-in link/i })).toBeVisible()
})