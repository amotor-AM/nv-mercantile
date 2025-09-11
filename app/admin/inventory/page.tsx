"use client"

import useSWR from "swr"
import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function InventoryDashboard() {
  const [query, setQuery] = useState("")
  const { data, mutate } = useSWR(`/api/inventory${query ? `?q=${encodeURIComponent(query)}` : ""}`, fetcher)
  const items = data?.items ?? []

  const [selected, setSelected] = useState<any | null>(null)
  const { data: forecast } = useSWR(selected ? `/api/inventory/forecast?productId=${selected.id}` : null, fetcher)

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-semibold">Inventory</h1>
      <p className="text-sm text-muted-foreground">Manage stock levels, see demand forecasts, and plan restocks.</p>
      <Separator className="my-4" />

      <div className="flex flex-col sm:flex-row gap-3 justify-between mb-4">
        <Input placeholder="Search products, materials, categories..." value={query} onChange={(e) => setQuery(e.target.value)} className="max-w-md" />
        <div className="text-sm text-muted-foreground">
          {items.length} products
        </div>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Safety</TableHead>
              <TableHead>Reorder Pt</TableHead>
              <TableHead>Lead time</TableHead>
              <TableHead>Avg daily</TableHead>
              <TableHead>Forecast</TableHead>
              <TableHead>Recommended</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((p: any) => (
              <TableRow key={p.id} onClick={() => setSelected(p)} className="cursor-pointer hover:bg-muted/50">
                <TableCell>
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{p.category} • {p.material}</div>
                </TableCell>
                <TableCell>{p.stockLevel}</TableCell>
                <TableCell>{p.safetyStock}</TableCell>
                <TableCell>{p.reorderPoint}</TableCell>
                <TableCell>{p.leadTimeDays}d</TableCell>
                <TableCell>{p.avgDaily.toFixed(2)}</TableCell>
                <TableCell>{p.forecastLead}</TableCell>
                <TableCell className={p.recommendedReorder > 0 ? "text-amber-600 font-medium" : ""}>
                  {p.recommendedReorder}
                </TableCell>
                <TableCell>
                  <AdjustDialog product={p} onDone={mutate} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selected && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-2">{selected.name} demand (last 90 days)</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecast?.points?.map((d: any) => ({ date: new Date(d.date).toLocaleDateString(), qty: d.qty })) ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="qty" stroke="#111" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}

function AdjustDialog({ product, onDone }: { product: any; onDone: () => void }) {
  const [open, setOpen] = useState(false)
  const [quantity, setQuantity] = useState<number>(0)
  const [type, setType] = useState<"RESTOCK" | "ADJUSTMENT">("RESTOCK")
  const [note, setNote] = useState("")

  const submit = async () => {
    await fetch(`/api/inventory/${product.id}/adjust`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: Number(quantity), type, note }),
    })
    setOpen(false)
    onDone()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          Adjust
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust stock for {product.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Select value={type} onValueChange={(v: any) => setType(v)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="RESTOCK">Restock</SelectItem>
              <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
            </SelectContent>
          </Select>
          <Input type="number" placeholder="Quantity" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
          <Input placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}