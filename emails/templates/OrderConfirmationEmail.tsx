import * as React from "react"

export default function OrderConfirmationEmail(props: {
  orderNumber: string
  createdAt: Date
  total: number
  currency: string
  items: { name: string; quantity: number; price: number }[]
  shippingName: string
  shippingAddress: string
}) {
  const { orderNumber, createdAt, total, currency, items, shippingName, shippingAddress } = props
  const currencyUpper = (currency || "usd").toUpperCase()
  return (
    <div style={{ fontFamily: "Inter, Arial, sans-serif", color: "#111", padding: "24px" }}>
      <h1 style={{ fontSize: "20px", margin: "0 0 8px" }}>Order Confirmed</h1>
      <p style={{ margin: "0 0 16px" }}>Thanks for your purchase with NV Mercantile.</p>

      <div style={{ marginBottom: "16px" }}>
        <div style={{ color: "#666" }}>Order Number</div>
        <div style={{ fontWeight: 600 }}>{orderNumber}</div>
        <div style={{ color: "#666" }}>Order Date</div>
        <div style={{ fontWeight: 600 }}>{new Date(createdAt).toLocaleString()}</div>
      </div>

      <div style={{ background: "#f6f6f6", padding: "16px", borderRadius: "8px", marginBottom: "16px" }}>
        <div style={{ fontWeight: 600, marginBottom: "8px" }}>Items</div>
        {items.map((it, idx) => (
          <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", padding: "6px 0", borderBottom: "1px solid #eee" }}>
            <div>
              {it.name} <span style={{ color: "#666" }}>x{it.quantity}</span>
            </div>
            <div>${(it.price * it.quantity / 100).toFixed(2)} {currencyUpper}</div>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "12px", fontWeight: 700 }}>
          <div>Total</div>
          <div>${(total / 100).toFixed(2)} {currencyUpper}</div>
        </div>
      </div>

      <div style={{ marginBottom: "16px" }}>
        <div style={{ fontWeight: 600, marginBottom: "6px" }}>Shipping</div>
        <div>{shippingName || "Recipient"}</div>
        <div style={{ color: "#333" }}>{shippingAddress || "Standard shipping"}</div>
      </div>

      <p style={{ color: "#666", fontSize: "12px" }}>
        You will receive tracking information once your order ships. If you have any questions, reply to this email.
      </p>

      <p style={{ color: "#999", fontSize: "11px", marginTop: "24px" }}>
        NV Mercantile • Precision Manufacturing
      </p>
    </div>
  )
}