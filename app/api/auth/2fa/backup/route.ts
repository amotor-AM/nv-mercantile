import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { generateBackupCodes } from "@/lib/2fa"

export async function GET() {
  const session = await auth()
  const userId = (session as any)?.user?.id
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const codes = await prisma.backupCode.findMany({ where: { userId } })
  // We cannot return raw codes (only hashes are stored).
  // Provide a count and usage info.
  return NextResponse.json({
    total: codes.length,
    used: codes.filter((c) => !!c.usedAt).length,
    unused: codes.filter((c) => !c.usedAt).length,
  })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  const userId = (session as any)?.user?.id
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const codes = generateBackupCodes()
  await prisma.backupCode.deleteMany({ where: { userId } })
  await prisma.backupCode.createMany({
    data: codes.map((c) => ({ userId, codeHash: c.hash })),
  })

  // Return the new plaintext codes for immediate download by the user
  return NextResponse.json({ codes: codes.map((c) => c.code) })
}