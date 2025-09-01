import { PageTemplate } from "@/components/templates"
import { HeroSection } from "@/components/organisms"
import { FeaturedSections } from "@/components/featured-sections"
import { ProductShowcase } from "@/components/product-showcase"

export default function HomePage() {
  return (
    <PageTemplate showHero={true} heroSection={<HeroSection />}>
      <FeaturedSections />
      <ProductShowcase />
    </PageTemplate>
  )
}
