"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, ChevronLeft, ChevronRight, Clock, ExternalLink, ChevronDown, Star } from "lucide-react"
import { ProductImageGallery } from "@/components/product-image-gallery"
import { useCartStore } from "@/lib/cart-store"
import { getProduct } from "@/lib/product-data"

interface ProductDetailsProps {
  productId: string
}

export function ProductDetails({ productId }: ProductDetailsProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  const { addItem, openCart } = useCartStore()

  const product = getProduct(productId)

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-medium mb-4">Product Not Found</h1>
        <p className="text-gray-600">The product you're looking for doesn't exist.</p>
      </div>
    )
  }

  const handleAddToCart = () => {
    addItem({
      id: productId,
      name: product.name,
      category: product.subtitle,
      price: product.price,
      image: product.image,
      material: product.material,
      dimensions: product.dimensions,
    })

    openCart()
  }

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="text-center">
          <p className="text-sm text-gray-600">Professional Manufacturing Services</p>
        </div>
        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-12">
        <div className="space-y-4">
          <div className="relative">
            <Badge className="absolute top-4 left-4 z-10 bg-white text-black border-0">★ Highly Rated</Badge>
            <ProductImageGallery images={[product.image]} productName={product.name} />
          </div>

          {/* Single image display */}
          <div className="flex gap-2 overflow-x-auto">
            <div className="flex-shrink-0 w-16 h-16 border-2 border-gray-200 rounded overflow-hidden">
              <img
                src={product.image || "/placeholder.svg"}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="text-center lg:text-left">
            <h1 className="text-2xl font-medium mb-1">{product.name}</h1>
            <p className="text-gray-600 mb-2">{product.subtitle}</p>
            
            {/* Rating */}
            <div className="flex items-center justify-center lg:justify-start gap-2 mb-4">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(product.rating) ? "text-yellow-400 fill-current" : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600">
                {product.rating} ({product.reviewCount} reviews)
              </span>
            </div>

            <div className="text-3xl font-bold text-primary mb-4">${product.price}</div>
          </div>

          {/* Product Specifications */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Material</p>
                <p className="font-medium">{product.material}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Dimensions</p>
                <p className="font-medium">{product.dimensions}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Weight</p>
                <p className="font-medium">{product.weight}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Lead Time</p>
                <p className="font-medium">{product.leadTime}</p>
              </div>
            </div>

            {product.finish && (
              <div>
                <p className="text-sm text-gray-600">Finish</p>
                <p className="font-medium">{product.finish}</p>
              </div>
            )}

            {product.tolerance && (
              <div>
                <p className="text-sm text-gray-600">Tolerance</p>
                <p className="font-medium">{product.tolerance}</p>
              </div>
            )}
          </div>

          {/* Add to Cart */}
          <div className="space-y-4">
            <Button 
              onClick={handleAddToCart}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              size="lg"
            >
              Add to Cart
            </Button>
            
          </div>

          {/* Stock Status */}
          <div className="flex items-center gap-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${product.inStock ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className={product.inStock ? 'text-green-600' : 'text-red-600'}>
              {product.inStock ? 'In Stock' : 'Made to Order'}
            </span>
            {!product.inStock && (
              <span className="text-gray-600">• {product.leadTime}</span>
            )}
          </div>
        </div>
      </div>

      {/* Product Details Tabs */}
      <div className="mt-16 space-y-6">
        {/* Description */}
        <div>
          <button
            onClick={() => toggleSection('description')}
            className="flex items-center justify-between w-full text-left py-4 border-b"
          >
            <h3 className="text-lg font-medium">Description</h3>
            <ChevronDown className={`w-5 h-5 transition-transform ${expandedSection === 'description' ? 'rotate-180' : ''}`} />
          </button>
          {expandedSection === 'description' && (
            <div className="py-4">
              <p className="text-gray-600 leading-relaxed">{product.description}</p>
            </div>
          )}
        </div>

        {/* Applications */}
        <div>
          <button
            onClick={() => toggleSection('applications')}
            className="flex items-center justify-between w-full text-left py-4 border-b"
          >
            <h3 className="text-lg font-medium">Applications</h3>
            <ChevronDown className={`w-5 h-5 transition-transform ${expandedSection === 'applications' ? 'rotate-180' : ''}`} />
          </button>
          {expandedSection === 'applications' && (
            <div className="py-4">
              <div className="flex flex-wrap gap-2">
                {product.applications.map((app, index) => (
                  <Badge key={index} variant="secondary" className="bg-gray-100 text-gray-800">
                    {app}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Specifications */}
        <div>
          <button
            onClick={() => toggleSection('specifications')}
            className="flex items-center justify-between w-full text-left py-4 border-b"
          >
            <h3 className="text-lg font-medium">Technical Specifications</h3>
            <ChevronDown className={`w-5 h-5 transition-transform ${expandedSection === 'specifications' ? 'rotate-180' : ''}`} />
          </button>
          {expandedSection === 'specifications' && (
            <div className="py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key}>
                    <p className="text-sm text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                    <p className="font-medium">{String(value)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
