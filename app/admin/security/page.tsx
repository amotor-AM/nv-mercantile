"use client"

import useSWR from "swr"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { csrfHeader } from "@/lib/csrf"
import { startRegistration } from "@simplewebauthn/browser"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function AdminSecurityPage() {
  const [otpUri, setOtpUri] = useState<string | null>(null)
  const [verifyCode, setVerifyCode] = useState("")
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null)
  const [creds, setCreds] = useState<any[]>([])
  const [regName, setRegName] = useState("My Passkey")
  const [webAuthnError, setWebAuthnError] = useState<string | null>(null)

  const { data: devices, mutate: refreshDevices } = useSWR("/api/auth/devices", fetcher)

  async function refreshCreds() {
    const res = await fetch("/api/auth/webauthn/credentials")
    if (res.ok) setCreds(await res.json())
  }

  useEffect(() => {
    refreshCreds()
  }, [])

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <h1 className="text-2xl font-bold">Security Settings</h1>

      <Card className="p-6 space-y-4">
        <h2 className="text-xl font-semibold">Two-Factor Authentication (TOTP)</h2>
        {!otpUri ? (
          <Button
            onClick={async () => {
              const res = await fetch("/api/auth/2fa/setup", { method: "POST", headers: { ...csrfHeader() } })
              if (res.ok) {
                const data = await res.json()
                setOtpUri(data.otpauth)
              }
            }}
          >
            Setup TOTP
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Authenticator URI</Label>
              <Input readOnly value={otpUri} />
              <p className="text-sm text-muted-foreground">
                Copy the above URI into your authenticator app or convert it to a QR code.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Enter 6-digit code to verify</Label>
              <Input value={verifyCode} onChange={(e) => setVerifyCode(e.target.value)} placeholder="123456" />
            </div>
            <Button
              onClick={async () => {
                const res = await fetch("/api/auth/2fa/verify", {
                  method: "POST",
                  headers: { "Content-Type": "application/json", ...csrfHeader() },
                  body: JSON.stringify({ token: verifyCode }),
                })
                if (res.ok) {
                  const bc = await fetch("/api/auth/2fa/backup", { method: "POST", headers: { ...csrfHeader() } })
                  if (bc.ok) {
                    const data = await bc.json()
                    setBackupCodes(data.codes)
                  }
                }
              }}
            >
              Verify
            </Button>

            {backupCodes && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">Backup Codes</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Store these in a safe place. Each code can be used one time.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {backupCodes.map((c) => (
                    <code key={c} className="text-sm p-2 bg-muted rounded">
                      {c}
                    </code>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="text-xl font-semibold">Passkeys (WebAuthn)</h2>
        {webAuthnError && <div className="text-sm text-destructive">{webAuthnError}</div>}
        <div className="space-y-2">
          <Label htmlFor="regname">Name</Label>
          <Input id="regname" value={regName} onChange={(e) => setRegName(e.target.value)} />
        </div>
        <Button
          onClick={async () => {
            setWebAuthnError(null)
            const o = await fetch("/api/auth/webauthn/register/options", { method: "POST", headers: { ...csrfHeader() } })
            if (!o.ok) {
              setWebAuthnError("Failed to start registration")
              return
            }
            const opts = await o.json()
            try {
              const attestation = await startRegistration(opts)
              const v = await fetch("/api/auth/webauthn/register/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json", ...csrfHeader() },
                body: JSON.stringify({ ...attestation, name: regName }),
              })
              if (v.ok) {
                refreshCreds()
              } else {
                const err = await v.json().catch(() => ({}))
                setWebAuthnError(err.error || "Verification failed")
              }
            } catch (e: any) {
              setWebAuthnError(e?.message || "Registration cancelled")
            }
          }}
        >
          Register a Passkey
        </Button>

        <div className="mt-4 space-y-2">
          {creds.length ? (
            creds.map((c) => (
              <div key={c.id} className="flex items-center justify-between border rounded p-3">
                <div>
                  <div className="font-medium">{c.name || "Passkey"}</div>
                  <div className="text-sm text-muted-foreground">Added: {new Date(c.createdAt).toLocaleString()}</div>
                </div>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    await fetch(`/api/auth/webauthn/credentials/${c.id}`, {
                      method: "DELETE",
                      headers: { ...csrfHeader() },
                    })
                    refreshCreds()
                  }}
                >
                  Remove
                </Button>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">No passkeys registered</div>
          )}
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="text-xl font-semibold">Trusted Devices</h2>
        <div className="space-y-2">
          <Button
            variant="outline"
            onClick={async () => {
              await fetch("/api/auth/devices", { method: "POST", headers: { ...csrfHeader() } })
              refreshDevices()
            }}
          >
            Trust this device
          </Button>
        </div>

        <div className="mt-4 space-y-2">
          {Array.isArray(devices) && devices.length ? (
            devices.map((d: any) => (
              <div key={d.id} className="flex items-center justify-between border rounded p-3">
                <div>
                  <div className="font-medium">{d.name || "Device"}</div>
                  <div className="text-sm text-muted-foreground">
                    {d.userAgent} • Last seen: {d.lastSeen ? new Date(d.lastSeen).toLocaleString() : "n/a"}
                  </div>
                </div>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    await fetch(`/api/auth/devices/${d.id}`, { method: "DELETE", headers: { ...csrfHeader() } })
                    refreshDevices()
                  }}
                >
                  Revoke
                </Button>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">No trusted devices</div>
          )}
        </div>
      </Card>
    </div>
  )
}