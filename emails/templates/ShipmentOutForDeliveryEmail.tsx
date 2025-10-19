import * as React from "react"

export default function ShipmentOutForDeliveryEmail(props: {
  orderNumber: string
  trackingUrl?: string
  trackingNumber?: string
}) {
  const { orderNumber, trackingUrl, trackingNumber } = props
  return (
    <div style={{ fontFamily: "Inter, Arial, sans-serif", color: "#111", padding: "24px" }}>
      <h1 style={{ fontSize: "20px", margin: "0 0 8px" }}>Out for delivery</h1>
      <p style={{ margin: "0 0 16px" }}>Good news — your Order <strong>{orderNumber}</strong> is out for delivery.</p>
      {trackingNumber && <p style={{ margin: "0 0 8px" }}>Tracking: {trackingNumber}</p>}
      {trackingUrl && (
        <p>
          <a href={trackingUrl} style={{ color: "#111" }}>Track your shipment</a>
        </p>
      )}
      <p style={{ color: "#666", fontSize: "12px", marginTop: "16px" }}>
        Thank you for choosing NV Mercantile.
      </p>
    </div>
  )
}