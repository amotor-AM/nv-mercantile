import { ProductGrid } from "@/components/organisms/product-grid"
import { PageTemplate } from "./page-template"

interface ProductCategoryTemplateProps {
  category: string
  title?: string
  description?: string
}

export function ProductCategoryTemplate({
  category,
  title,
  description
}: ProductCategoryTemplateProps) {
  return (
    <PageTemplate>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {(title || description) && (
          <div className="text-center mb-12">
            {title && (
              <h1 className="text-4xl font-bold mb-4">{title}</h1>
            )}
            {description && (
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {description}
              </p>
            )}
          </div>
        )}
        <ProductGrid category={category} />
      </div>
    </PageTemplate>
  )
}
