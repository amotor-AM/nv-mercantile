import { authenticator } from "otplib"
import { randomBytes, createHash } from "crypto"

const issuer = process.env.TOTP_ISSUER || "NV Mercantile"

export function generateTotpSecret(email: string) {
  const secret = authenticator.generateSecret()
  const otpauth = authenticator.keyuri(email, issuer, secret)
  return { secret, otpauth }
}

export function verifyTotp(secret: string, token: string): boolean {
  try {
    return authenticator.verify({ secret, token })
  } catch {
    return false
  }
}

export function generateBackupCodes(count = 10): { code: string; hash: string }[] {
  const codes: { code: string; hash: string }[] = []
  for (let i = 0; i < count; i++) {
    const raw = randomBytes(6).toString("hex").toUpperCase()
    const hash = createHash("sha256").update(raw).digest("hex")
    codes.push({ code: raw, hash })
  }
  return codes
}

export function hashCode(code: string): string {
  return createHash("sha256").update(code).digest("hex")
}