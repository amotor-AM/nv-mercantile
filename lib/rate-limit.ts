import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

/**
 * Simple sliding window rate limit: 60 requests per minute per key.
 * Uses Upstash Redis via REST, compatible with Edge/Cloudflare.
 */
let ratelimit: Ratelimit | null = null
function getLimiter(): Ratelimit | null {
  try {
    if (!ratelimit) {
      const redis = Redis.fromEnv()
      ratelimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(60, "1 m"),
        prefix: "nv-rl",
      })
    }
    return ratelimit
  } catch {
    return null
  }
}

export async function limit(key: string): Promise<boolean> {
  const rl = getLimiter()
  if (!rl) return true // if not configured, allow
  try {
    const res = await rl.limit(key)
    return res.success
  } catch {
    return true
  }
}