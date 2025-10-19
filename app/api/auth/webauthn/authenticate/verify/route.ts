import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { verifyAuthenticationResponse } from "@simplewebauthn/server"
import { getOrigin, getRpID } from "@/lib/webauthn-config"
import { logAdminAction, getClientIp } from "@/lib/security"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })

  const expectedChallenge = req.cookies.get("nv_webauthn_chal")?.value || ""
  if (!expectedChallenge) return NextResponse.json({ error: "Missing challenge" }, { status: 400 })

  const creds = await prisma.webAuthnCredential.findMany({ where: { userId: session.user.id } })
  const credential = creds.find((c) => c.credentialId === body?.id)
  const selected = credential || creds[0]
  if (!selected) return NextResponse.json({ error: "No credentials" }, { status: 400 })

  let verified
  try {
    verified = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: getOrigin(),
      expectedRPID: getRpID(),
      requireUserVerification: true,
      authenticator: {
        credentialID: Buffer.from(selected.credentialId, "base64url"),
        credentialPublicKey: Buffer.from(selected.publicKey, "base64"),
        counter: selected.counter ?? 0,
      },
    })
  } catch (err: any) {
    await logAdminAction({
      userId: session.user.id,
      action: "webauthn.auth.error",
      targetType: "User",
      targetId: session.user.id,
      payload: { error: err?.message || String(err) },
      ip: getClientIp(req),
      userAgent: req.headers.get("user-agent"),
    })
    return NextResponse.json({ error: "Verification failed", message: err?.message }, { status: 400 })
  }

  if (!verified?.verified) {
    return NextResponse.json({ error: "Invalid authentication" }, { status: 400 })
  }

  // Update counter for the used credential
  try {
    const newCounter = verified.authenticationInfo?.newCounter
    if (typeof newCounter === "number") {
      await prisma.webAuthnCredential.update({
        where: { id: selected.id },
        data: { counter: newCounter },
      })
    }
  } catch {}

  // Set 2FA OK cookie
  const res = NextResponse.json({ ok: true })
  res.cookies.set("nv_2fa_ok", "true", { httpOnly: true, maxAge: 60 * 60 * 24 * 30, sameSite: "lax", path: "/" })

  await logAdminAction({
    userId: session.user.id,
    action: "webauthn.auth.ok",
    targetType: "User",
    targetId: session.user.id,
    payload: {},
    ip: getClientIp(req),
    userAgent: req.headers.get("user-agent"),
  })

  return res
}