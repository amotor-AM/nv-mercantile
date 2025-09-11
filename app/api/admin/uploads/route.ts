import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { randomUUID } from "crypto"
import { promises as fs } from "fs"
import path from "path"

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

  const bytes = Buffer.from(await file.arrayBuffer())
  const uploadsDir = path.join(process.cwd(), "public", "uploads")
  await fs.mkdir(uploadsDir, { recursive: true })
  const ext = (file as any).name?.split(".").pop() || "bin"
  const filename = `${randomUUID()}.${ext}`
  const filepath = path.join(uploadsDir, filename)
  await fs.writeFile(filepath, bytes)

  const url = `/uploads/${filename}`
  return NextResponse.json({ url })
}