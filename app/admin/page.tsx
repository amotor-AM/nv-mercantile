"use client"

import useSWR from "swr"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function AdminDashboard() {
  const { data: orders, mutate, isLoading } = useSWR("/api/orders", fetcher)
  const [updating, setUpdating] = useState<string | null>(null)

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id)
    await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    await mutate()
    setUpdating(null)
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
      <p className="text-sm text-muted-foreground">Manage orders, refunds and fulfillment</p>
      <Separator className="my-4" />

      {isLoading && <div>Loading...</div>}
      {!isLoading && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders?.map((o: any) => (
                <TableRow key={o.id}>
                  <TableCell>{o.orderNumber}</TableCell>
                  <TableCell>
                    <div className="text-sm">{o.email}</div>
                    <div className="text-xs text-muted-foreground">{o.paymentProvider ?? "-"}</div>
                  </TableCell>
                  <TableCell className="capitalize">{o.status.toLowerCase()}</TableCell>
                  <TableCell>${(o.total / 100).toFixed(2)}</TableCell>
                  <TableCell>{new Date(o.updatedAt).toLocaleString()}</TableCell>
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