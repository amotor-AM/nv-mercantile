"use client"

import { ProductGrid } from "@/components/product-grid"

export default function MetalworkPage() {
  return (
    <div className="mb-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-4">Metalwork</h1>
        <p className="text-lg text-muted-foreground max-w-3xl">
          Handcrafted metal components and artistic pieces created with traditional craftsmanship. 
          From architectural elements to decorative art, our metalwork combines beauty with functionality.
        </p>
      </div>

      <ProductGrid category="metalwork" />
    </div>
  )
} 