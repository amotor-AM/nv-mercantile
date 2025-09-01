"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Search, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CartIcon } from "@/components/cart-icon"
import { getAllProducts } from "@/lib/product-data"
import { useRouter } from "next/navigation"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const router = useRouter()

  const allProducts = getAllProducts()

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    
    if (query.trim() === "") {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }

    const results = allProducts.filter(product => 
      product.name.toLowerCase().includes(query.toLowerCase()) ||
      product.subtitle.toLowerCase().includes(query.toLowerCase()) ||
      product.material.toLowerCase().includes(query.toLowerCase()) ||
      product.applications.some(app => app.toLowerCase().includes(query.toLowerCase()))
    ).slice(0, 5) // Limit to 5 results

    setSearchResults(results)
    setShowSearchResults(true)
  }

  const handleProductClick = (productId: string) => {
    setSearchQuery("")
    setShowSearchResults(false)
    router.push(`/product/${productId}`)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Navigate to search results page or show results
      setShowSearchResults(false)
      // For now, just clear the search
      setSearchQuery("")
    }
  }

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowSearchResults(false)
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border">
      {/* Main header */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="text-2xl font-bold text-primary">NV MERCANTILE</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/machined-parts" className="font-medium hover:text-primary">
              Machined Parts
            </Link>
            <Link href="/metalwork" className="font-medium hover:text-primary">
              Metalwork
            </Link>
            <Link href="/3d-prints" className="font-medium hover:text-primary">
              3D Prints
            </Link>
            <Link href="/custom-orders" className="font-medium hover:text-primary">
              Custom Orders
            </Link>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="hidden md:block relative">
              <form onSubmit={handleSearchSubmit} className="relative">
                <div className="flex items-center bg-muted rounded-full px-4 py-2 w-80">
                  <Search className="w-4 h-4 text-muted-foreground mr-2" />
                  <Input 
                    placeholder="Search parts, materials, applications..." 
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="border-0 bg-transparent p-0 focus-visible:ring-0 text-sm w-full"
                  />
                </div>
                
                {/* Search Results Dropdown */}
                {showSearchResults && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-lg z-50">
                    {searchResults.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => handleProductClick(product.id)}
                        className="w-full p-3 text-left hover:bg-muted transition-colors border-b border-border last:border-b-0"
                      >
                        <div className="flex items-center gap-3">
                          <img 
                            src={product.image} 
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{product.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{product.subtitle}</p>
                            <p className="text-xs text-muted-foreground">${product.price}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </form>
            </div>

            {/* Icons */}
            <CartIcon />

            {/* Mobile menu button */}
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-border py-4">
            <nav className="flex flex-col space-y-4">
              <Link href="/machined-parts" className="font-medium hover:text-primary">
                Machined Parts
              </Link>
              <Link href="/metalwork" className="font-medium hover:text-primary">
                Metalwork
              </Link>
              <Link href="/3d-prints" className="font-medium hover:text-primary">
                3D Prints
              </Link>
              <Link href="/custom-orders" className="font-medium hover:text-primary">
                Custom Orders
              </Link>
              <div className="flex items-center bg-muted rounded-full px-4 py-2 mt-4">
                <Search className="w-4 h-4 text-muted-foreground mr-2" />
                <Input 
                  placeholder="Search parts, materials, applications..." 
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="border-0 bg-transparent p-0 focus-visible:ring-0 text-sm" 
                />
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
