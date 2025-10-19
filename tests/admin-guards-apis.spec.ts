import { test, expect } from "@playwright/test"

test.describe("Admin guards for endpoints", () => {
  const protectedEndpoints = [
    "/api/admin/categories",
    "/api/admin/navigation",
    "/api/admin/variants/abc",
    "/api/admin/orders",
    "/api/admin/products",
    "/api/admin/analytics",
    "/api/admin/reports/roles",
    "/api/admin/reports/audit",
    "/api/admin/compliance/redact-tickets",
    "/api/inventory",
    "/api/admin/export/orders.csv",
    "/api/admin/export/products.csv",
    "/api/admin/shipping/export.csv",
    "/api/orders/order123/refund",
    "/api/orders/order123/refunds",
  ]

  for (const ep of protectedEndpoints) {
    test(`unauthorized access blocked: ${ep}`, async ({ request }) => {
      const res = await request.get(ep)
      expect([401, 403, 404]).toContain(res.status())
    })
  }
})