import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { verifyTotp } from "@/lib/2fa"

export async function POST(req: NextRequest) {
  const session = await auth()
  const userId = (session as any)?.user?.id
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const token = String(body.token || "")
  if (!token) return NextResponse.json({ error: "token required" }, { status: 422 })

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user?.totpSecret) return NextResponse.json({ error: "TOTP not initialized" }, { status: 400 })

  const ok = verifyTotp(user.totpSecret, token)
  if (!ok) return NextResponse.json({ error: "Invalid code" }, { status: 422 })

  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorEnabled: true },
  })

  return NextResponse.json({ ok: true })
}