import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { ProductBadge } from "./product-badge"
import { cn } from "@/lib/utils"

interface ProductCardProps {
  product: {
    id: string
    name: string
    subtitle: string
    material: string
    price: number
    image: string
    leadTime: string
    rating?: number
  }
  viewMode?: "grid" | "list"
  className?: string
}

export function ProductCard({ product, viewMode = "grid", className }: ProductCardProps) {
  return (
    <Card className={cn(
      "group cursor-pointer border-0 shadow-none bg-card hover:shadow-lg transition-shadow overflow-hidden",
      className
    )}>
      <Link href={`/product/${product.id}`}>
        <div className={viewMode === "grid" ? "space-y-0" : "flex gap-4"}>
          {/* Product Image */}
          <div
            className={cn(
              "relative overflow-hidden",
              viewMode === "grid" ? "aspect-square" : "w-32 h-32 flex-shrink-0"
            )}
          >
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
            />

            {/* Badges */}
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              {product.leadTime === "1 week" && (
                <ProductBadge type="fast" />
              )}
              {product.rating && product.rating >= 4.8 && (
                <ProductBadge type="top-rated" />
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className={cn(
            "space-y-2 p-4",
            viewMode === "list" ? "flex-1" : ""
          )}>
            <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
              {product.name}
            </h3>
            <p className="text-muted-foreground text-xs">{product.subtitle}</p>
            <p className="text-muted-foreground text-xs">{product.material}</p>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">${product.price}</span>
              <span className="text-muted-foreground text-xs">{product.leadTime}</span>
            </div>
          </div>
        </div>
      </Link>
    </Card>
  )
}
