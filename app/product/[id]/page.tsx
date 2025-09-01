import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ProductDetails } from "@/components/product-details"
import { ProductRecommendations } from "@/components/product-recommendations"
import { Breadcrumb } from "@/components/breadcrumb"
import { getAllProducts } from "@/lib/product-data"

interface ProductPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ProductPage({ params }: ProductPageProps) {
  const resolvedParams = await params

  return (
    <main className="min-h-screen">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <Breadcrumb productId={resolvedParams.id} />
        <ProductDetails productId={resolvedParams.id} />
        <ProductRecommendations />
      </div>

      <Footer />
    </main>
  )
}

// Generate static params for all products
export async function generateStaticParams() {
  const products = getAllProducts()

  return products.map((product) => ({
    id: product.id,
  }))
}
