"use client"

import { Button } from "@/components/ui/button"
import { useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function SignInPage() {
  const params = useSearchParams()
  const callbackUrl = params.get("callbackUrl") || "/"
  const [email, setEmail] = useState("")

  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 grid place-items-center px-4 py-16">
        <div className="w-full max-w-md border rounded-lg p-6 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">Sign in to NV Mercantile</h1>
            <p className="text-muted-foreground text-sm">Secure access to your orders and account.</p>
          </div>

          <div className="space-y-3">
            <Button onClick={() => signIn("github", { callbackUrl })} className="w-full">Continue with GitHub</Button>
            <Button onClick={() => signIn("google", { callbackUrl })} className="w-full" variant="outline">Continue with Google</Button>
          </div>

          <div className="space-y-3">
            <div className="text-xs text-muted-foreground text-center uppercase">or</div>
            <div className="space-y-2">
              <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Button className="w-full" onClick={() => signIn("email", { email, callbackUrl })}>Email me a sign-in link</Button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            By continuing you agree to our Terms and Privacy Policy.
          </p>
        </div>
      </div>
      <Footer />
    </main>
  )
}