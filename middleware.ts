import { auth } from "./auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { nextUrl } = req
  const isAdmin = nextUrl.pathname.startsWith("/admin")

  if (isAdmin) {
    if (!req.auth) {
      const url = new URL("/signin", nextUrl.origin)
      url.searchParams.set("callbackUrl", nextUrl.href)
      return NextResponse.redirect(url)
    }
    const role = (req.auth as any).user?.role
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", nextUrl.origin))
    }
  }
})

export const config = {
  matcher: ["/admin/:path*"],
}