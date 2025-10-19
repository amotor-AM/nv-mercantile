import { createHash, randomUUID } from "crypto"
import { NextRequest } from "next/server"
import { prisma } from "./db"
import { logEvent } from "./logger"

export function getClientIp(req: NextRequest): string {
  const h = req.headers
  const ip = h.get("cf-connecting-ip") || h.get("x-forwarded-for")?.split(",")[0]?.trim() || ""
  return ip || "unknown"
}

export function hashPayload(payload: any): string {
  const s = typeof payload === "string" ? payload : JSON.stringify(payload)
  return createHash("sha256").update(s).digest("hex")
}

export async function logAdminAction(params: {
  userId?: string | null
  action: string
  targetType?: string | null
  targetId?: string | null
  payload?: any
  ip?: string | null
  userAgent?: string | null
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId ?? null,
        action: params.action,
        targetType: params.targetType ?? null,
        targetId: params.targetId ?? null,
        payloadHash: hashPayload(params.payload ?? {}),
        ip: params.ip ?? null,
        userAgent: params.userAgent ?? null,
      },
    })
  } catch {
    // avoid throwing from audit logging
  }
  // Also log to centralized sink
  logEvent({
    msg: "admin_action",
    data: {
      userId: params.userId ?? null,
      action: params.action,
      targetType: params.targetType ?? null,
      targetId: params.targetId ?? null,
      ip: params.ip ?? null,
      userAgent: params.userAgent ?? null,
      ts: Date.now(),
    },
  })
}

export function generateCsrfToken(): string {
  return randomUUID()
}