"use client"

import useSWR from "swr"
import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { csrfHeader } from "@/lib/csrf"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type Category = {
  id: string
  slug: string
  name: string
  description?: string | null
  isVisible: boolean
  order: number
  parentId?: string | null
}

export default function CategoriesAdmin() {
  const { data, mutate } = useSWR<Category[]>("/api/admin/categories", fetcher)
  const [items, setItems] = useState<Category[]>([])
  const [form, setForm] = useState<any>({ slug: "", name: "", description: "" })

  useEffect(() => {
    if (data) setItems(data)
  }, [data])

  const onDragStart = (e: React.DragEvent<HTMLTableRowElement>, index: number) => {
    e.dataTransfer.setData("text/plain", String(index))
  }

  const onDrop = async (e: React.DragEvent<HTMLTableRowElement>, index: number) => {
    const fromIndex = Number(e.dataTransfer.getData("text/plain"))
    if (isNaN(fromIndex)) return
    const updated = [...(items || [])]
    const [moved] = updated.splice(fromIndex, 1)
    updated.splice(index, 0, moved)
    // reindex orders locally
    const withOrder = updated.map((it, i) => ({ ...it, order: i }))
    setItems(withOrder)
  }

  const saveOrder = async () => {
    const payload = items.map((it, i) => ({ id: it.id, order: i }))
    await fetch("/api/admin/categories/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...csrfHeader() },
      body: JSON.stringify({ items: payload }),
    })
    mutate()
  }

  const create = async () => {
    await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...csrfHeader() },
      body: JSON.stringify(form),
    })
    setForm({ slug: "", name: "", description: "" })
    mutate()
  }

  const toggleVisible = async (id: string, isVisible: boolean) => {
    await fetch(`/api/admin/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...csrfHeader() },
      body: JSON.stringify({ isVisible }),
    })
    mutate()
  }

  const remove = async (id: string) => {
    await fetch(`/api/admin/categories/${id}`, { method: "DELETE", headers: { ...csrfHeader() } })
    mutate()
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Categories</h1>
        <p className="text-sm text-muted-foreground">Add, remove, reorder, and control visibility of categories</p>
      </div>
      <Separator />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <Input placeholder="Slug" value={form.slug} onChange={(e) => setForm((f:any) => ({ ...f, slug: e.target.value }))} />
        <Input placeholder="Name" value={form.name} onChange={(e) => setForm((f:any) => ({ ...f, name: e.target.value }))} />
        <Input placeholder="Description" value={form.description ?? ""} onChange={(e) => setForm((f:any) => ({ ...f, description: e.target.value }))} />
        <Button onClick={create}>Add Category</Button>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={saveOrder}>Save Order</Button>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Slug</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Visible</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items?.map((c, idx) => (
              <TableRow
                key={c.id}
                draggable
                onDragStart={(e) => onDragStart(e, idx)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => onDrop(e, idx)}
                className="cursor-move"
              >
                <TableCell className="font-mono text-xs">{c.slug}</TableCell>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{c.description ?? ""}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Switch id={`vis-${c.id}`} checked={c.isVisible} onCheckedChange={(v) => toggleVisible(c.id, !!v)} />
                    <Label htmlFor={`vis-${c.id}`}>{c.isVisible ? "Visible" : "Hidden"}</Label>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => remove(c.id)}>Delete</Button>
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