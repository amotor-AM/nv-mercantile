"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Grid3X3, List } from "lucide-react"
import Link from "next/link"
import { getProductsByCategory } from "@/lib/product-data"

interface ProductGridProps {
  category: string
}

export function ProductGrid({ category }: ProductGridProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState<string>("featured")

  const categoryProducts = getProductsByCategory(category)

  const sortedProducts = [...categoryProducts].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return a.price - b.price
      case "price-high":
        return b.price - a.price
      case "newest":
        // Since we don't have createdAt, just return original order
        return 0
      default:
        return 0
    }
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold capitalize">
            {category.replace("-", " ")} ({sortedProducts.length})
          </h2>
          <p className="text-muted-foreground">Find your perfect solution</p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          {/* Sort */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="featured">Featured</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>

          {/* View Mode */}
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="rounded-r-none"
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-l-none"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
        {sortedProducts.map((product) => (
          <Card
            key={product.id}
            className="group cursor-pointer border-0 shadow-none bg-card hover:shadow-lg transition-shadow overflow-hidden"
          >
            <Link href={`/product/${product.id}`}>
              <div className={viewMode === "grid" ? "space-y-0" : "flex gap-4"}>
                {/* Product Image */}
                <div
                  className={`relative overflow-hidden ${viewMode === "grid" ? "aspect-square" : "w-32 h-32 flex-shrink-0"}`}
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {product.leadTime === "1 week" && (
                      <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded">Fast</span>
                    )}
                    {product.rating >= 4.8 && (
                      <span className="bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded">
                        Top Rated
                      </span>
                    )}
                  </div>
                </div>

                {/* Product Info */}
                <div className={`space-y-2 p-4 ${viewMode === "list" ? "flex-1" : ""}`}>
                  <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">{product.name}</h3>
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
        ))}
      </div>

      {/* Load More */}
      <div className="flex justify-center pt-8">
        <Button variant="outline" size="lg">
          Load More Products
        </Button>
      </div>
    </div>
  )
}
