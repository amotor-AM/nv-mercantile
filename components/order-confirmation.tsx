"use client"

import { Button } from "@/components/ui/button"
import { CheckCircle, Truck, Mail, Download } from "lucide-react"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { track } from "@vercel/analytics"

type Order = {
  id: string
  orderNumber: string
  status: string
  refundStatus: string
  total: number
  currency: string
  createdAt: string
  shippingName: string | null
  shippingAddress: string | null
  trackingUrl?: string | null
  trackingNumber?: string | null
  items: { id: string; name: string; price: number; quantity: number }[]
}

export function OrderConfirmation() {
  const [isVisible, setIsVisible] = useState(false)
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const params = useSearchParams()
  const orderId = params.get("order")
  const provider = params.get("provider")
  const paypalToken = params.get("token")

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const hydrate = async () => {
      try {
        if (provider === "paypal" && paypalToken) {
          // capture the PayPal order then continue
          await fetch(`/api/checkout/paypal/capture?token=${encodeURIComponent(paypalToken)}`)
        }
      } catch {}
      if (!orderId) {
        setLoading(false)
        return
      }
      try {
        const res = await fetch(`/api/orders/${orderId}`)
        if (res.ok) {
          const data = await res.json()
          setOrder(data)
          try {
            track("order_confirmation_view", {
              orderId: data.id,
              status: data.status,
              value: data.total / 100,
              currency: data.currency,
            })
            if (data.status === "PAID") {
              track("purchase", {
                orderId: data.id,
                value: data.total / 100,
                currency: data.currency,
              })
            }
          } catch {}
        }
      } finally {
        setLoading(false)
      }
    }
    hydrate()
  }, [orderId, provider, paypalToken])

  const estimatedDelivery = useMemo(
    () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    []
  )

  return (
    <div className="relative min-h-screen bg-white">
      <div
        className={`max-w-2xl mx-auto px-6 py-20 transition-all duration-1000 ease-out ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Order Confirmed</h1>
          <p className="text-muted-foreground mt-2">
            {order ? (
              <>
                Order <span className="font-semibold">#{order.orderNumber}</span>
              </>
            ) : (
              "Thank you for your purchase."
            )}
          </p>
        </div>

        <div className="bg-muted rounded-lg p-6 mb-10">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Order Date</span>
              <span className="font-medium">
                {order ? new Date(order.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Estimated Delivery</span>
              <span className="font-medium">{estimatedDelivery}</span>
            </div>
            <div className="flex justify-between items-center text-lg">
              <span className="font-semibold">Total</span>
              <span className="font-bold">
                {order ? `${(order.total / 100).toFixed(2)} ${order.currency.toUpperCase()}` : "—"}
              </span>
            </div>
          </div>
        </div>

        <div className="mb-10">
          <h3 className="text-xl font-semibold mb-4">Shipping</h3>
          {order ? (
            <div className="text-sm text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">{order.shippingName || "Recipient"}</p>
              <p>{order.shippingAddress || "Standard shipping"}</p>
            </div>
          ) : (
            <div className="h-16 bg-muted rounded animate-pulse" />
          )}
        </div>

        <div className="mb-10">
          <h3 className="text-xl font-semibold mb-4">Items</h3>
          {order ? (
            <div className="space-y-3">
              {order.items.map((it) => (
                <div key={it.id} className="flex justify-between text-sm">
                  <span className="text-foreground">
                    {it.name} <span className="text-muted-foreground">x{it.quantity}</span>
                  </span>
                  <span className="text-foreground">${(it.price * it.quantity / 100).toFixed(2)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-20 bg-muted rounded animate-pulse" />
          )}
        </div>

        <div className="mb-10">
          <h3 className="text-xl font-semibold mb-4">Order Status</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-3 h-3 bg-primary rounded-full"></div>
              <div>
                <p className="font-medium">Order Received</p>
                <p className="text-sm text-muted-foreground">We&apos;ve received your order</p>
              </div>
            </div>
            <div className="flex items-center gap-4 opacity-70">
              <div className="w-3 h-3 bg-muted-foreground rounded-full"></div>
              <div>
                <p className="font-medium">Processing</p>
                <p className="text-sm text-muted-foreground">We&apos;re preparing your order</p>
              </div>
            </div>
            <div className="flex items-center gap-4 opacity-70">
              <div className="w-3 h-3 bg-muted-foreground rounded-full"></div>
              <div>
                <p className="font-medium">Shipped</p>
                <p className="text-sm text-muted-foreground">You&apos;ll receive tracking details soon</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-12">
          <a
            className="flex-1"
            href={order ? `/api/orders/${order.id}/invoice.pdf` : "#"}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="lg" className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Download Receipt
            </Button>
          </a>
          <a className="flex-1" href={order?.trackingUrl || "#"} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="lg" className="w-full" disabled={!order?.trackingUrl}>
              Track Order
            </Button>
          </a>
        </div>

        <div className="text-center">
          <Link href="/">
            <Button size="lg" className="px-12">
              Continue Shopping
            </Button>
          </Link>
        </div>

        <div className="text-center mt-16 pt-8 border-t">
          <p className="text-muted-foreground mb-4">Need help with your order?</p>
          <div className="flex justify-center gap-6">
            <a href="/account/support" className="underline underline-offset-4 hover:text-foreground transition-colors">Contact Support</a>
            <a href="/custom-orders" className="underline underline-offset-4 hover:text-foreground transition-colors">Return Policy</a>
          </div>
        </div>
      </div>
    </div>
  )
}
