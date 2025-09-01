import { ReactNode } from "react"
import { Header } from "@/components/organisms/header"
import { Footer } from "@/components/footer"

interface PageTemplateProps {
  children: ReactNode
  showHero?: boolean
  heroSection?: ReactNode
  className?: string
}

export function PageTemplate({
  children,
  showHero = false,
  heroSection,
  className = ""
}: PageTemplateProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      {showHero && heroSection && heroSection}
      <main className={`flex-1 ${className}`}>
        {children}
      </main>
      <Footer />
    </div>
  )
}
