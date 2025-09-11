import { test, expect } from "@playwright/test"

test("checkout flow creates order and shows confirmation", async ({ page }) => {
  // Seed cart in localStorage before any scripts run
  await page.addInitScript(() => {
    const state = {
      items: [
        {
          id: "precision-bearing-housing",
          name: "Precision Bearing Housing",
          category: "machined-parts",
          price: 245,
          image:
            "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
          quantity: 1,
        },
      ],
      isOpen: false,
    }
    // Persist format used by zustand/persist: { state, version }
    localStorage.setItem("nv-mercantile-cart-storage", JSON.stringify({ state, version: 0 }))
  })

  // Intercept Stripe checkout session to keep test in-app
  await page.route("**/api/checkout/stripe-session", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ url: "/order-confirmation" }),
    })
  })

  await page.goto("/checkout")

  // Fill shipping info
  await page.getByLabel("First Name").fill("Jane")
  await page.getByLabel("Last Name").fill("Doe")
  await page.getByLabel("Email").fill("jane@example.com")
  await page.getByLabel("Phone Number").fill("555-123-4567")
  await page.getByLabel("Shipping Address").fill("123 Test St, Test City, TX")
  await page.getByRole("button", { name: "Continue to Payment" }).click()

  // Fill payment info (dummy data; Stripe Checkout will be mocked)
  await page.getByLabel("Card Number").fill("4242 4242 4242 4242")
  await page.getByLabel("Expiry Date").fill("12/30")
  await page.getByLabel("CVV").fill("123")
  await page.getByLabel("Name on Card").fill("Jane Doe")
  await page.getByRole("button", { name: "Continue to Review" }).click()

  // Place order
  await page.getByRole("button", { name: "Place Order" }).click()

  await expect(page).toHaveURL(/.*order-confirmation/)
})