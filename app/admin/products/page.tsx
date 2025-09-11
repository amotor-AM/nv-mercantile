"use client"

import useSWR from "swr"
import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function ProductsAdmin() {
  const { data, mutate } = useSWR("/api/admin/products", fetcher)
  const items = data ?? []
  const [form, setForm] = useState<any>({ slug: "", name: "", price: 0 })
  const fileRef = useRef<HTMLInputElement>(null)

  const create = async () => {
    await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, price: Number(form.price) }),
    })
    setForm({ slug: "", name: "", price: 0 })
    mutate()
  }

  const remove = async (id: string) => {
    await fetch(`/api/admin/products/${id}`, { method: "DELETE" })
    mutate()
  }

  const importCsv = async () => {
    const file = fileRef.current?.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.set("file", file)
    await fetch("/api/admin/import/products", { method: "POST", body: fd })
    if (fileRef.current) fileRef.current.value = ""
    mutate()
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Products</h1>
      <Separator />
      <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
        <Input placeholder="Slug" value={form.slug} onChange={(e) => setForm((f:any) => ({ ...f, slug: e.target.value }))} />
        <Input placeholder="Name" value={form.name} onChange={(e) => setForm((f:any) => ({ ...f, name: e.target.value }))} />
        <Input placeholder="Price" type="number" value={form.price} onChange={(e) => setForm((f:any) => ({ ...f, price: e.target.value }))} />
        <Input placeholder="Material" value={form.material ?? ""} onChange={(e) => setForm((f:any) => ({ ...f, material: e.target.value }))} />
        <Input placeholder="Category" value={form.category ?? ""} onChange={(e) => setForm((f:any) => ({ ...f, category: e.target.value }))} />
        <Button onClick={create}>Add Product</Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input ref={fileRef} type="file" accept=".csv,text/csv" />
        <Button variant="outline" onClick={importCsv}>Import CSV</Button>
        <a href="/api/admin/export/products.csv" target="_blank" rel="noopener noreferrer">
          <Button variant="outline">Export CSV</Button>
        </a>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((p: any) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell>${p.price}</TableCell>
                <TableCell>{p.stockLevel}</TableCell>
                <TableCell>{p.category}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <a href={`/admin/products/${p.id}/images`}>
                      <Button variant="outline" size="sm">Images</Button>
                    </a>
                    <a href={`/admin/products/${p.id}/variants`}>
                      <Button variant="outline" size="sm">Variants</Button>
                    </a>
                    <Button variant="outline" size="sm" onClick={() => remove(p.id)}>Delete</Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}