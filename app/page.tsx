import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { FeaturedSections } from "@/components/featured-sections"
import { ProductShowcase } from "@/components/product-showcase"
import { Footer } from "@/components/footer"

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Header />
      <HeroSection />
      <FeaturedSections />
      <ProductShowcase />
      <Footer />
    </main>
  )
}
