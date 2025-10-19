"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

export function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const v = window.localStorage.getItem("nv_consent_analytics") || ""
      const c = document.cookie.split("; ").find((x) => x.startsWith("nv_consent_analytics="))
      if (!v && !c) {
        setVisible(true)
      }
    } catch {
      setVisible(true)
    }
  }, [])

  if (!visible) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50">
      <div className="max-w-4xl mx-auto bg-background border rounded-lg shadow p-4 flex flex-col sm:flex-row items-center gap-3">
        <div className="text-sm">
          We use cookies to improve your experience and analyze traffic. You can accept or manage preferences. Analytics cookies enable GA usage.
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              document.cookie = `nv_consent_analytics=false; path=/; samesite=lax`
              try { window.localStorage.setItem("nv_consent_analytics", "false") } catch {}
              setVisible(false)
            }}
          >
            Decline
          </Button>
          <Button
            onClick={() => {
              document.cookie = `nv_consent_analytics=true; path=/; samesite=lax`
              try { window.localStorage.setItem("nv_consent_analytics", "true") } catch {}
              setVisible(false)
              window.location.reload()
            }}
          >
            Accept
          </Button>
        </div>
      </div>
    </div>
  )
}