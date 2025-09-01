"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ProductFilters } from "@/components/product-filters"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Filter, X } from "lucide-react"

interface ProductCategoryLayoutProps {
  children: React.ReactNode
}

export default function ProductCategoryLayout({ children }: ProductCategoryLayoutProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [activeFilters, setActiveFilters] = useState({
    material: [] as string[],
    priceRange: [0, 1000] as [number, number],
    leadTime: [] as string[],
    applications: [] as string[],
    tolerance: [] as string[]
  })

  const handleFilterChange = (filterType: keyof typeof activeFilters, value: any) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterType]: value
    }))
  }

  const clearAllFilters = () => {
    setActiveFilters({
      material: [],
      priceRange: [0, 1000],
      leadTime: [],
      applications: [],
      tolerance: []
    })
  }

  const hasActiveFilters = Object.values(activeFilters).some(filter => 
    Array.isArray(filter) ? filter.length > 0 : false
  )

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Mobile Filter Button */}
        <div className="lg:hidden mb-6">
          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                <Filter className="w-4 h-4 mr-2" />
                Filters
                {hasActiveFilters && (
                  <span className="ml-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                    {Object.values(activeFilters).filter(f => Array.isArray(f) && f.length > 0).length}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle className="flex items-center justify-between">
                  <span>Filters</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsFilterOpen(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </SheetTitle>
              </SheetHeader>
              
              <div className="mt-6">
                <ProductFilters
                  activeFilters={activeFilters}
                  onFilterChange={handleFilterChange}
                  onClearAll={clearAllFilters}
                  isMobile={true}
                />
                
                <div className="mt-6 pt-6 border-t">
                  <Button 
                    className="w-full" 
                    onClick={() => setIsFilterOpen(false)}
                  >
                    Apply Filters
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block lg:col-span-1">
            <div className="sticky top-24">
              <ProductFilters
                activeFilters={activeFilters}
                onFilterChange={handleFilterChange}
                onClearAll={clearAllFilters}
                isMobile={false}
              />
            </div>
          </aside>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {children}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
} 