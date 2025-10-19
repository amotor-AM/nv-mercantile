"use client"

import { SessionProvider } from "next-auth/react"
import { CookieConsent } from "@/components/cookie-consent"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <CookieConsent />
    </SessionProvider>
  )
}