"use client"

import { useState } from "react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Grid3X3, List } from "lucide-react"
import { ProductCard } from "@/components/molecules/product-card"
import { Skeleton } from "@/components/ui/skeleton"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface ProductGridProps {
  category: string
}

export function ProductGrid({ category }: ProductGridProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState<string>("featured")

  const { data } = useSWR(`/api/products?category=${encodeURIComponent(category)}&pageSize=100`, fetcher)
  const categoryProducts = (data?.items ?? []) as Array<any>
  const isLoading = !data

  const sortedProducts = [...categoryProducts].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return a.price - b.price
      case "price-high":
        return b.price - a.price
      case "newest":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      default:
        return 0
    }
  })

  return (
    <div className="space-y-6" aria-busy={isLoading} aria-live="polite">
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
            <SelectTrigger className="w-48" aria-label="Sort products">
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
          <div className="flex border rounded-md" role="tablist" aria-label="View mode">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="rounded-r-none"
              aria-pressed={viewMode === "grid"}
              type="button"
            >
              <Grid3X3 className="w-4 h-4" aria-hidden="true" />
              <span className="sr-only">Grid view</span>
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-l-none"
              aria-pressed={viewMode === "list"}
              type="button"
            >
              <List className="w-4 h-4" aria-hidden="true" />
              <span className="sr-only">List view</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
        {isLoading
          ? Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="border-0 shadow-none bg-card overflow-hidden">
                <div className={viewMode === "grid" ? "space-y-0" : "flex gap-4"}>
                  <Skeleton className={viewMode === "grid" ? "aspect-square" : "w-32 h-32 flex-shrink-0"} />
                  <div className={`space-y-2 p-4 ${viewMode === "list" ? "flex-1" : ""}`}>
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                </div>
              </div>
            ))
          : sortedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                viewMode={viewMode}
              />
            ))}
      </div>

      {/* Load More */}
      <div className="flex justify-center pt-8">
        <Button variant="outline" size="lg" type="button">
          Load More Products
        </Button>
      </div>
    </div>
  )
}
