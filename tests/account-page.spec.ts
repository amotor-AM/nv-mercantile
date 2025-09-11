import { test, expect } from "@playwright/test"

test("account orders page prompts to sign in", async ({ page }) => {
  await page.goto("/account/orders")
  await expect(page.getByText("Sign in to see your orders.")).toBeVisible()
})