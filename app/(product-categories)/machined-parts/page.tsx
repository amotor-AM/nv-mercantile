import { ProductGrid } from "@/components/product-grid"

export default function MachinedPartsPage() {
  return (
    <div className="mb-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-4">Machined Parts</h1>
        <p className="text-lg text-muted-foreground max-w-3xl">
          Precision CNC machined components with aerospace-grade tolerances. Our machined parts
          are designed for applications where accuracy, reliability, and performance are critical.
        </p>
      </div>

      <ProductGrid category="machined-parts" />
    </div>
  )
} 