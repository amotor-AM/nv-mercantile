"use client"

import useSWR from "swr"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { csrfHeader } from "@/lib/csrf"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function SupportPage() {
  const { data: tickets, mutate } = useSWR("/api/support", fetcher)
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")

  const create = async () => {
    await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...csrfHeader() },
      body: JSON.stringify({ subject, body }),
    })
    setSubject("")
    setBody("")
    mutate()
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Support</h1>
      <div className="grid gap-2">
        <Input placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
        <Textarea placeholder="Describe your issue..." value={body} onChange={(e) => setBody(e.target.value)} />
        <Button onClick={create}>Open Ticket</Button>
      </div>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subject</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(tickets ?? []).map((t: any) => (
              <TableRow key={t.id}>
                <TableCell>{t.subject}</TableCell>
                <TableCell>{t.status}</TableCell>
                <TableCell>{new Date(t.updatedAt).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}