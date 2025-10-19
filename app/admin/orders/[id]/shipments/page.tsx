"use client"

import useSWR from "swr"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { csrfHeader } from "@/lib/csrf"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function OrderShipmentsPage() {
  const params = useParams() as { id: string }
  const orderId = params.id
  const { data: order, mutate: mutateOrder } = useSWR(orderId ? `/api/orders/${orderId}` : null, fetcher)
  const { data: shipments, mutate, isLoading } = useSWR(orderId ? `/api/admin/orders/${orderId}/shipments` : null, fetcher)

  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    items: [] as { orderItemId: string; quantity: number }[],
    weightOz: 16,
    length: "",
    width: "",
    height: "",
    distanceUnit: "in",
    carrier: "",
    service: "",
    purchaseLabel: true,
  })

  const orderItems = order?.items || []
  const orderNumber = order?.orderNumber

  const submit = async () => {
    const payload: any = {
      items: form.items,
      parcel: {
        weightOz: Number(form.weightOz) || 16,
        length: form.length ? Number(form.length) : undefined,
        width: form.width ? Number(form.width) : undefined,
        height: form.height ? Number(form.height) : undefined,
        distanceUnit: form.distanceUnit || "in",
      },
      carrier: form.carrier || undefined,
      service: form.service || undefined,
      purchaseLabel: !!form.purchaseLabel,
    }
    await fetch(`/api/admin/orders/${orderId}/shipments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...csrfHeader() },
      body: JSON.stringify(payload),
    })
    setOpen(false)
    await mutate()
    await mutateOrder()
  }

  const toggleItem = (orderItemId: string, maxQty: number) => {
    const idx = form.items.findIndex((i) => i.orderItemId === orderItemId)
    if (idx >= 0) {
      const next = [...form.items]
      next.splice(idx, 1)
      setForm({ ...form, items: next })
    } else {
      setForm({ ...form, items: [...form.items, { orderItemId, quantity: Math.max(1, Math.min(1, maxQty)) }] })
    }
  }

  const updateQty = (orderItemId: string, qty: number, maxQty: number) => {
    const next = [...form.items]
    const idx = next.findIndex((i) => i.orderItemId === orderItemId)
    if (idx >= 0) {
      next[idx] = { ...next[idx], quantity: Math.max(1, Math.min(qty, maxQty)) }
      setForm({ ...form, items: next })
    }
  }

  const schedulePickup = async (shipmentId: string) => {
    await fetch(`/api/admin/shipments/${shipmentId}/schedule`, { method: "POST", headers: { ...csrfHeader() } })
    await mutate()
  }

  const printLabel = (labelUrl?: string) => {
    if (labelUrl) {
      window.open(labelUrl, "_blank", "noopener,noreferrer")
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">Shipments {orderNumber ? `for ${orderNumber}` : ""}</h1>
          <p className="text-sm text-muted-foreground">Create labels, schedule pickups, track status</p>
        </div>
        <Link href="/admin"><Button variant="outline">Back to Admin</Button></Link>
      </div>
      <Separator />

      <div className="flex items-center justify-between">
        <div className="text-sm">
          <div>Ship to: {order?.shippingName} • {order?.shippingAddress}</div>
          <div className="text-muted-foreground">{order?.email}</div>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Create shipment</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Shipment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium mb-2">Items</div>
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Qty ordered</TableHead>
                        <TableHead>Qty to ship</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orderItems.map((it: any) => {
                        const sel = form.items.find((i) => i.orderItemId === it.id)
                        return (
                          <TableRow key={it.id}>
                            <TableCell>{it.name}</TableCell>
                            <TableCell>{it.quantity}</TableCell>
                            <TableCell>
                              {sel ? (
                                <Input
                                  type="number"
                                  min={1}
                                  max={it.quantity}
                                  value={sel.quantity}
                                  onChange={(e) => updateQty(it.id, Number(e.target.value), it.quantity)}
                                  className="w-24"
                                />
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant={sel ? "secondary" : "outline"}
                                size="sm"
                                onClick={() => toggleItem(it.id, it.quantity)}
                              >
                                {sel ? "Remove" : "Add"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-sm font-medium mb-1">Weight (oz)</div>
                  <Input type="number" value={form.weightOz} onChange={(e) => setForm({ ...form, weightOz: Number(e.target.value) })} />
                </div>
                <div>
                  <div className="text-sm font-medium mb-1">Carrier (optional)</div>
                  <Input value={form.carrier} onChange={(e) => setForm({ ...form, carrier: e.target.value })} placeholder="e.g., USPS" />
                </div>
                <div>
                  <div className="text-sm font-medium mb-1">Length</div>
                  <Input value={form.length} onChange={(e) => setForm({ ...form, length: e.target.value })} />
                </div>
                <div>
                  <div className="text-sm font-medium mb-1">Service (optional)</div>
                  <Input value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })} placeholder="e.g., Priority" />
                </div>
                <div>
                  <div className="text-sm font-medium mb-1">Width</div>
                  <Input value={form.width} onChange={(e) => setForm({ ...form, width: e.target.value })} />
                </div>
                <div>
                  <div className="text-sm font-medium mb-1">Height</div>
                  <Input value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={submit} disabled={form.items.length === 0}>Purchase label</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Provider: {process.env.NEXT_PUBLIC_SHIPPING_PROVIDER || process.env.SHIPPING_PROVIDER || "mock"}
        </div>
        {isLoading && <div>Loading...</div>}
        {!isLoading && (!shipments || shipments.length === 0) && (
          <div className="text-sm text-muted-foreground">No shipments yet.</div>
        )}
        {!isLoading && shipments && shipments.length > 0 && (
          <div className="space-y-4">
            {shipments.map((s: any) => (
              <div key={s.id} className="rounded-md border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <div className="font-medium">Status: <span className="capitalize">{(s.status || "CREATED").toLowerCase().replaceAll("_", " ")}</span></div>
                    <div className="text-muted-foreground">Carrier: {s.carrier || "-"} • Service: {s.service || "-"}</div>
                    <div className="text-muted-foreground">Tracking: {s.trackingNumber || "-"} {s.trackingUrl && (<a className="underline ml-2" href={s.trackingUrl} target="_blank" rel="noopener noreferrer">Track</a>)}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => printLabel(s.labelUrl)} disabled={!s.labelUrl}>Print label</Button>
                    <Button variant="outline" size="sm" onClick={() => schedulePickup(s.id)}>Schedule pickup</Button>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-2">Items</div>
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Qty</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {s.items.map((it: any) => (
                          <TableRow key={it.id}>
                            <TableCell>{it.orderItem.name}</TableCell>
                            <TableCell>{it.quantity}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-2">Timeline</div>
                  <div className="rounded-md border p-3 space-y-2 max-h-64 overflow-auto">
                    {s.events.length === 0 && <div className="text-sm text-muted-foreground">No events yet.</div>}
                    {s.events.map((ev: any) => (
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}