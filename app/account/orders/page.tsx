"use client"

import useSWR from "swr"
import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function OrdersPage() {
  const [email, setEmail] = useState<string>("")
  useEffect(() => {
    // If using Clerk, you can replace this with user.primaryEmailAddress?.emailAddress
    const stored = window.localStorage.getItem("nv-mercantile-email") || ""
    setEmail(stored)
  }, [])

  const { data: orders } = useSWR(email ? `/api/orders?email=${encodeURIComponent(email)}` : null, fetcher)

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-semibold">Your Orders</h1>
      <Separator className="my-4" />
      {!email && <div className="text-sm text-muted-foreground">Sign in or provide your email during checkout to see orders.</div>}
      {orders && orders.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o: any) => (
                <TableRow key={o.id}>
                  <TableCell>{o.orderNumber}</TableCell>
                  <TableCell>{new Date(o.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="capitalize">{o.status.toLowerCase()}</TableCell>
                  <TableCell>${(o.total / 100).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        email && <div className="text-sm text-muted-foreground">No orders found.</div>
      )}
    </div>
  )
}