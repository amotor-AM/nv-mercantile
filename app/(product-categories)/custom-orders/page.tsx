import { ProductGrid } from "@/components/product-grid"

export default function CustomOrdersPage() {
  return (
    <div className="mb-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-4">Custom Orders</h1>
        <p className="text-lg text-muted-foreground max-w-3xl">
          Bespoke solutions tailored to your specific needs. Our custom orders combine engineering expertise 
          with artistic vision to create unique pieces that exceed expectations.
        </p>
      </div>

      <ProductGrid category="custom-orders" />
    </div>
  )
} 