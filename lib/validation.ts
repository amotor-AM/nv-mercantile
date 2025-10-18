import { z } from "zod"

export const ProductCreateSchema = z.object({
  slug: z.string().min(1).max(128),
  name: z.string().min(1).max(256),
  subtitle: z.string().max(256).optional(),
  price: z.number().positive(),
  material: z.string().max(128).optional(),
  category: z.string().max(128).optional(),
  leadTime: z.string().max(128).optional(),
  description: z.string().optional(),
  image: z.string().url().optional(),
  dimensions: z.string().max(256).optional(),
  weight: z.string().max(128).optional(),
  specifications: z.record(z.any()).optional(),
  applications: z.array(z.string()).optional(),
  stockLevel: z.number().int().min(0).optional(),
  safetyStock: z.number().int().min(0).optional(),
  reorderPoint: z.number().int().min(0).optional(),
  leadTimeDays: z.number().int().min(0).optional(),
})

export const ProductUpdateSchema = ProductCreateSchema.partial().extend({
  inStock: z.boolean().optional(),
})

export const InventoryAdjustSchema = z.object({
  quantity: z.number().int().positive().max(100000),
  type: z.enum(["RESTOCK", "ADJUSTMENT"]),
  note: z.string().max(500).optional(),
})

export const OrderItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive().max(1000),
})

export const OrderCreateSchema = z.object({
  email: z.string().email(),
  userId: z.string().optional(),
  items: z.array(OrderItemSchema).min(1),
  shipping: z
    .object({
      name: z.string().min(1).max(200).optional(),
      phone: z.string().min(7).max(30).optional(),
      address: z.string().min(3).max(500).optional(),
    })
    .optional(),
})

export const OrderUpdateSchema = z.object({
  status: z.enum(["PENDING", "AWAITING_PAYMENT", "PAID", "FULFILLED", "CANCELLED", "REFUNDED"]).optional(),
  trackingCarrier: z.string().max(64).optional(),
  trackingNumber: z.string().max(128).optional(),
  trackingUrl: z.string().url().optional(),
  shippedAt: z.string().optional(), // ISO date
})

export const RefundCreateSchema = z.object({
  amount: z.number().int().positive().max(10_000_000),
  reason: z.string().max(1000).optional(),
})

export const SupportCreateSchema = z.object({
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(5000),
  email: z.string().email().optional(),
})

export const SupportMessageSchema = z.object({
  body: z.string().min(1).max(4000),
  status: z.enum(["OPEN", "PENDING", "RESOLVED"]).optional(),
})

export const RmaStartSchema = z.object({
  reason: z.string().max(1000).optional(),
  items: z.array(z.object({ orderItemId: z.string(), quantity: z.number().int().positive().max(1000) })).min(1),
})

export const RmaReceiveSchema = z.object({
  received: z.array(z.object({ returnItemId: z.string(), qty: z.number().int().min(0).max(1000) })).min(1),
})