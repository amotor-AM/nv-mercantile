import { test, expect } from "@playwright/test"

test("products API supports q and price filters", async ({ request }) => {
  const res = await request.get("/api/products?q=steel&minPrice=100&maxPrice=500&inStock=true&sort=price_desc&pageSize=5")
  expect(res.ok()).toBeTruthy()
  const data = await res.json()
  expect(Array.isArray(data.items)).toBeTruthy()
  if (data.items.length) {
    for (const p of data.items) {
      expect(p.price).toBeGreaterThanOrEqual(100)
      expect(p.price).toBeLessThanOrEqual(500)
    }
  }
  expect(data.facets).toBeTruthy()
})