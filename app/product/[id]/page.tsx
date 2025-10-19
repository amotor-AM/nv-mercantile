import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ProductDetails } from "@/components/product-details"
import { ProductRecommendations } from "@/components/product-recommendations"
import { Breadcrumb } from "@/components/breadcrumb"
import { prisma } from "@/lib/db"
import { getAllProducts, getProduct } from "@/lib/product-data"

export const revalidate = 300

interface ProductPageProps {
  params: Promise<{
    id: string
  }>
}

export async function generateMetadata({ params }: ProductPageProps) {
  const { id } = await params
  // Prefer DB product
  const dbProduct = await prisma.product.findUnique({ where: { id }, include: { category: true } }).catch(() => null as any)
  const product = dbProduct || getProduct(id)
  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
  const url = `${base}/product/${id}`
  const title = product ? `${product.name} – NV Mercantile` : "Product – NV Mercantile"
  const description =
    (product && (product.subtitle || product.description)) ||
    "High-quality manufacturing products from NV Mercantile."

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      type: "product",
      url,
      images: product?.image ? [{ url: product.image, alt: product?.name }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: product?.image ? [product.image] : undefined,
    },
  } as any
}

export default async function ProductPage({ params }: ProductPageProps) {
  const resolvedParams = await params
  const dbProduct = await prisma.product.findUnique({ where: { id: resolvedParams.id } }).catch(() => null as any)
  const product = dbProduct || getProduct(resolvedParams.id)

  const jsonLd = product
    ? {
        "@context": "https://schema.org/",
        "@type": "Product",
        name: product.name,
        description: product.subtitle || product.description,
        image: product.image,
        sku: dbProduct?.slug || product.id,
        brand: { "@type": "Brand", name: "NV Mercantile" },
        offers: {
          "@type": "Offer",
          priceCurrency: "USD",
          price: dbProduct ? dbProduct.price : product.price,
          availability: (dbProduct ? dbProduct.inStock : product.inStock) ? "https://schema.org/InStock" : "https://schema.org/PreOrder",
          url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/product/${resolvedParams.id}`,
        },
      }
    : null

  return (
    <main className="min-h-screen">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <Breadcrumb productId={resolvedParams.id} />
        <ProductDetails productId={resolvedParams.id} />
        <ProductRecommendations />
        {jsonLd && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        )}
      </div>

      <Footer />
    </main>
  )
}

// (Optional) Generate static params if product-data is available
export async function generateStaticParams() {
  const products = getAllProducts()

  return products.map((product) => ({
    id: product.id,
  }))
}
