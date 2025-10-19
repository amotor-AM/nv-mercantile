import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { verifyRegistrationResponse } from "@simplewebauthn/server"
import { getOrigin, getRpID } from "@/lib/webauthn-config"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })

  const expectedChallenge = req.cookies.get("nv_webauthn_chal")?.value || ""
  if (!expectedChallenge) return NextResponse.json({ error: "Missing challenge" }, { status: 400 })

  let verified
  try {
    verified = await verifyRegistrationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: getOrigin(),
      expectedRPID: getRpID(),
      requireUserVerification: true,
    })
  } catch (err: any) {
    return NextResponse.json({ error: "Verification failed", message: err?.message }, { status: 400 })
  }

  if (!verified?.verified) {
    return NextResponse.json({ error: "Invalid registration" }, { status: 400 })
  }

  const { registrationInfo } = verified
  if (!registrationInfo) return NextResponse.json({ error: "Missing registrationInfo" }, { status: 400 })

  const credId = registrationInfo.credentialID
  const pubKey = registrationInfo.credentialPublicKey
  const counter = registrationInfo.counter ?? 0

  await prisma.webAuthnCredential.create({
    data: {
      userId: session.user.id,
      credentialId: Buffer.from(credId).toString("base64url"),
      publicKey: Buffer.from(pubKey).toString("base64"),
      counter,
      name: body?.name || null,
    },
  })

  const res = NextResponse.json({ ok: true })
  res.cookies.set("nv_webauthn_chal", "", { httpOnly: true, maxAge: 0, path: "/" })
  return res
}