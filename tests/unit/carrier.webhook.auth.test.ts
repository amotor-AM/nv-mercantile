import { describe, it, expect, beforeAll } from "vitest"
import { POST as carrierWebhookPost } from "@/app/api/webhooks/carrier/route"

describe("Carrier webhook auth", () => {
  beforeAll(() => {
    process.env.CARRIER_WEBHOOK_SECRET = "secret123"
  })

  it("rejects when secret header missing or invalid", async () => {
    const req = new Request("http://localhost/api/webhooks/carrier", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ trackingNumber: "MOCK1", status: "in_transit" }),
    }) as any
    const res = await carrierWebhookPost(req as any)
    expect(res.status).toBe(401)

    const req2 = new Request("http://localhost/api/webhooks/carrier", {
      method: "POST",
      headers: { "content-type": "application/json", "x-carrier-secret": "wrong" },
      body: JSON.stringify({ trackingNumber: "MOCK1", status: "in_transit" }),
    }) as any
    const res2 = await carrierWebhookPost(req2 as any)
    expect(res2.status).toBe(401)
  })

  it("accepts with correct secret", async () => {
    const req = new Request("http://localhost/api/webhooks/carrier", {
      method: "POST",
      headers: { "content-type": "application/json", "x-carrier-secret": "secret123" },
      body: JSON.stringify({ trackingNumber: "MOCK1", status: "in_transit" }),
    }) as any
    const res = await carrierWebhookPost(req as any)
    expect(res.status).toBe(200)
  })
})