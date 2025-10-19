import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { generateTotpSecret, generateBackupCodes } from "@/lib/2fa"

export async function POST(req: NextRequest) {
  const session = await auth()
  const userId = (session as any)?.user?.id
  const email = (session as any)?.user?.email
  if (!userId || !email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { secret, otpauth } = generateTotpSecret(email)

  await prisma.user.update({
    where: { id: userId },
    data: { totpSecret: secret, twoFactorEnabled: false },
  })

  // Pre-generate backup codes (not yet shown until verified)
  const codes = generateBackupCodes()
  await prisma.backupCode.deleteMany({ where: { userId } })
  await prisma.backupCode.createMany({
    data: codes.map((c) => ({ userId, codeHash: c.hash })),
  })

  return NextResponse.json({ otpauth })
}