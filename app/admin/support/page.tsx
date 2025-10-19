"use client"

import useSWR from "swr"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { csrfHeader } from "@/lib/csrf"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function SupportAdmin() {
  const { data: tickets, mutate } = useSWR("/api/support", fetcher)
  const [activeId, setActiveId] = useState<string | null>(null)
  const { data: messages, mutate: mutateMsgs } = useSWR(activeId ? `/api/support/${activeId}/messages` : null, fetcher)
  const [reply, setReply] = useState("")

  useEffect(() => {
    setReply("")
  }, [activeId])

  const send = async () => {
    if (!activeId || !reply.trim()) return
    await fetch(`/api/support/${activeId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...csrfHeader() },
      body: JSON.stringify({ body: reply, status: "PENDING" }),
    })
    setReply("")
    mutateMsgs()
    mutate()
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Support</h1>
      <Separator />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(tickets ?? []).map((t: any) => (
                <TableRow key={t.id} onClick={() => setActiveId(t.id)} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>{t.subject}</TableCell>
                  <TableCell>{t.email}</TableCell>
                  <TableCell>{t.status}</TableCell>
                  <TableCell>{new Date(t.updatedAt).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="rounded-md border p-4">
          {activeId ? (
            <>
              <div className="h-64 overflow-y-auto border rounded p-3 mb-3 bg-muted/30">
                {(messages ?? []).map((m: any) => (
                  <div key={m.id} className="mb-2">
                    <div className="text-xs text-muted-foreground">{new Date(m.createdAt).toLocaleString()} • {m.author}</div>
                    <div className="text-sm">{m.body}</div>
                  </div>
                ))}
              </div>
              <Textarea placeholder="Type a reply..." value={reply} onChange={(e) => setReply(e.target.value)} className="mb-2" />
              <div className="flex gap-2">
                <Button onClick={send}>Send Reply</Button>
                <Button variant="outline" onClick={() => setActiveId(null)}>Close</Button>
              </div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">Select a ticket to view and reply</div>
          )}
        </div>
      </div>
    </div>
  )
}