"use client"

import { useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { csrfHeader } from "@/lib/csrf"

export default function TwoFactorChallengePage() {
  const params = useSearchParams()
  const router = useRouter()
  const redirect = params.get("redirect") || "/admin"

  const [token, setToken] = useState("")
  const [backupCode, setBackupCode] = useState("")
  const [remember, setRemember] = useState(true)
  const [deviceName, setDeviceName] = useState("My device")
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-6">Two-Factor Verification</h1>

      {error && <div className="text-sm text-destructive mb-3">{error}</div>}

      <div className="space-y-4">
        <div>
          <Label htmlFor="token">Authentication code</Label>
          <Input id="token" value={token} onChange={(e) => setToken(e.target.value)} placeholder="123456" />
        </div>
        <div>
          <Label htmlFor="backup">Backup code (optional)</Label>
          <Input id="backup" value={backupCode} onChange={(e) => setBackupCode(e.target.value)} placeholder="XXXXXX" />
        </div>
        <div className="flex items-center gap-2">
          <input
            id="remember"
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          <Label htmlFor="remember">Remember this device</Label>
        </div>
        {remember && (
          <div>
            <Label htmlFor="devicename">Device name</Label>
            <Input id="devicename" value={deviceName} onChange={(e) => setDeviceName(e.target.value)} />
          </div>
        )}
        <Button
          onClick={async () => {
            setError(null)
            const res = await fetch("/api/auth/2fa/challenge", {
              method: "POST",
              headers: { "Content-Type": "application/json", ...csrfHeader() },
              body: JSON.stringify({ token, backupCode, rememberDevice: remember, deviceName }),
            })
            if (res.ok) {
              router.push(redirect)
            } else {
              const data = await res.json().catch(() => ({}))
              setError(data.error || "Verification failed")
            }
          }}
        >
          Verify
        </Button>
      </div>
    </div>
  )
}