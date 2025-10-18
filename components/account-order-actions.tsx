"use client"

import { Button } from "@/components/ui/button"
import { useCartStore } from "@/lib/cart-store"
import { useRouter } from "next/navigation"
import { csrfHeader } from "@/lib/csrf"

export function AccountOrderActions({ order }: { order: any }) {
  const router = useRouter()
  const add = useCartStore((s) => s.addItem)

  const reorder = () => {
    for (const it of order.items) {
      const p = it.product
      add({
        id: p.slug,
        name: p.name,
        category: p.category,
        price: it.price / 100,
        image: p.image,
        material: p.material,
        dimensions: p.dimensions,
      })
    }
    router.push("/checkout")
  }

  const requestRefund = async () => {
    await fetch(`/api/orders/${order.id}/request-refund`, { method: "POST", headers: { ...csrfHeader() } })
    router.refresh()
  }

  const canRequestRefund =
    (order.status === "PAID" || order.status === "FULFILLED") && order.refundStatus === "NONE"

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={reorder}>
        Reorder
      </Button>
      <Button variant="outline" size="sm" disabled={!canRequestRefund} onClick={requestRefund}>
        {order.refundStatus === "REQUESTED" ? "Refund Requested" : "Request Refund"}
      </Button>
    </div>
  )
}