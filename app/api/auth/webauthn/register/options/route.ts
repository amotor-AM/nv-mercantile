import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { generateRegistrationOptions } from "@simplewebauthn/server"
import { getOrigin, getRpID, getRpName } from "@/lib/webauthn-config"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const creds = await prisma.webAuthnCredential.findMany({ where: { userId: session.user.id } })
  const options = await generateRegistrationOptions({
    rpName: getRpName(),
    rpID: getRpID(),
    userName: session.user.email || session.user.id,
    userID: session.user.id,
    attestationType: "direct",
    authenticatorSelection: { residentKey: "preferred", userVerification: "preferred" },
    timeout: 60000,
    excludeCredentials: creds.map((c) => ({ id: Buffer.from(c.credentialId, "base64url"), type: "public-key" })),
  })

  // Store challenge in a short-lived cookie
  const res = NextResponse.json(options)
  res.cookies.set("nv_webauthn_chal", options.challenge, { httpOnly: true, maxAge: 300, sameSite: "lax", path: "/" })
  return res
}