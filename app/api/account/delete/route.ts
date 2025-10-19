import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"

export async function POST(req: NextRequest) {
  const session = await auth()
  const userId = (session as any)?.user?.id
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const confirm = String(body.confirm || "")
  if (confirm !== "DELETE") return NextResponse.json({ error: "Confirmation required" }, { status: 422 })

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Anonymize orders to break FK and remove PII
  await prisma.order.updateMany({
    where: { userId },
    data: { userId: null, email: `deleted+${Date.now()}@example.com` },
  })

  // Redact support tickets & messages
  await prisma.supportMessage.updateMany({
    where: { ticket: { userId } },
    data: { body: "[redacted]" },
  })
  await prisma.supportTicket.updateMany({
    where: { userId },
    data: { email: `deleted+${Date.now()}@example.com` },
  })

  // Delete sessions, accounts, devices, backup codes
  await prisma.session.deleteMany({ where: { userId } })
  await prisma.account.deleteMany({ where: { userId } })
  await prisma.userDevice.deleteMany({ where: { userId } })
  await prisma.backupCode.deleteMany({ where: { userId } })
  await prisma.webAuthnCredential.deleteMany({ where: { userId } })
  await prisma.auditLog.updateMany({ where: { userId }, data: { userId: null } })

  // Finally delete user
  await prisma.user.delete({ where: { id: userId } })

  return NextResponse.json({ ok: true })
}