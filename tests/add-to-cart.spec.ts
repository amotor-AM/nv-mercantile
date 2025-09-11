import { test, expect } from "@playwright/test"

test("add to cart opens drawer and shows item", async ({ page }) => {
  await page.goto("/product/precision-bearing-housing")
  await page.getByRole("button", { name: "Add to Cart" }).click()
  await expect(page.getByText("Cart (1)")).toBeVisible()
})