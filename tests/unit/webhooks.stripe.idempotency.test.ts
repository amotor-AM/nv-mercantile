import { describe, it, expect, vi, beforeAll, afterAll } from "vitest"
import { prisma } from "@/lib/db"
import { POST as stripeWebhookPost } from "@/app/api/webhooks/stripe/route"

// Mock Stripe to bypass signature verification and return a fake event
const fakeEvent: any = {
  type: "payment_intent.succeeded",
  data: {
    object: {
      id: "pi_test_123",
      metadata: { orderId: "" },
    },
  },
}
vi.mock("stripe", () => {
  return {
    default: class Stripe {
      webhooks = {
        constructEvent(_: string, __: string, ___: string) {
          return fakeEvent
        },
      }
      constructor(_: string, __: any) {}
    },
  }
})

describe("Stripe webhook idempotency", () => {
  let productId = ""
  let orderId = ""
  let qty = 2

  beforeAll(async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_dummy"
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_dummy"

    const product = await prisma.product.create({
      data: {
        slug: "stripe-idem-widget",
        name: "Stripe Idem Widget",
        subtitle: "",
        price: 100,
        material: "steel",
        leadTime: "2-3 weeks",
        description: "",
        image: "",
        dimensions: "",
        weight: "",
        specifications: {},
        applications: [],
        inStock: true,
        stockLevel: 10,
        safetyStock: 0,
        reorderPoint: 0,
        leadTimeDays: 7,
      },
    })
    productId = product.id
    const order = await prisma.order.create({
      data: {
        orderNumber: "NV-IDEM-" + Date.now().toString(36),
        email: "customer@example.com",
        status: "PENDING",
        total: 10000,
        currency: "usd",
        items: {
          create: [{ productId, name: product.name, price: 10000, quantity: qty }],
        },
      },
      include: { items: true },
    })
    orderId = order.id
    fakeEvent.data.object.metadata.orderId = orderId
  })

  afterAll(async () => {
    await prisma.inventoryMovement.deleteMany({ note: { contains: "NV-IDEM" } })
    await prisma.orderItem.deleteMany({ where: { orderId } })
    await prisma.order.delete({ where: { id: orderId } })
    await prisma.product.delete({ where: { id: productId } })
  })

  it("processes first webhook and sets paymentProcessedId and paidAt", async () => {
    const req1 = new Request("http://localhost/api/webhooks/stripe", {
      method: "POST",
      headers: { "stripe-signature": "dummy" },
      body: "payload",
    }) as any
    const res1 = await stripeWebhookPost(req1 as any)
    expect(res1.status).toBe(200)
    const product = await prisma.product.findUnique({ where: { id: productId } })
    expect(product?.stockLevel).toBe(10 - qty)
    const ord = await prisma.order.findUnique({ where: { id: orderId } })
    expect(ord?.status).toBe("PAID")
    expect(ord?.paymentProcessedId).toBe("pi_test_123")
    expect(ord?.paidAt).toBeTruthy()
    const movements = await prisma.inventoryMovement.findMany({ where: { productId } })
    expect(movements.filter(m => m.type === "SALE").length).toBe(1)
  })

  it("ignores repeat webhook for same PaymentIntent id", async () => {
    const req2 = new Request("http://localhost/api/webhooks/stripe", {
      method: "POST",
      headers: { "stripe-signature": "dummy2" },
      body: "payload2",
    }) as any
    const res2 = await stripeWebhookPost(req2 as any)
    expect(res2.status).toBe(200)
    const product = await prisma.product.findUnique({ where: { id: productId } })
    expect(product?.stockLevel).toBe(10 - qty)
    const movements = await prisma.inventoryMovement.findMany({ where: { productId } })
    expect(movements.filter(m => m.type === "SALE").length).toBe(1)
  })
})