import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { getAllProducts } from "@/lib/product-data"

export function ProductRecommendations() {
  const allProducts = getAllProducts()
  const recommendedProducts = allProducts.slice(0, 4).map((product) => ({
    id: product.id,
    name: product.name,
    category: product.subtitle,
    price: `$${product.price}`,
    image: product.image,
  }))

  return (
    <section className="py-16 border-t">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">You Might Also Like</h2>
        <p className="text-muted-foreground">Complete your project with these recommendations</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {recommendedProducts.map((product) => (
          <Card
            key={product.id}
            className="group cursor-pointer border-0 shadow-none bg-card hover:shadow-lg transition-shadow"
          >
            <CardContent className="p-0">
              <Link href={`/product/${product.id}`}>
                <div className="space-y-4">
                  <div className="aspect-square overflow-hidden rounded-lg">
                    <img
                      src={product.image || "/placeholder.png"}
                      alt={product.name}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">{product.name}</h3>
                    <p className="text-muted-foreground text-xs">{product.category}</p>
                    <p className="font-semibold text-sm">{product.price}</p>
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-center mt-8">
        <Button variant="outline" size="lg">
          <Link href="/machined-parts">View All Products</Link>
        </Button>
      </div>
    </section>
  )
}
