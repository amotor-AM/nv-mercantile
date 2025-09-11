"use client"

import useSWR from "swr"
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, BarChart, Bar } from "recharts"
import { Separator } from "@/components/ui/separator"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function AnalyticsPage() {
  const { data } = useSWR("/api/admin/analytics", fetcher)

  const sales = data?.salesSeries ?? []
  const top = data?.topProducts ?? []
  const cohorts = data?.cohorts ?? []

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Analytics</h1>
      <Separator />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border rounded p-4">
          <h2 className="font-medium mb-2">Sales (last 90 days)</h2>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={sales}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="border rounded p-4">
          <h2 className="font-medium mb-2">Top Products</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={top}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" hide />
              <YAxis />
              <Tooltip />
              <Bar dataKey="revenue" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
          <div className="text-xs text-muted-foreground mt-2">Showing top {top.length} by revenue</div>
        </div>
      </div>

      <div className="border rounded p-4">
        <h2 className="font-medium mb-2">Cohort Retention (monthly)</h2>
        <div className="overflow-x-auto">
          <table className="text-sm min-w-[600px]">
            <thead>
              <tr>
                <th className="text-left p-2">Cohort</th>
                {Array.from({ length: 6 }).map((_, i) => (
                  <th key={i} className="text-left p-2">M+{i}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cohorts.map((row: any) => (
                <tr key={row.cohort}>
                  <td className="p-2">{row.cohort}</td>
                  {row.values.map((v: number, i: number) => (
                    <td key={i} className="p-2">{(v * 100).toFixed(0)}%</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}