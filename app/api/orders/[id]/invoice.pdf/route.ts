import { NextRequest } from "next/server"
import PDFDocument from "pdfkit"
import { prisma } from "@/lib/db"
import { auth } from "@/auth"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { items: true, user: true },
  })
  if (!order) {
    return new Response("Not found", { status: 404 })
  }
  const role = (session as any)?.user?.role
  const isPrivileged = ["ADMIN", "MANAGER"].includes(role)
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

  doc.fontSize(20).text("Invoice", { align: "right" })
  doc.moveDown()
  doc.fontSize(12).text("NV Mercantile")
  doc.text("Precision Manufacturing")
  doc.moveDown()
  doc.text(`Order Number: ${order.orderNumber}`)
  doc.text(`Order Date: ${new Date(order.createdAt).toLocaleString()}`)
  doc.text(`Customer: ${order.email}`)
  if (order.shippingName) doc.text(`Ship To: ${order.shippingName}`)
  if (order.shippingAddress) doc.text(order.shippingAddress)
  doc.moveDown()

  doc.fontSize(12).text("Items", { underline: true })
  doc.moveDown(0.5)
  for (const it of order.items) {
    doc.text(`${it.name}  x${it.quantity}  $${(it.price * it.quantity / 100).toFixed(2)}`)
  }
  doc.moveDown()
  doc.text(`Total: $${(order.total / 100).toFixed(2)} ${order.currency.toUpperCase()}`, { align: "right" })

  if (order.trackingNumber) {
    doc.moveDown()
    doc.text(`Tracking: ${order.trackingNumber}`)
    if (order.trackingUrl) doc.text(order.trackingUrl)
  }

  doc.end()
  const pdfBuffer = await done

  return new Response(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="invoice-${order.orderNumber}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  })
}