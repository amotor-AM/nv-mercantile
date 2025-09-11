import { NextRequest } from "next/server"
import PDFDocument from "pdfkit"
import { prisma } from "@/lib/db"
import { auth } from "@/auth"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { items: { include: { product: true, variant: true } } },
  })
  if (!order) {
    return new Response("Not found", { status: 404 })
  }
  const role = (session as any)?.user?.role
  const isPrivileged = ["ADMIN", "MANAGER", "WAREHOUSE"].includes(role)
  const isOwner = session?.user?.id && (order.userId === session.user.id || order.email === session.user.email)
  if (!isPrivileged && !isOwner) {
    return new Response("Unauthorized", { status: 401 })
  }

  const doc = new PDFDocument({ size: "LETTER", margin: 50 })
  const chunks: Uint8Array[] = []
  doc.on("data", (chunk) => chunks.push(chunk))
  const done = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)))
  })

  // Header
  doc.fontSize(18).text("Packing Slip", { align: "left" })
  doc.moveDown()
  doc.fontSize(12).text(`Order Number: ${order.orderNumber}`)
  doc.text(`Order Date: ${new Date(order.createdAt).toLocaleString()}`)
  doc.text(`Ship To: ${order.shippingName ?? ""}`)
  if (order.shippingAddress) doc.text(order.shippingAddress)
  doc.moveDown()

  // Items
  doc.fontSize(12).text("Items", { underline: true })
  doc.moveDown(0.5)
  order.items.forEach((it) => {
    const sku = it.variant?.sku ?? it.productId
    doc.text(`${sku} - ${it.name}  x${it.quantity}`)
  })
  doc.moveDown()
  if (order.trackingNumber) {
    doc.text(`Tracking: ${order.trackingNumber}`)
    if (order.trackingUrl) doc.text(order.trackingUrl)
  }

  doc.end()
  const pdfBuffer = await done

  return new Response(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="packing-slip-${order.orderNumber}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  })
}