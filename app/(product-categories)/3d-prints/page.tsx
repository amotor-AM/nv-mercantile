import { ProductGrid } from "@/components/product-grid"

export default function ThreeDPrintsPage() {
  return (
    <div className="mb-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-4">3D Prints</h1>
        <p className="text-lg text-muted-foreground max-w-3xl">
          High-quality additive manufacturing services using advanced 3D printing technologies. 
          From rapid prototyping to production parts, we deliver precision and quality in every print.
        </p>
      </div>

      <ProductGrid category="3d-prints" />
    </div>
  )
} 