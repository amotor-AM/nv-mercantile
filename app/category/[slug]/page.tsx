import { ProductCategoryTemplate } from "@/components/templates"
import { prisma } from "@/lib/db"

interface CategoryPageProps {
  params: Promise<{ slug: string }>
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