import { test, expect } from "@playwright/test"

test("checkout flow creates order and shows confirmation", async ({ page }) => {
  await page.goto("/")
  // Go to checkout directly
  await page.goto("/checkout")

  // Fill shipping info
  await page.getByLabel("First Name").fill("Jane")
  await page.getByLabel("Last Name").fill("Doe")
  await page.getByLabel("Email").fill("jane@example.com")
  await page.getByLabel("Phone Number").fill("555-123-4567")
  await page.getByLabel("Shipping Address").fill("123 Test St, Test City, TX")
  await page.getByRole("button", { name: "Continue to Payment" }).click()

  // Fill payment info
  await page.getByLabel("Card Number").fill("4242 4242 4242 4242")
  await page.getByLabel("Expiry Date").fill("12/30")
  await page.getByLabel("CVV").fill("123")
  await page.getByLabel("Name on Card").fill("Jane Doe")
  await page.getByRole("button", { name: "Continue to Review" }).click()

  // Place order
  await page.getByRole("button", { name: "Place Order" }).click()

  await expect(page).toHaveURL(/.*order-confirmation/)
})