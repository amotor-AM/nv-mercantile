"use client"

import useSWR from "swr"
import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import Link from "next/link"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function AdminDashboard() {
  const { data: ordersRaw, mutate, isLoading } = useSWR("/api/orders", fetcher)
  const [updating, setUpdating] = useState<string | null>(null)
  const [q, setQ] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const orders = useMemo(() => {
    let list = ordersRaw || []
    if (statusFilter !== "all") {
      list = list.filter((o: any) => o.status === statusFilter)
    }
    if (q.trim()) {
      const needle = q.toLowerCase()
      list = list.filter((o: any) =>
        o.orderNumber.toLowerCase().includes(needle) ||
        o.email.toLowerCase().includes(needle)
      )
    }
    return list
  }, [ordersRaw, q, statusFilter])

  const updateStatus = async (id: string, status: string, extra?: any) => {
    setUpdating(id)
    await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, ...extra }),
    })
    await mutate()
    setUpdating(null)
  }

  const exportCsv = (type: "orders" | "products") => {
    window.location.href = `/api/admin/export/${type}.csv`
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">Manage orders, refunds, fulfillment, inventory, and products</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Input placeholder="Search orders or emails..." value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="AWAITING_PAYMENT">Awaiting Payment</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
            <SelectItem value="FULFILLED">Fulfilled</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
            <SelectItem value="REFUNDED">Refunded</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => exportCsv("orders")}>Export Orders CSV</Button>
        <Button variant="outline" onClick={() => exportCsv("products")}>Export Products CSV</Button>
        <Link href="/admin/inventory"><Button variant="outline">Inventory</Button></Link>
        <Link href="/admin/products"><Button variant="outline">Products</Button></Link>
      </div>
      <Separator className="my-2" />

      {isLoading && <div>Loading...</div>}
      {!isLoading && (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead>Fulfillment</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders?.map((o: any) => (
                <TableRow key={o.id}>
                  <TableCell>
                    <div className="font-medium">{o.orderNumber}</div>
                    <div>
                      <a className="text-xs underline" href={`/api/orders/${o.id}/invoice.pdf`} target="_blank" rel="noopener noreferrer">Invoice PDF</a>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{o.email}</div>
                    <div className="text-xs text-muted-foreground">{o.paymentProvider ?? "-"}</div>
                  </TableCell>
                  <TableCell className="capitalize">{o.status.toLowerCase()}</TableCell>
                  <TableCell>${(o.total / 100).toFixed(2)}</TableCell>
                  <TableCell>{new Date(o.updatedAt).toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Input
                        placeholder="Carrier"
                        defaultValue={o.trackingCarrier ?? ""}
                        onBlur={(e) => updateStatus(o.id, o.status, { trackingCarrier: e.target.value })}
                      />
                      <Input
                        placeholder="Tracking number"
                        defaultValue={o.trackingNumber ?? ""}
                        onBlur={(e) => updateStatus(o.id, o.status, { trackingNumber: e.target.value })}
                      />
                      <Input
                        placeholder="Tracking URL"
                        defaultValue={o.trackingUrl ?? ""}
                        onBlur={(e) => updateStatus(o.id, o.status, { trackingUrl: e.target.value })}
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={updating === o.id}
                          onClick={() => updateStatus(o.id, "FULFILLED", { shippedAt: new Date().toISOString() })}
                        >
                          Mark shipped
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Select
                        defaultValue={o.status}
                        onValueChange={(v) => updateStatus(o.id, v)}
                        disabled={updating === o.id}
                      >
                        <SelectTrigger className="w-[160px]">
                          <SelectValue placeholder="Update status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PENDING">Pending</SelectItem>
                          <SelectItem value="AWAITING_PAYMENT">Awaiting Payment</SelectItem>
                          <SelectItem value="PAID">Paid</SelectItem>
                          <SelectItem value="FULFILLED">Fulfilled</SelectItem>
                          <SelectItem value="CANCELLED">Cancelled</SelectItem>
                          <SelectItem value="REFUNDED">Refunded</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={updating === o.id}
                        onClick={() => fetch(`/api/orders/${o.id}/refund`, { method: "POST" }).then(() => mutate())}
                      >
                        Refund
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}