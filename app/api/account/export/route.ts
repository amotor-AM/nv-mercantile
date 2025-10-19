import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"

export async function GET() {
  const session = await auth()
  const userId = (session as any)?.user?.id
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      orders: { include: { items: true, shipments: true } },
      tickets: { include: { messages: true } },
      accounts: true,
      sessions: true,
      auditLogs: true,
      devices: true,
    },
  })

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Redact sensitive fields in export
  const exportData = {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
    role: user.role,
    orders: user.orders,
    tickets: user.tickets,
    linkedAccounts: user.accounts.map((a) => ({ provider: a.provider, providerAccountId: a.providerAccountId })),
    auditLogs: user.auditLogs,
    devices: user.devices,
  }

  return NextResponse.json(exportData)
}