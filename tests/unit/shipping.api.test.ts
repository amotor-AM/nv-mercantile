import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { prisma } from "../../lib/db"
import { createShipmentAndMaybePurchaseLabel } from "../../lib/shipping"

describe("Create shipment and purchase label (mock provider)", () => {
  let orderId: string
  let orderItemId: string

  beforeAll(async () => {
    const product = await prisma.product.create({
      data: {
        slug: "precision-bearing-housing",
        name: "Precision Bearing Housing",
        subtitle: "",
        price: 245,
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
    const order = await prisma.order.create({
      data: {
        orderNumber: "NV-TEST",
        email: "customer@example.com",
        status: "PAID",
        total: 24500,
        currency: "usd",
        shippingName: "Jane Doe",
        shippingPhone: "555-123-4567",
        shippingAddress: "123 Test St, Reno, NV",
        items: {
          create: [{ productId: product.id, name: product.name, price: 24500, quantity: 2 }],
        },
      },
      include: { items: true },
    })
    orderId = order.id
    orderItemId = order.items[0].id
  })

  afterAll(async () => {
    await prisma.shipmentEvent.deleteMany({ where: { shipment: { orderId } } } as any)
    await prisma.shipmentItem.deleteMany({ where: { shipment: { orderId } } } as any)
    await prisma.shipment.deleteMany({ where: { orderId } })
    await prisma.orderItem.deleteMany({ where: { orderId } })
    await prisma.order.delete({ where: { id: orderId } })
    await prisma.product.deleteMany({ where: { slug: "precision-bearing-housing" } })
  })

  it("creates shipment with label and tracking", async () => {
    const shipment = await createShipmentAndMaybePurchaseLabel({
      orderId,
      items: [{ orderItemId, quantity: 1 }],
      parcel: { weightOz: 16 },
      purchaseLabel: true,
    })
    expect(shipment.status).toBe("LABEL_PURCHASED")
    expect(shipment.labelUrl).toBeTruthy()
    expect(shipment.trackingNumber || shipment.trackingUrl).toBeTruthy()

    const events = await prisma.shipmentEvent.findMany({ where: { shipmentId: shipment.id } })
    expect(events.length).toBeGreaterThan(0)
    expect(events[0].status).toBe("LABEL_PURCHASED")
  })
})