"use client"

import { useCartStore } from "@/lib/cart-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { getProductById, getAllProducts } from "@/lib/product-data"

export function CartPage() {
  const { items, removeItem, updateQuantity, getTotalItems, getTotalPrice } = useCartStore()
  const [promoCode, setPromoCode] = useState("15EXTRA")
  const [isPromoExpanded, setIsPromoExpanded] = useState(false)

  const subtotal = getTotalPrice()
  const shipping = subtotal >= 50 ? 0 : 8.0
  const tax = 0 // Tax shown as "—" in the reference
  const total = subtotal + shipping + tax

  // Get recommended products (excluding items already in cart)
  const allProducts = getAllProducts()
  const cartProductIds = items.map((item) => item.id)
  const recommendedProducts = allProducts.filter((product) => !cartProductIds.includes(product.id)).slice(0, 4)

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
            <div className="w-12 h-12 border-2 border-gray-300 rounded"></div>
          </div>
          <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
          <p className="text-gray-600 mb-8">Looks like you haven't added anything to your cart yet.</p>
          <Link href="/">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8">
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 min-h-[100vh]">
      {/* Mobile Order Summary - Shown at top on mobile */}
      <div className="lg:hidden mb-8">
        <div className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-xl font-medium mb-4">Order Summary</h2>
          
          <div className="space-y-3 mb-4">
            <div className="flex justify-between">
              <span>Subtotal ({getTotalItems()} items)</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>{shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax</span>
              <span>—</span>
            </div>
          </div>

          <div className="border-t pt-3 mb-4">
            <div className="flex justify-between text-lg font-medium">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 mb-3" size="lg">
            <Link href="/checkout">Proceed to Checkout</Link>
          </Button>

          <Button variant="outline" className="w-full" size="lg">
            <Link href="/">Continue Shopping</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 xl:gap-12">
        {/* Left Side - Cart Items */}
        <div className="xl:col-span-2">
          <h1 className="text-2xl font-medium mb-8">Cart</h1>

          <div className="space-y-6">
            {items.map((item, index) => {
              const product = getProductById(item.id)
              return (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row gap-4 sm:gap-6 pb-6 sm:pb-8 border-b border-gray-200 animate-in slide-in-from-left duration-300"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Product Image */}
                  <div className="w-full sm:w-32 sm:h-32 h-48 sm:h-auto flex-shrink-0">
                    <img
                      src={item.image || "/placeholder.svg"}
                      alt={item.name}
                      className="w-full h-full object-cover rounded-lg hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4 mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-lg mb-1 break-words">{item.name}</h3>
                        <p className="text-gray-600 mb-2 text-sm sm:text-base">{product?.subtitle || item.category}</p>
                        {item.material && (
                          <p className="text-gray-600 mb-2 text-sm sm:text-base">Material: {item.material}</p>
                        )}
                        {item.dimensions && (
                          <p className="text-gray-600 text-sm sm:text-base">Dimensions: {item.dimensions}</p>
                        )}
                      </div>
                      <p className="font-medium text-lg text-right sm:text-left">${item.price.toFixed(2)}</p>
                    </div>

                    {/* Quantity and Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:bg-gray-100 transition-colors"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>

                        <div className="flex items-center gap-3">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-8 h-8 p-0 hover:bg-gray-100 transition-colors bg-transparent"
                            onClick={() =>
                              item.quantity > 1
                                ? updateQuantity(item.id, item.quantity - 1)
                                : removeItem(item.id)
                            }
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </Button>
                          <span className="text-lg font-medium w-12 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-8 h-8 p-0 hover:bg-gray-100 transition-colors bg-transparent"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="text-right sm:text-left">
                        <p className="font-medium text-lg">${(item.price * item.quantity).toFixed(2)}</p>
                        <p className="text-sm text-gray-500">${item.price.toFixed(2)} each</p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right Side - Order Summary (Desktop Only) */}
        <div className="hidden xl:block xl:col-span-1">
          <div className="sticky top-8">
            <h2 className="text-xl font-medium mb-6">Order Summary</h2>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between">
                <span>Subtotal ({getTotalItems()} items)</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>—</span>
              </div>
            </div>

            <div className="border-t pt-4 mb-6">
              <div className="flex justify-between text-lg font-medium">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Promo Code */}
            <div className="mb-6">
              <button
                onClick={() => setIsPromoExpanded(!isPromoExpanded)}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                {isPromoExpanded ? "Hide" : "Add"} Promo Code
              </button>
              {isPromoExpanded && (
                <div className="mt-2 flex gap-2">
                  <Input
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Enter promo code"
                    className="flex-1"
                  />
                  <Button size="sm" variant="outline">
                    Apply
                  </Button>
                </div>
              )}
            </div>

            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 mb-4" size="lg">
              <Link href="/checkout">Proceed to Checkout</Link>
            </Button>

            <Button variant="outline" className="w-full" size="lg">
              <Link href="/">Continue Shopping</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Recommended Products */}
      {recommendedProducts.length > 0 && (
        <div className="mt-12 sm:mt-16">
          <h2 className="text-xl sm:text-2xl font-medium mb-6 sm:mb-8">You Might Also Like</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {recommendedProducts.map((product) => (
              <div key={product.id} className="group cursor-pointer">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3">
                  <img
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <h3 className="font-medium text-sm group-hover:text-primary transition-colors mb-1 line-clamp-2">
                  {product.name}
                </h3>
                <p className="text-muted-foreground text-xs mb-2 line-clamp-1">{product.subtitle}</p>
                <p className="font-semibold text-sm">${product.price}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
