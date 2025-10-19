import { describe, it, expect, vi } from "vitest"
import { GET as productsGet } from "@/app/api/products/route"

// Mock rate-limit to force block
vi.mock("@/lib/rate-limit", () => ({
  limit: async () => false,
}))

// Mock getClientIp
vi.mock("@/lib/security", async (orig) => {
  const mod = await orig()
  return { ...mod, getClientIp: () => "127.0.0.1" }
})

describe("Products API rate limit", () => {
  it("returns 429 when rate limit blocks", async () => {
    const req = new Request("http://localhost/api/products?page=1&pageSize=20") as any
    const res = await productsGet(req as any)
    expect(res.status).toBe(429)
  })
})