import { auth } from "./auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { nextUrl } = req
  const isAdmin = nextUrl.pathname.startsWith("/admin")
  const isApi = nextUrl.pathname.startsWith("/api/")

  // Always ensure a CSRF token cookie exists (double-submit cookie pattern)
  const csrfCookie = req.cookies.get("nv_csrf")?.value
  const res = NextResponse.next()
  if (!csrfCookie) {
    const token = crypto.randomUUID()
    res.cookies.set("nv_csrf", token, {
      path: "/",
      httpOnly: false, // must be readable by client to send as header
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    })
  }

  // Admin area guard with 2FA enforcement
  if (isAdmin) {
    if (!req.auth) {
      const url = new URL("/signin", nextUrl.origin)
      url.searchParams.set("callbackUrl", nextUrl.href)
      return NextResponse.redirect(url)
    }
    const role = (req.auth as any).user?.role
    if (!["ADMIN", "MANAGER"].includes(role)) {
      return NextResponse.redirect(new URL("/", nextUrl.origin))
    }
    const twoFactorEnabled = !!(req.auth as any).user?.twoFactorEnabled
    const webauthnEnabled = !!(req.auth as any).user?.webauthnEnabled
    const twoFactorCookie = req.cookies.get("nv_2fa_ok")?.value
    // If neither TOTP nor WebAuthn is enabled, force setup page
    if (!twoFactorEnabled && !webauthnEnabled && !nextUrl.pathname.startsWith("/admin/security")) {
      return NextResponse.redirect(new URL("/admin/security", nextUrl.origin))
    }
    // If at least one 2FA method is enabled but not verified on this device, force challenge page
    if ((twoFactorEnabled || webauthnEnabled) && twoFactorCookie !== "true" && !nextUrl.pathname.startsWith("/admin/security/2fa")) {
      const url = new URL("/admin/security/2fa", nextUrl.origin)
      url.searchParams.set("redirect", nextUrl.href)
      return NextResponse.redirect(url)
    }
  }

  // CSRF protection for non-idempotent API actions (exclude third-party webhooks)
  const method = req.method?.toUpperCase()
  const requireCsrf = isApi && !nextUrl.pathname.startsWith("/api/webhooks") && ["POST", "PATCH", "PUT", "DELETE"].includes(method || "")
  if (requireCsrf) {
    const headerToken = req.headers.get("x-csrf-token") || ""
    const cookieToken = csrfCookie || req.cookies.get("nv_csrf")?.value || ""
    if (!cookieToken || !headerToken || headerToken !== cookieToken) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 })
    }
  }

  return res
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}