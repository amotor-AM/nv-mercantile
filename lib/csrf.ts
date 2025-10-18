export function getCsrfToken(): string {
  if (typeof document === "undefined") return ""
  const match = document.cookie.match(/(?:^|; )nv_csrf=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : ""
}

export function csrfHeader(): Record<string, string> {
  const token = getCsrfToken()
  return token ? { "x-csrf-token": token } : {}
}