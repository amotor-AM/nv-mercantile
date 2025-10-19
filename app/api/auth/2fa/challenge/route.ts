import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { getClientIp } from "@/lib/security"
import { hashCode, verifyTotp } from "@/lib/2fa"

export async function POST(req: NextRequest) {
  const session = await auth()
  const userId = (session as any)?.user?.id
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { token, backupCode, rememberDevice, deviceName } = body as {
    token?: string
    backupCode?: string
    rememberDevice?: boolean
    deviceName?: string
  }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user?.twoFactorEnabled) {
    return NextResponse.json({ error: "2FA not enabled" }, { status: 400 })
  }

  let ok = false
  if (token && user.totpSecret) {
    ok = verifyTotp(user.totpSecret, String(token))
  }
  if (!ok && backupCode) {
    const hash = hashCode(String(backupCode))
    const bc = await prisma.backupCode.findFirst({ where: { userId, codeHash: hash, usedAt: null } })
    if (bc) {
      ok = true
      await prisma.backupCode.update({ where: { id: bc.id }, data: { usedAt: new Date() } })
    }
  }

  if (!ok) {
    return NextResponse.json({ error: "Invalid verification" }, { status: 422 })
  }

  const res = NextResponse.json({ ok: true })

  // Mark device as trusted and set cookie
  res.cookies.set("nv_2fa_ok", "true", {
    path: "/",
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    // Trust for 30 days
    maxAge: 60 * 60 * 24 * 30,
  })

  if (rememberDevice) {
    await prisma.userDevice.create({
      data: {
        userId,
        name: deviceName || "Trusted device",
        userAgent: req.headers.get("user-agent") || "",
        ip: getClientIp(req),
        trusted: true,
        lastSeen: new Date(),
      },
    })
  }

  return res
}