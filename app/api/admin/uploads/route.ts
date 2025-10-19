import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { randomUUID } from "crypto"
import { promises as fs } from "fs"
import path from "path"
import { getClientIp, logAdminAction } from "@/lib/security"

const ALLOWED_MIME = new Set(["image/png", "image/jpeg", "image/webp", "application/pdf"])
const EXT_BY_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "application/pdf": "pdf",
}
const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10MB

export async function POST(req: NextRequest) {
  const session = await auth()
  const role = (session as any)?.user?.role
  if (!["ADMIN","MANAGER"].includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const form = await req.formData()
  const file = form.get("file")
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: "file field required" }, { status: 400 })
  }

  const type = (file as any).type || ""
  const size = Number((file as any).size || 0)
  if (!ALLOWED_MIME.has(type)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 415 })
  }
  if (size <= 0 || size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "File too large" }, { status: 413 })
  }

  const bytes = Buffer.from(await file.arrayBuffer())
  const uploadsDir = path.join(process.cwd(), "public", "uploads")
  await fs.mkdir(uploadsDir, { recursive: true })
  const ext = EXT_BY_MIME[type] || "bin"
  const filename = `${randomUUID()}.${ext}`
  const filepath = path.join(uploadsDir, filename)
  await fs.writeFile(filepath, bytes)

  const url = `/uploads/${filename}`

  await logAdminAction({
    userId: session?.user?.id ?? null,
    action: "upload.create",
    targetType: "Upload",
    targetId: filename,
    payload: { url, name: (file as any).name ?? null, size, type },
    ip: getClientIp(req),
    userAgent: req.headers.get("user-agent"),
  })

  return NextResponse.json({ url })
}