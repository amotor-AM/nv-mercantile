import pino from "pino"

const level = process.env.LOG_LEVEL || "info"
const name = process.env.LOG_SERVICE_NAME || "nv-mercantile"

export const logger = pino({
  name,
  level,
  base: { service: name },
})

export async function sendToSink(event: any) {
  const sink = process.env.LOG_SINK_URL || ""
  if (!sink) return
  try {
    await fetch(sink, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    })
  } catch {
    // Swallow sink errors
  }
}

export function logEvent(event: { level?: string; msg: string; data?: any }) {
  const { level: lvl = "info", msg, data } = event
  ;(logger as any)[lvl](data || {}, msg)
  sendToSink({ level: lvl, msg, data, ts: Date.now() })
}