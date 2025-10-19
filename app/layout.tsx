import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"
import { Analytics } from "@vercel/analytics/react"
import { GoogleAnalytics } from "next/third-parties/google"
import { cookies } from "next/headers"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "NV Mercantile - Precision Manufacturing Solutions",
  description: "High-quality machined parts, bespoke metalwork, and precision 3D prints. Professional manufacturing services with aerospace-grade tolerances.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const consent = cookies().get("nv_consent_analytics")?.value === "true"
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
        <Analytics />
        {process.env.NEXT_PUBLIC_GA_ID && consent ? <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID!} /> : null}
      </body>
    </html>
  )
}
