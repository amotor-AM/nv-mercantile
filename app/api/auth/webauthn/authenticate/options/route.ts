import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { generateAuthenticationOptions } from "@simplewebauthn/server"
import { getRpID } from "@/lib/webauthn-config"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const creds = await prisma.webAuthnCredential.findMany({ where: { userId: session.user.id } })
  const options = await generateAuthenticationOptions({
    rpID: getRpID(),
    allowCredentials: creds.map((c) => ({ id: Buffer.from(c.credentialId, "base64url"), type: "public-key" })),
    userVerification: "preferred",
    timeout: 60000,
  })

  const res = NextResponse.json(options)
  res.cookies.set("nv_webauthn_chal", options.challenge, { httpOnly: true, maxAge: 300, sameSite: "lax", path: "/" })
  return res
}