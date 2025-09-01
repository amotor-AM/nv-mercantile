"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { getAllProducts } from "@/lib/product-data"

export function ProductShowcase() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const productsPerPage = 5
  const allProducts = getAllProducts()
  const totalProducts = allProducts.length
  const totalPages = Math.ceil(totalProducts / productsPerPage)

  const nextPage = () => {
    setCurrentIndex((prev) => (prev + 1) % totalPages)
  }

  const prevPage = () => {
    setCurrentIndex((prev) => (prev - 1 + totalPages) % totalPages)
  }

  const startIndex = currentIndex * productsPerPage
  const endIndex = startIndex + productsPerPage
  const currentProducts = allProducts.slice(startIndex, endIndex)

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-medium">Shop The Latest</h2>
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-2 rounded-full hover:bg-gray-100"
              onClick={prevPage}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-2 rounded-full hover:bg-gray-100"
              onClick={nextPage}
              disabled={currentIndex === totalPages - 1}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {currentProducts.map((product) => (
            <Link key={product.id} href={`/product/${product.id}`} className="group cursor-pointer">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <h3 className="font-medium text-base text-center mb-1">{product.name}</h3>
              <p className="text-sm text-gray-600 text-center mb-1">{product.subtitle}</p>
              <p className="text-lg font-bold text-primary text-center">${product.price}</p>
            </Link>
          ))}
        </div>

        {/* Page Indicators */}
        <div className="flex justify-center mt-6 space-x-2">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`w-3 h-3 rounded-full transition-colors ${
                i === currentIndex ? 'bg-primary' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
