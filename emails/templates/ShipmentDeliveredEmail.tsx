import * as React from "react"

export default function ShipmentDeliveredEmail(props: {
  orderNumber: string
  trackingUrl?: string
  trackingNumber?: string
}) {
  const { orderNumber, trackingUrl, trackingNumber } = props
  return (
    <div style={{ fontFamily: "Inter, Arial, sans-serif", color: "#111", padding: "24px" }}>
      <h1 style={{ fontSize: "20px", margin: "0 0 8px" }}>Delivered</h1>
      <p style={{ margin: "0 0 16px" }}>Your Order <strong>{orderNumber}</strong> has been delivered.</p>
      {trackingNumber && <p style={{ margin: "0 0 8px" }}>Tracking: {trackingNumber}</p>}
      {trackingUrl && (
        <p>
          <a href={trackingUrl} style={{ color: "#111" }}>View tracking</a>
        </p>
      )}
      <p style={{ color: "#666", fontSize: "12px", marginTop: "16px" }}>
        If something isn’t right, reply to this email and we’ll help.
      </p>
    </div>
  )
}