"use client"

import useSWR from "swr"
import { useParams } from "next/navigation"
import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import { csrfHeader } from "@/lib/csrf"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function ProductImagesPage() {
  const params = useParams<{ id: string }>()
  const productId = params.id
  const { data: images, mutate } = useSWR(`/api/admin/products/${productId}/images`, fetcher)
  const fileRef = useRef<HTMLInputElement>(null)
  const [url, setUrl] = useState("")

  const upload = async () => {
    const file = fileRef.current?.files?.[0]
    if (file) {
      const fd = new FormData()
      fd.set("file", file)
      const res = await fetch("/api/admin/uploads", { method: "POST", body: fd, headers: { ...csrfHeader() } })
      if (res.ok) {
        const { url } = await res.json()
        await fetch(`/api/admin/products/${productId}/images`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...csrfHeader() },
          body: JSON.stringify({ url }),
        })
        if (fileRef.current) fileRef.current.value = ""
        mutate()
      }
    } else if (url) {
      await fetch(`/api/admin/products/${productId}/images`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...csrfHeader() },
        body: JSON.stringify({ url }),
      })
      setUrl("")
      mutate()
    }
  }

  const remove = async (imageId: string) => {
    await fetch(`/api/admin/products/images/${imageId}`, { method: "DELETE", headers: { ...csrfHeader() } })
    mutate()
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Product Images</h1>
      <div className="flex flex-wrap gap-2 items-center">
        <input ref={fileRef} type="file" accept="image/*" />
        <span className="text-xs text-muted-foreground">or</span>
        <Input placeholder="Image URL" value={url} onChange={(e) => setUrl(e.target.value)} className="max-w-md" />
        <Button onClick={upload}>Add Image</Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {(images ?? []).map((img: any) => (
          <div key={img.id} className="border rounded overflow-hidden">
            <div className="relative w-full h-40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={img.alt ?? ""} className="object-cover w-full h-full" />
            </div>
            <div className="p-2 flex justify-between items-center">
              <div className="text-xs truncate">{img.url}</div>
              <Button variant="outline" size="sm" onClick={() => remove(img.id)}>Delete</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}