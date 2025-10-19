import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { getClientIp, logAdminAction } from "@/lib/security"

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const cred = await prisma.webAuthnCredential.findUnique({ where: { id: params.id } })
  if (!cred || cred.userId !== session.user.id) return NextResponse.json({ error: "Not found" }, { status: 404 })
  await prisma.webAuthnCredential.delete({ where: { id: params.id } })

  await logAdminAction({
    userId: session.user.id,
    action: "webauthn.credential.delete",
    targetType: "WebAuthnCredential",
    targetId: params.id,
    payload: {},
    ip: getClientIp(req),
    userAgent: req.headers.get("user-agent"),
  })

  return NextResponse.json({ ok: true })
}