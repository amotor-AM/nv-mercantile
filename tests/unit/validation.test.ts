import { describe, it, expect } from "vitest"
import { RefundCreateSchema, OrderUpdateSchema } from "../../lib/validation"

describe("RefundCreateSchema", () => {
  it("accepts valid refund", () => {
    const r = RefundCreateSchema.safeParse({ amount: 1000, reason: "test" })
    expect(r.success).toBe(true)
  })
  it("rejects invalid", () => {
    const r = RefundCreateSchema.safeParse({ amount: -1 })
    expect(r.success).toBe(false)
  })
})

describe("OrderUpdateSchema", () => {
  it("accepts status update", () => {
    const r = OrderUpdateSchema.safeParse({ status: "PAID" })
    expect(r.success).toBe(true)
  })
  it("rejects invalid tracking URL", () => {
    const r = OrderUpdateSchema.safeParse({ trackingUrl: "not-a-url" })
    expect(r.success).toBe(false)
  })
})