"use client"

import useSWR from "swr"
import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { csrfHeader } from "@/lib/csrf"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function ReturnsPage() {
  const { data: orders } = useSWR("/api/orders", fetcher)
  const rmaList = useMemo(() => {
    const list: any[] = []
    ;(orders ?? []).forEach((o: any) => {
      ;(o.rmas ?? []).forEach((r: any) => list.push({ order: o, rma: r }))
    })
    return list
  }, [orders])

  const [status, setStatus] = useState<string>("all")
  const filtered = useMemo(() => {
    if (status === "all") return rmaList
    return rmaList.filter((x) => x.rma.status === status)
  }, [rmaList, status])

  const update = async (orderId: string, rmaId: string, status: string) => {
    await fetch(`/api/orders/${orderId}/rma/${rmaId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...csrfHeader() },
      body: JSON.stringify({ status }),
    })
    window.location.reload()
  }

  const receiveAll = async (orderId: string, rma: any) => {
    const received = rma.items.map((it: any) => ({ returnItemId: it.id, qty: it.requestedQty }))
    await fetch(`/api/orders/${orderId}/rma/${rma.id}/receive`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...csrfHeader() },
      body: JSON.stringify({ received }),
    })
    window.location.reload()
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-3">
      <h1 className="text-2xl font-semibold">Returns (RMA)</h1>
      <Separator />
      <div className="flex gap-2 items-center">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Status filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="REQUESTED">Requested</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
            <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
            <SelectItem value="RECEIVED">Received</SelectItem>
            <SelectItem value="REFUNDED">Refunded</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>RMA</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(({ order, rma }: any) => (
              <TableRow key={rma.id}>
                <TableCell>{rma.id.slice(0, 8)}</TableCell>
                <TableCell>{order.orderNumber}</TableCell>
                <TableCell>{order.email}</TableCell>
                <TableCell>{rma.status}</TableCell>
                <TableCell>
                  <div className="text-xs">
                    {rma.items.map((it: any) => (
                      <div key={it.id}>
                        {it.orderItem.name} x{it.requestedQty}
                      </div>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => update(order.id, rma.id, "APPROVED")}>Approve</Button>
                    <Button variant="outline" size="sm" onClick={() => update(order.id, rma.id, "REJECTED")}>Reject</Button>
                    <Button variant="outline" size="sm" onClick={() => receiveAll(order.id, rma)}>Mark Received & Refund</Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}