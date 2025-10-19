import { ProductCategoryTemplate } from "@/components/templates"
import { prisma } from "@/lib/db"

interface CategoryPageProps {
  params: Promise<{ slug: string }>
}

export const revalidate = 300

export async function generateMetadata({ params }: CategoryPageProps) {
  const { slug } = await params
  const category = await prisma.category.findUnique({ where: { slug } }).catch(() => null as any)
  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
  const url = `${base}/category/${slug}`
  const title = category?.name ? `${category.name} – NV Mercantile` : `Category – NV Mercantile`
  const description = category?.description || "Explore products at NV Mercantile."

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      type: "website",
      url,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  } as any
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params
  const category = await prisma.category.findUnique({ where: { slug } })

  return (
    <ProductCategoryTemplate
      category={slug}
      title={category?.name ?? slug.replace(/-/g, " ")}
      description={category?.description ?? undefined}
    />
  )
}