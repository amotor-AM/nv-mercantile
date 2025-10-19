"use client"

import useSWR from "swr"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { csrfHeader } from "@/lib/csrf"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type NavItem = {
  id: string
  location: "HEADER" | "FOOTER"
  key: string
  label: string
  url: string
  icon?: string | null
  order: number
  isVisible: boolean
}

export default function NavigationAdmin() {
  const { data, mutate } = useSWR<NavItem[]>("/api/admin/navigation", fetcher)
  const [headerItems, setHeaderItems] = useState<NavItem[]>([])
  const [footerItems, setFooterItems] = useState<NavItem[]>([])
  const [form, setForm] = useState<any>({ location: "HEADER", key: "", label: "", url: "", icon: "" })

  useEffect(() => {
    if (data) {
      setHeaderItems(data.filter((i) => i.location === "HEADER").sort((a, b) => a.order - b.order))
      setFooterItems(data.filter((i) => i.location === "FOOTER").sort((a, b) => a.order - b.order))
    }
  }, [data])

  const onDragStart = (e: React.DragEvent<HTMLTableRowElement>, index: number, location: "HEADER" | "FOOTER") => {
    e.dataTransfer.setData("text/plain", JSON.stringify({ index, location }))
  }

  const onDrop = (e: React.DragEvent<HTMLTableRowElement>, index: number, location: "HEADER" | "FOOTER") => {
    const dataStr = e.dataTransfer.getData("text/plain")
    if (!dataStr) return
    const { index: fromIndex, location: fromLoc } = JSON.parse(dataStr)
    if (fromLoc !== location) return
    const list = location === "HEADER" ? [...headerItems] : [...footerItems]
    const [moved] = list.splice(fromIndex, 1)
    list.splice(index, 0, moved)
    const withOrder = list.map((it, i) => ({ ...it, order: i }))
    if (location === "HEADER") setHeaderItems(withOrder)
    else setFooterItems(withOrder)
  }

  const saveOrder = async (location: "HEADER" | "FOOTER") => {
    const items = (location === "HEADER" ? headerItems : footerItems).map((it, i) => ({ id: it.id, order: i }))
    await fetch("/api/admin/navigation/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...csrfHeader() },
      body: JSON.stringify({ items }),
    })
    mutate()
  }

  const create = async () => {
    await fetch("/api/admin/navigation", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...csrfHeader() },
      body: JSON.stringify(form),
    })
    setForm({ location: "HEADER", key: "", label: "", url: "", icon: "" })
    mutate()
  }

  const toggleVisible = async (id: string, isVisible: boolean) => {
    await fetch(`/api/admin/navigation/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...csrfHeader() },
      body: JSON.stringify({ isVisible }),
    })
    mutate()
  }

  const remove = async (id: string) => {
    await fetch(`/api/admin/navigation/${id}`, { method: "DELETE", headers: { ...csrfHeader() } })
    mutate()
  }

  const renderTable = (items: NavItem[], location: "HEADER" | "FOOTER") => (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Key</TableHead>
            <TableHead>Label</TableHead>
            <TableHead>URL</TableHead>
            <TableHead>Icon</TableHead>
            <TableHead>Visible</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((it, idx) => (
            <TableRow
              key={it.id}
              draggable
              onDragStart={(e) => onDragStart(e, idx, location)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => onDrop(e, idx, location)}
              className="cursor-move"
            >
              <TableCell className="font-mono text-xs">{it.key}</TableCell>
              <TableCell className="font-medium">{it.label}</TableCell>
              <TableCell className="text-sm">{it.url}</TableCell>
              <TableCell className="text-sm">{it.icon ?? ""}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Switch id={`vis-${it.id}`} checked={it.isVisible} onCheckedChange={(v) => toggleVisible(it.id, !!v)} />
                  <Label htmlFor={`vis-${it.id}`}>{it.isVisible ? "Visible" : "Hidden"}</Label>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => remove(it.id)}>Delete</Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="p-2">
        <Button variant="outline" onClick={() => saveOrder(location)}>Save {location.toLowerCase()} order</Button>
      </div>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Navigation</h1>
        <p className="text-sm text-muted-foreground">Manage header and footer menus</p>
      </div>
      <Separator />

      <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
        <Select value={form.location} onValueChange={(v) => setForm((f:any) => ({ ...f, location: v }))}>
          <SelectTrigger><SelectValue placeholder="Location" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="HEADER">Header</SelectItem>
            <SelectItem value="FOOTER">Footer</SelectItem>
          </SelectContent>
        </Select>
        <Input placeholder="Key" value={form.key} onChange={(e) => setForm((f:any) => ({ ...f, key: e.target.value }))} />
        <Input placeholder="Label" value={form.label} onChange={(e) => setForm((f:any) => ({ ...f, label: e.target.value }))} />
        <Input placeholder="URL" value={form.url} onChange={(e) => setForm((f:any) => ({ ...f, url: e.target.value }))} />
        <Input placeholder="Icon (optional)" value={form.icon} onChange={(e) => setForm((f:any) => ({ ...f, icon: e.target.value }))} />
        <Button onClick={create}>Add Item</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold mb-2">Header</h2>
          {renderTable(headerItems, "HEADER")}
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-2">Footer</h2>
          {renderTable(footerItems, "FOOTER")}
        </div>
      </div>
    </div>
  )
}