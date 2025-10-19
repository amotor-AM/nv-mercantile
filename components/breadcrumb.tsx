import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { getProduct } from "@/lib/product-data"

interface BreadcrumbProps {
  productId: string
}

export function Breadcrumb({ productId }: BreadcrumbProps) {
  const product = getProduct(productId)

  if (!product) {
    return (
      <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-8">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-foreground">Product Not Found</span>
      </nav>
    )
  }

  // Map category to dynamic route; fall back to generic label
  const getCategoryInfo = (category: string) => {
    const name = category.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase())
    return { link: `/category/${category}`, name }
  }

  const categoryInfo = getCategoryInfo(product.category)

  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-8">
      <Link href="/" className="hover:text-foreground">
        Home
      </Link>
      <ChevronRight className="w-4 h-4" />
      <Link href={categoryInfo.link} className="hover:text-foreground">
        {categoryInfo.name}
      </Link>
      <ChevronRight className="w-4 h-4" />
      <span className="text-foreground">{product.name}</span>
    </nav>
  )
}
