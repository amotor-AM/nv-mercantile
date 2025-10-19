import { NextRequest, NextResponse } from "next/server"
import { applyShipmentStatusUpdate, mapProviderStatusToShipmentStatus } from "@/lib/shipping"
import { incCounter } from "@/lib/metrics"
import { getClientIp, logAdminAction } from "@/lib/security"

/**
 * Carrier webhook endpoint
 * Supports Shippo-like payloads and a simple generic format.
 * Generic format example:
 * {
 *   "provider": "mock",
 *   "trackingNumber": "MOCK123",
 *   "status": "in_transit",
 *   "description": "Departed facility",
 *   "location": "Reno, NV",
 *   "occurredAt": "2024-01-01T00:00:00Z"
 * }
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) {
    await incCounter("webhook_error_carrier")
    try {
      await logAdminAction({
        action: "webhook.error",
        targetType: "Carrier",
        targetId: null,
        payload: { reason: "invalid_json" },
        ip: getClientIp(req),
        userAgent: req.headers.get("user-agent"),
      })
    } catch {}
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  // Generic fields
  let trackingNumber: string | undefined =
    body.trackingNumber ||
    body.tracking_number ||
    body?.data?.tracking_number ||
    body?.tracking?.tracking_number ||
    body?.tracking?.number
  // Try provider references too
  let providerShipmentId: string | undefined =
    body.providerShipmentId || body.object_id || body?.data?.object_id || body?.tracking?.object_id

  let statusRaw: string | undefined =
    body.status ||
    body.tracking_status?.status ||
    body.current_status ||
    body?.data?.tracking_status?.status

  let description: string | undefined =
    body.description ||
    body.tracking_status?.status_details ||
    body?.data?.tracking_status?.status_details

  let location: string | undefined =
    body.location ||
    body.tracking_status?.location ||
    body?.data?.tracking_status?.location

  let occurredAt: Date | undefined =
    (body.occurredAt && new Date(body.occurredAt)) ||
    (body.tracking_status?.status_date && new Date(body.tracking_status.status_date)) ||
    (body?.data?.tracking_status?.status_date && new Date(body.data.tracking_status.status_date)) ||
    new Date()

  if (!trackingNumber && !providerShipmentId) {
    await incCounter("webhook_error_carrier")
    try {
      await logAdminAction({
        action: "webhook.error",
        targetType: "Carrier",
        targetId: null,
        payload: { reason: "missing_tracking_identifier" },
        ip: getClientIp(req),
        userAgent: req.headers.get("user-agent"),
      })
    } catch {}
    return NextResponse.json({ error: "Missing tracking identifier" }, { status: 400 })
  }
  const status = mapProviderStatusToShipmentStatus(statusRaw || "pre_transit")

  await applyShipmentStatusUpdate({
    trackingNumber,
    providerShipmentId,
    status,
    description,
    location: typeof location === "object" ? JSON.stringify(location) : location,
    occurredAt,
    raw: body,
  })

  await incCounter("webhook_ok_carrier")

  return NextResponse.json({ ok: true })
}