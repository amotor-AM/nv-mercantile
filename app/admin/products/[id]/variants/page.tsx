"use client"

import useSWR from "swr"
import { useParams } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { csrfHeader } from "@/lib/csrf"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function ProductVariantsPage() {
  const params = useParams<{ id: string }>()
  const productId = params.id
  const { data: variants, mutate } = useSWR(`/api/admin/products/${productId}/variants`, fetcher)
  const [sku, setSku] = useState("")
  const [price, setPrice] = useState<number>(0)
  const [attributes, setAttributes] = useState("")

  const create = async () => {
    let attrs: any = {}
    try { attrs = attributes ? JSON.parse(attributes) : {} } catch {}
    await fetch(`/api/admin/products/${productId}/variants`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...csrfHeader() },
      body: JSON.stringify({ sku, price: Number(price), attributes: attrs }),
    })
    setSku("")
    setPrice(0)
    setAttributes("")
    mutate()
  }

  const remove = async (id: string) => {
    await fetch(`/api/admin/variants/${id}`, { method: "DELETE", headers: { ...csrfHeader() } })
    mutate()
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Product Variants</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <Input placeholder="SKU" value={sku} onChange={(e) => setSku(e.target.value)} />
        <Input placeholder="Price" type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
        <Textarea placeholder='Attributes JSON e.g. {"size":"M","color":"Black"}' value={attributes} onChange={(e) => setAttributes(e.target.value)} />
        <Button onClick={create}>Add Variant</Button>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Attributes</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(variants ?? []).map((v: any) => (
              <TableRow key={v.id}>
                <TableCell>{v.sku}</TableCell>
                <TableCell>${v.price}</TableCell>
                <TableCell className="text-xs">{JSON.stringify(v.attributes)}</TableCell>
                <TableCell>{v.stockLevel}</TableCell>
                <TableCell><Button variant="outline" size="sm" onClick={() => remove(v.id)}>Delete</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}