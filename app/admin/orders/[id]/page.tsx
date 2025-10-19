"use client"

import useSWR from "swr"
import { useMemo, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { csrfHeader } from "@/lib/csrf"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function AdminOrderDetails() {
  const params = useParams() as { id: string }
  const { data: order, mutate, isLoading } = useSWR(params?.id ? `/api/orders/${params.id}` : null, fetcher)
  const [partialAmount, setPartialAmount] = useState<string>("")
  const [partialReason, setPartialReason] = useState<string>("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [confirmPartialOpen, setConfirmPartialOpen] = useState(false)
  const [confirmFullOpen, setConfirmFullOpen] = useState(false)

  const total = useMemo(() => (order ? order.total : 0), [order])
  const items = order?.items || []

  const performPartialRefund = async () => {
    setBusy(true); setError(null); setSuccess(null)
    const dollars = Number(partialAmount)
    if (!isFinite(dollars) || dollars <= 0) {
      setError("Enter a valid amount in dollars")
      setBusy(false)
      return
    }
    const cents = Math.round(dollars * 100)
    try {
      const res = await fetch(`/api/orders/${params.id}/refunds`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...csrfHeader() },
        body: JSON.stringify({ amount: cents, reason: partialReason }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        setError(j?.error || `Refund failed (${res.status})`)
      } else {
        setSuccess("Partial refund created")
        setPartialAmount("")
        setPartialReason("")
        await mutate()
      }
    } catch (e: any) {
      setError(e?.message || "Refund error")
    } finally {
      setBusy(false)
      setConfirmPartialOpen(false)
    }
  }

  const performFullRefund = async () => {
    setBusy(true); setError(null); setSuccess(null)
    try {
      const res = await fetch(`/api/orders/${params.id}/refund`, {
        method: "POST",
        headers: { ...csrfHeader() },
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        setError(j?.error || `Refund failed (${res.status})`)
      } else {
        setSuccess("Full refund issued")
        await mutate()
      }
    } catch (e: any) {
      setError(e?.message || "Refund error")
    } finally {
      setBusy(false)
      setConfirmFullOpen(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Order {order?.orderNumber || params.id}</h1>
          <p className="text-sm text-muted-foreground">Manage refunds, shipments, and tracking</p>
        </div>
        <Link href={`/admin/orders/${params.id}/shipments`}>
          <Button variant="outline">Manage shipments</Button>
        </Link>
      </div>

      {isLoading && <div>Loading...</div>}
      {!isLoading && order && (
        <>
          <div className="rounded-md border p-4 space-y-2">
            <div className="flex gap-2 items-center">
              <span className="text-sm">Status:</span>
              <span className="text-sm font-medium">{order.status}</span>
            </div>
            <div className="flex gap-2 items-center">
              <span className="text-sm">Refund status:</span>
              <span className="text-sm font-medium">{order.refundStatus}</span>
            </div>
            <div className="flex gap-2 items-center">
              <span className="text-sm">Payment provider:</span>
              <span className="text-sm font-medium">{order.paymentProvider ?? "-"}</span>
            </div>
            <div className="flex gap-2 items-center">
              <span className="text-sm">Total:</span>
              <span className="text-sm font-medium">${(total / 100).toFixed(2)}</span>
            </div>
            <div className="flex gap-4 mt-2">
              <a className="text-xs underline" href={`/api/orders/${order.id}/invoice.pdf`} target="_blank" rel="noopener noreferrer">Invoice PDF</a>
              <a className="text-xs underline" href={`/api/orders/${order.id}/packing-slip.pdf`} target="_blank" rel="noopener noreferrer">Packing Slip</a>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Items</h2>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((it: any) => (
                    <TableRow key={it.id}>
                      <TableCell>{it.name}</TableCell>
                      <TableCell>${(it.price / 100).toFixed(2)}</TableCell>
                      <TableCell>{it.quantity}</TableCell>
                      <TableCell>${((it.price * it.quantity) / 100).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Refunds</h2>
            {error && <div className="text-sm text-red-600">{error}</div>}
            {success && <div className="text-sm text-green-600">{success}</div>}
            <div className="flex flex-col gap-2 max-w-md">
              <label className="text-sm">Partial refund amount (USD)</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={partialAmount}
                onChange={(e) => setPartialAmount(e.target.value)}
                placeholder="e.g. 25.00"
              />
              <Input
                value={partialReason}
                onChange={(e) => setPartialReason(e.target.value)}
                placeholder="Reason (optional)"
              />
              <div className="flex gap-2">
                <Button variant="outline" disabled={busy} onClick={() => setConfirmPartialOpen(true)}>Issue partial refund</Button>
                <Button disabled={busy} onClick={() => setConfirmFullOpen(true)}>Issue full refund</Button>
              </div>
            </div>
          </div>

          <AlertDialog open={confirmPartialOpen} onOpenChange={setConfirmPartialOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm partial refund</AlertDialogTitle>
                <AlertDialogDescription>
                  This will issue a refund of ${Number(partialAmount || 0).toFixed(2)} to the customer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
                <AlertDialogAction disabled={busy} onClick={performPartialRefund}>Confirm</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog open={confirmFullOpen} onOpenChange={setConfirmFullOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm full refund</AlertDialogTitle>
                <AlertDialogDescription>
                  This will refund the full amount of ${(total / 100).toFixed(2)} and mark the order as REFUNDED.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
                <AlertDialogAction disabled={busy} onClick={performFullRefund}>Confirm</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  )
}