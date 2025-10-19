"use client"

import { Button } from "@/components/ui/button"
import { csrfHeader } from "@/lib/csrf"
import { useState } from "react"

export default function AccountPrivacyPage() {
  const [exportJson, setExportJson] = useState<any | null>(null)
  const [status, setStatus] = useState<string | null>(null)

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      <h1 className="text-2xl font-bold">Privacy Settings</h1>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Data Export</h2>
        <p className="text-sm text-muted-foreground">Download your account data (orders, tickets, linked accounts).</p>
        <Button
          onClick={async () => {
            const res = await fetch("/api/account/export")
            if (res.ok) {
              const json = await res.json()
              setExportJson(json)
            }
          }}
        >
          Export JSON
        </Button>
        {exportJson && (
          <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-96">{JSON.stringify(exportJson, null, 2)}</pre>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Delete Account</h2>
        <p className="text-sm text-muted-foreground">
          Permanently delete your account and anonymize your orders and support tickets. This action cannot be undone.
        </p>
        <Button
          variant="destructive"
          onClick={async () => {
            setStatus(null)
            const res = await fetch("/api/account/delete", {
              method: "POST",
              headers: { "Content-Type": "application/json", ...csrfHeader() },
              body: JSON.stringify({ confirm: "DELETE" }),
            })
            if (res.ok) {
              setStatus("Account deleted.")
            } else {
              const j = await res.json().catch(() => ({}))
              setStatus(j.error || "Failed to delete account")
            }
          }}
        >
          Delete Account
        </Button>
        {status && <div className="text-sm text-muted-foreground">{status}</div>}
      </div>
    </div>
  )
}