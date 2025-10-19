import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

async function getOrder(id: string, userId?: string, email?: string) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: { include: { category: true } } } },
      shipments: {
        include: {
          items: { include: { orderItem: { include: { product: true } } } },
          events: { orderBy: { occurredAt: "asc" } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  })
  if (!order) return null
  const isOwner = (order.userId && userId && order.userId === userId) || (email && order.email === email)
  return isOwner ? order : null
}

export default async function AccountOrderDetailPage({ params }: { params: { id: string } }) {
  const session = await auth()
  const order = await getOrder(params.id, session?.user?.id, session?.user?.email || undefined)
  if (!order) notFound()

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Order {order.orderNumber}</h1>
          <div className="text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleString()}</div>
        </div>
        <Link href="/account/orders" className="underline text-sm">Back to orders</Link>
      </div>
      <Separator />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-md border p-4 space-y-3">
          <div className="text-sm font-medium">Items</div>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((it) => (
                  <TableRow key={it.id}>
                    <TableCell>{it.name}</TableCell>
                    <TableCell>{it.quantity}</TableCell>
                    <TableCell>${(it.price / 100).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="text-right text-sm">Total: <span className="font-medium">${(order.total / 100).toFixed(2)}</span></div>
        </div>
        <div className="rounded-md border p-4 space-y-2">
          <div className="text-sm font-medium">Shipping</div>
          <div className="text-sm">{order.shippingName}</div>
          <div className="text-sm text-muted-foreground whitespace-pre-wrap">{order.shippingAddress}</div>
          <div className="text-sm text-muted-foreground">{order.email}</div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="text-lg font-medium">Shipments</div>
        {order.shipments.length === 0 && (
          <div className="text-sm text-muted-foreground">No shipments yet. You&apos;ll see tracking updates here once your order ships.</div>
        )}
        {order.shipments.map((s) => (
          <div key={s.id} className="rounded-md border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <div className="font-medium">Status: <span className="capitalize">{(s.status || "CREATED").toLowerCase().replaceAll("_", " ")}</span></div>
                <div className="text-muted-foreground">Carrier: {s.carrier || "-"} • Service: {s.service || "-"}</div>
                <div className="text-muted-foreground">
                  Tracking: {s.trackingNumber || "-"} {s.trackingUrl && (<a className="underline ml-2" href={s.trackingUrl} target="_blank" rel="noopener noreferrer">Track</a>)}
                </div>
              </div>
            </div>
            <div className="rounded-md border p-3 space-y-2">
              {s.events.length === 0 && <div className="text-sm text-muted-foreground">No events yet.</div>}
              {s.events.map((ev) => (
                <div key={ev.id} className="text-sm">
                  <div className="flex justify-between">
                    <div className="capitalize">{(ev.status || "").toLowerCase().replaceAll("_", " ")}</div>
                    <div className="text-muted-foreground">{new Date(ev.occurredAt).toLocaleString()}</div>
                  </div>
                  {ev.description && <div className="text-muted-foreground">{ev.description}</div>}
                  {ev.location && <div className="text-muted-foreground">{ev.location}</div>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}