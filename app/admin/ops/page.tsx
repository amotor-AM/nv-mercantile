"use client"

import useSWR from "swr"
import { Separator } from "@/components/ui/separator"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from "recharts"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function OpsDashboard() {
  const { data } = useSWR("/api/admin/metrics", fetcher)

  const ordersPerHour = data?.ordersPerHour ?? []
  const stripeSeries = data?.series?.webhook_error_stripe ?? []
  const carrierSeries = data?.series?.webhook_error_carrier ?? []

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Operational Metrics</h1>
      <Separator />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded p-4">
          <h2 className="font-medium mb-2">Orders per hour (last 24h)</h2>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={ordersPerHour}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="bucket" hide />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="border rounded p-4">
          <h2 className="font-medium mb-2">Conversion & Payment Success</h2>
          <div className="text-sm">
            <div>Conversion rate (24h): <span className="font-medium">{((data?.conversionRate ?? 0) * 100).toFixed(1)}%</span></div>
            <div>Stripe success: <span className="font-medium">{((data?.paymentSuccessRatio?.stripe ?? 0) * 100).toFixed(1)}%</span></div>
            <div>PayPal success: <span className="font-medium">{((data?.paymentSuccessRatio?.paypal ?? 0) * 100).toFixed(1)}%</span></div>
          </div>
        </div>

        <div className="border rounded p-4">
          <h2 className="font-medium mb-2">Webhook errors (Stripe last 24h)</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stripeSeries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="bucket" hide />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="border rounded p-4">
          <h2 className="font-medium mb-2">Webhook errors (Carrier last 24h)</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={carrierSeries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="bucket" hide />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="border rounded p-4">
          <h3 className="font-medium">Shipment exceptions (24h)</h3>
          <div className="text-3xl font-bold mt-2">{data?.shipmentExceptions ?? 0}</div>
        </div>
        <div className="border rounded p-4">
          <h3 className="font-medium">Low stock products</h3>
          <div className="text-3xl font-bold mt-2">{data?.lowStockCount ?? 0}</div>
        </div>
        <div className="border rounded p-4">
          <h3 className="font-medium">Webhook errors (total 24h)</h3>
          <div className="text-3xl font-bold mt-2">
            {(data?.webhook?.stripe?.error ?? 0) + (data?.webhook?.carrier?.error ?? 0)}
          </div>
        </div>
      </div>
    </div>
  )
}