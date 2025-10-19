export function getRpID() {
  const fromEnv = process.env.WEBAUTHN_RP_ID
  if (fromEnv) return fromEnv
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    const u = new URL(base)
    return u.hostname
  } catch {
    return "localhost"
  }
}

export function getOrigin() {
  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
  return base.replace(/\/$/, "")
}

export function getRpName() {
  return process.env.WEBAUTHN_RP_NAME || "NV Mercantile"
}