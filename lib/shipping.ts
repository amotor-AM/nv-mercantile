import { prisma } from "./db"
import { sendOrderShippedEmail, sendShipmentDeliveredEmail, sendShipmentExceptionEmail, sendShipmentOutForDeliveryEmail } from "./email"

/**
 * Shipping provider selection
 */
function getProvider(): "mock" | "shippo" | "easypost" | "aftership" {
  const env = (process.env.SHIPPING_PROVIDER || "").toLowerCase()
  if (env === "shippo") return "shippo"
  if (env === "easypost") return "easypost"
  if (env === "aftership") return "aftership"
  return "mock"
}

export type CreateShipmentParams = {
  orderId: string
  items: { orderItemId: string; quantity: number }[]
  parcel?: {
    weightOz?: number
    weightGrams?: number
    length?: number
    width?: number
    height?: number
    distanceUnit?: "in" | "cm"
  }
  carrier?: string
  service?: string
  purchaseLabel?: boolean
}

export type ProviderPurchaseResult = {
  labelUrl?: string
  trackingNumber?: string
  trackingUrl?: string
  providerShipmentId?: string
  carrier?: string
  service?: string
  costCents?: number
  currency?: string
  raw?: any
}

/**
 * Purchase a shipping label via the configured provider.
 * Defaults to a mock provider when no provider is configured.
 */
async function providerPurchaseLabel(_: {
  to: any
  from: any
  parcel: any
  opts?: { carrier?: string; service?: string }
}): Promise<ProviderPurchaseResult> {
  const provider = getProvider()

  if (provider === "shippo") {
    const apiKey = process.env.SHIPPO_API_KEY
    if (!apiKey) {
      throw new Error("SHIPPO_API_KEY is not set")
    }
    // NOTE: This is a minimal implementation using Shippo's REST API.
    // It assumes `to` and `from` are objects roughly matching Shippo's Address schema.
    // For production use, ensure shipping addresses are structured (street, city, state, zip, country).
    const base = "https://api.goshippo.com"

    const headers = {
      Authorization: `ShippoToken ${apiKey}`,
      "Content-Type": "application/json",
    }

    // Create shipment with rates
    const shipmentResp = await fetch(`${base}/shipments/`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        address_to: _.to,
        address_from: _.from,
        parcels: [_.parcel],
        async: false,
      }),
    })
    if (!shipmentResp.ok) {
      const t = await shipmentResp.text().catch(() => "")
      throw new Error(`Shippo create shipment failed: ${shipmentResp.status} ${t}`)
    }
    const shipment = await shipmentResp.json()

    // Choose a rate
    const rates: any[] = shipment?.rates ?? []
    const rate =
      rates.find((r) => {
        const carrierOk = !_.opts?.carrier || r.provider?.toLowerCase() === _.opts?.carrier?.toLowerCase()
        const serviceOk = !_.opts?.service || r.servicelevel?.token?.toLowerCase() === _.opts?.service?.toLowerCase()
        return carrierOk && serviceOk
      }) || rates[0]
    if (!rate) throw new Error("No rates available for shipment")

    // Purchase transaction (label)
    const txnResp = await fetch(`${base}/transactions/`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        rate: rate.object_id,
        async: false,
      }),
    })
    if (!txnResp.ok) {
      const t = await txnResp.text().catch(() => "")
      throw new Error(`Shippo purchase failed: ${txnResp.status} ${t}`)
    }
    const txn = await txnResp.json()

    const labelUrl = txn?.label_url || undefined
    const trackingNumber = txn?.tracking_number || undefined
    const trackingUrl = txn?.tracking_url_provider || undefined
    return {
      labelUrl,
      trackingNumber,
      trackingUrl,
      providerShipmentId: txn?.object_id,
      carrier: rate?.provider,
      service: rate?.servicelevel?.token,
      costCents: typeof rate?.amount === "string" ? Math.round(parseFloat(rate.amount) * 100) : undefined,
      currency: rate?.currency || "usd",
      raw: { shipment, rate, transaction: txn },
    }
  }

  // Mock provider
  const fake = Math.random().toString(36).slice(2).toUpperCase()
  return {
    labelUrl: `https://example.com/labels/${fake}.pdf`,
    trackingNumber: `MOCK${Date.now().toString().slice(-8)}`,
    trackingUrl: `https://example.com/track/${fake}`,
    providerShipmentId: `mock_${fake}`,
    carrier: _.opts?.carrier || "MockCarrier",
    service: _.opts?.service || "Ground",
    costCents: 0,
    currency: "usd",
    raw: { provider: "mock" },
  }
}

export async function createShipmentAndMaybePurchaseLabel(params: CreateShipmentParams) {
  const order = await prisma.order.findUnique({
    where: { id: params.orderId },
    include: { items: true, shipments: true },
  })
  if (!order) throw new Error("Order not found")
  if (!order.shippingAddress) throw new Error("Order missing shipping address")

  const itemsById = new Map(order.items.map((i) => [i.id, i]))
  // Validate and clamp quantities
  const shipmentItems = params.items
    .map((it) => ({
      ref: itemsById.get(it.orderItemId),
      quantity: Math.max(1, Math.min(it.quantity, itemsById.get(it.orderItemId)?.quantity || 0)),
    }))
    .filter((x) => x.ref && x.quantity > 0) as { ref: typeof order.items[number]; quantity: number }[]
  if (shipmentItems.length === 0) throw new Error("No valid items selected for shipment")

  const provider = getProvider()

  // Build basic address objects. For real carriers you'd want structured addresses.
  const toAddress: any = {
    name: order.shippingName || order.email,
    street1: order.shippingAddress,
    phone: order.shippingPhone || undefined,
    country: "US",
  }
  const fromAddress: any = {
    name: process.env.SHIP_FROM_NAME || "Warehouse",
    street1: process.env.SHIP_FROM_ADDRESS || "123 Warehouse St",
    city: process.env.SHIP_FROM_CITY || undefined,
    state: process.env.SHIP_FROM_STATE || undefined,
    zip: process.env.SHIP_FROM_ZIP || undefined,
    country: process.env.SHIP_FROM_COUNTRY || "US",
    phone: process.env.SHIP_FROM_PHONE || undefined,
  }

  // Parcel
  const parcel: any = {
    weight: params.parcel?.weightOz ?? params.parcel?.weightGrams ?? 16, // default 16oz
    mass_unit: params.parcel?.weightOz ? "oz" : "g",
    ...(params.parcel?.length && {
      length: params.parcel.length,
      width: params.parcel.width,
      height: params.parcel.height,
      distance_unit: params.parcel.distanceUnit || "in",
    }),
  }

  let purchase: ProviderPurchaseResult | undefined
  if (params.purchaseLabel) {
    purchase = await providerPurchaseLabel({
      to: toAddress,
      from: fromAddress,
      parcel,
      opts: { carrier: params.carrier, service: params.service },
    })
  }

  // Create Shipment record
  const shipment = await prisma.shipment.create({
    data: {
      orderId: order.id,
      carrier: purchase?.carrier || params.carrier,
      service: purchase?.service || params.service,
      trackingNumber: purchase?.trackingNumber,
      trackingUrl: purchase?.trackingUrl,
      status: purchase ? "LABEL_PURCHASED" : "CREATED",
      labelUrl: purchase?.labelUrl,
      labelCost: purchase?.costCents,
      labelCurrency: purchase?.currency,
      provider: provider.toUpperCase() as any,
      providerShipmentId: purchase?.providerShipmentId,
      rawEvents: null,
      items: {
        create: shipmentItems.map((s) => ({
          orderItemId: s.ref.id,
          quantity: s.quantity,
        })),
      },
    },
    include: { items: { include: { orderItem: true } } },
  })

  // Record an initial event if we purchased a label
  if (purchase) {
    await prisma.shipmentEvent.create({
      data: {
        shipmentId: shipment.id,
        status: "LABEL_PURCHASED",
        description: "Shipping label purchased",
        occurredAt: new Date(),
        raw: purchase.raw || null,
      },
    })
  }

  // Send shipped email if we have a label and tracking
  if (purchase?.trackingNumber || purchase?.trackingUrl) {
    try {
      await sendOrderShippedEmail(order.id, {
        trackingNumber: purchase?.trackingNumber,
        trackingUrl: purchase?.trackingUrl,
      })
    } catch {}
  }

  return shipment
}

/**
 * Map various provider event statuses to our ShipmentStatus
 */
export function mapProviderStatusToShipmentStatus(input: string): "PRE_TRANSIT" | "IN_TRANSIT" | "OUT_FOR_DELIVERY" | "DELIVERED" | "EXCEPTION" {
  const s = (input || "").toLowerCase()
  if (s.includes("out_for_delivery") || s.includes("out for delivery")) return "OUT_FOR_DELIVERY"
  if (s.includes("delivered")) return "DELIVERED"
  if (s.includes("exception") || s.includes("failure") || s.includes("return")) return "EXCEPTION"
  if (s.includes("in_transit") || s.includes("transit")) return "IN_TRANSIT"
  return "PRE_TRANSIT"
}

/**
 * Apply a status update to a shipment and append a timeline event.
 * Also handles order-level derived status and notification emails.
 */
export async function applyShipmentStatusUpdate(args: {
  trackingNumber?: string
  providerShipmentId?: string
  status: "PRE_TRANSIT" | "IN_TRANSIT" | "OUT_FOR_DELIVERY" | "DELIVERED" | "EXCEPTION"
  description?: string
  location?: string
  occurredAt?: Date
  raw?: any
}) {
  const where: any = {}
  if (args.trackingNumber) where.trackingNumber = args.trackingNumber
  if (args.providerShipmentId) where.providerShipmentId = args.providerShipmentId
  if (!where.trackingNumber && !where.providerShipmentId) {
    throw new Error("Must provide trackingNumber or providerShipmentId")
  }

  const shipment = await prisma.shipment.findFirst({ where })
  if (!shipment) return

  const status = args.status
  const updates: any = { status }
  if (status === "OUT_FOR_DELIVERY") {
    // nothing else
  } else if (status === "DELIVERED") {
    updates.deliveredAt = args.occurredAt || new Date()
  } else if (status === "IN_TRANSIT" || status === "PRE_TRANSIT") {
    updates.shippedAt = updates.shippedAt || args.occurredAt || new Date()
  }

  const updated = await prisma.shipment.update({
    where: { id: shipment.id },
    data: updates,
  })

  await prisma.shipmentEvent.create({
    data: {
      shipmentId: shipment.id,
      status,
      description: args.description,
      location: args.location,
      occurredAt: args.occurredAt || new Date(),
      raw: args.raw || null,
    },
  })

  // Recompute order derived status: fulfilled when all shipments delivered
  await recomputeOrderStatus(updated.orderId)

  // Trigger emails
  try {
    const order = await prisma.order.findUnique({ where: { id: updated.orderId } })
    if (!order) return
    if (status === "OUT_FOR_DELIVERY") {
      await sendShipmentOutForDeliveryEmail(order.id, {
        trackingNumber: shipment.trackingNumber || undefined,
        trackingUrl: shipment.trackingUrl || undefined,
      })
    } else if (status === "DELIVERED") {
      await sendShipmentDeliveredEmail(order.id, {
        trackingNumber: shipment.trackingNumber || undefined,
        trackingUrl: shipment.trackingUrl || undefined,
      })
    } else if (status === "EXCEPTION") {
      await sendShipmentExceptionEmail(order.id, {
        trackingNumber: shipment.trackingNumber || undefined,
        trackingUrl: shipment.trackingUrl || undefined,
      })
    }
  } catch {}
}

/**
 * Recompute and persist the order status from its shipments
 * - If every shipment is DELIVERED and there is at least one shipment, set order.status = FULFILLED
 * - Otherwise leave status as-is (do not downgrade)
 * Also mirror top-level order tracking fields to the latest shipment for backwards compatibility.
 */
export async function recomputeOrderStatus(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { shipments: true },
  })
  if (!order) return
  if (order.shipments.length === 0) return

  const allDelivered = order.shipments.every((s) => s.status === "DELIVERED")
  const latest = order.shipments.sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))[0]

  const data: any = {
    trackingCarrier: latest?.carrier || null,
    trackingNumber: latest?.trackingNumber || null,
    trackingUrl: latest?.trackingUrl || null,
  }
  if (allDelivered && order.status !== "FULFILLED") {
    data.status = "FULFILLED"
  }
  if (latest?.shippedAt && !order.shippedAt) {
    data.shippedAt = latest.shippedAt
  }

  await prisma.order.update({ where: { id: order.id }, data })
}