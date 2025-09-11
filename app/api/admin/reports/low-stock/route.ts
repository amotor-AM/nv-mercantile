import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { sendLowStockReportEmail } from "@/lib/email"

export async function GET() {
  const session = await auth()
  const role = (session as any)?.user?.role
  if (!["ADMIN","MANAGER"].includes(role)) {
    return new Response("Unauthorized", { status: 401 })
  }

  const products = await prisma.product.findMany({
    orderBy: { stockLevel: "asc" },
    take: 1000,
  })

  const items = products
    .filter((p) => !p.inStock || p.stockLevel <= 0 || (p.reorderPoint > 0 && p.stockLevel <= p.reorderPoint))
    .map((p) => ({
      name: p.name,
      stockLevel: p.stockLevel,
      safetyStock: p.safetyStock,
      reorderPoint: p.reorderPoint,
    }))

  try { await sendLowStockReportEmail(items) } catch {}

  return new Response(JSON.stringify({ count: items.length }), { status: 200 })
}