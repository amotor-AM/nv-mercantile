"use client"

import { useState, useEffect } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { getAllProducts } from "@/lib/product-data"

interface SearchBarProps {
  className?: string
  placeholder?: string
  showResults?: boolean
  onSearch?: (query: string) => void
}

interface SearchResult {
  id: string
  name: string
  subtitle: string
  image: string
  price: number
}

export function SearchBar({
  className = "",
  placeholder = "Search parts, materials, applications...",
  showResults = true,
  onSearch
}: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
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
    setShowSearchResults(showResults)
    onSearch?.(query)
  }

  const handleProductClick = (productId: string) => {
    setSearchQuery("")
    setShowSearchResults(false)
    router.push(`/product/${productId}`)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      setShowSearchResults(false)
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
    <form onSubmit={handleSearchSubmit} className={`relative ${className}`}>
      <div className="flex items-center bg-muted rounded-full px-4 py-2">
        <Search className="w-4 h-4 text-muted-foreground mr-2" />
        <Input
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="border-0 bg-transparent p-0 focus-visible:ring-0 text-sm"
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
  )
}
