import * as React from "react"

export default function RefundProcessedEmail(props: {
  orderNumber: string
  amount: number
  currency: string
}) {
  const { orderNumber, amount, currency } = props
  return (
    <div style={{ fontFamily: "Inter, Arial, sans-serif", color: "#111", padding: "24px" }}>
      <h1 style={{ fontSize: "20px", margin: "0 0 8px" }}>Refund Processed</h1>
      <p style={{ margin: "0 0 16px" }}>
        Your refund for order <strong>{orderNumber}</strong> has been processed.
      </p>
      <p style={{ fontWeight: 600 }}>
        Amount: ${(amount / 100).toFixed(2)} {currency.toUpperCase()}
      </p>
      <p style={{ color: "#666", fontSize: "12px", marginTop: "16px" }}>
        It can take 5–10 business days to appear on your statement.
      </p>
    </div>
  )
}