import { Redis } from "@upstash/redis"
import { addHours, formatISO9075 } from "date-fns"

const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({ url: process.env.UPSTASH_REDIS_REST_URL!, token: process.env.UPSTASH_REDIS_REST_TOKEN! })
  : null

function hourKey(date = new Date()) {
  // yyyy-MM-dd HH for per-hour buckets
  return formatISO9075(date, { representation: "date" }) + " " + String(date.getHours()).padStart(2, "0")
}

export async function incCounter(name: string, amount = 1, date = new Date()) {
  if (!redis) return
  const key = `metrics:${name}:${hourKey(date)}`
  await redis.incrby(key, amount)
  // set TTL 72h
  await redis.expire(key, 60 * 60 * 72)
}

export async function getSeries(names: string[], hours = 24) {
  const now = new Date()
  const points: string[] = []
  for (let i = hours - 1; i >= 0; i--) {
    points.push(hourKey(addHours(now, -i)))
  }
  const data: Record<string, Array<{ bucket: string; value: number }>> = {}
  for (const n of names) {
    data[n] = []
  }
  if (!redis) {
    for (const n of names) {
      for (const b of points) data[n].push({ bucket: b, value: 0 })
    }
    return data
  }
  for (const b of points) {
    const keys = names.map((n) => `metrics:${n}:${b}`)
    const vals = await redis.mget<number[]>(...keys)
    for (let i = 0; i < names.length; i++) {
      data[names[i]].push({ bucket: b, value: Number(vals?.[i] || 0) })
    }
  }
  return data
}