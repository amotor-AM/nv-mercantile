import type { MetadataRoute } from "next"
import { prisma } from "@/lib/db"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"

  const [categories, products] = await Promise.all([
    prisma.category.findMany({ where: { isVisible: true }, select: { slug: true, updatedAt: true } }),
    prisma.product.findMany({ select: { id: true, updatedAt: true } }),
  ])

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/cart`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/checkout`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
  ]

  const categoryPages: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${base}/category/${c.slug}`,
    lastModified: c.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }))

  const productPages: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${base}/product/${p.id}`,
    lastModified: p.updatedAt,
    changeFrequency: "daily",
    priority: 0.9,
  }))

  return [...staticPages, ...categoryPages, ...productPages]
}