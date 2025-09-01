import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ProductDetails } from "@/components/product-details"
import { ProductRecommendations } from "@/components/product-recommendations"
import { Breadcrumb } from "@/components/breadcrumb"

interface ProductPageProps {
  params: {
    id: string
  }
}

export default function ProductPage({ params }: ProductPageProps) {
  return (
    <main className="min-h-screen">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <Breadcrumb productId={params.id} />
        <ProductDetails productId={params.id} />
        <ProductRecommendations />
      </div>

      <Footer />
    </main>
  )
}
