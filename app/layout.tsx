import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ClerkProvider } from "@clerk/nextjs"

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
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClerkProvider>{children}</ClerkProvider>
      </body>
    </html>
  )
}
