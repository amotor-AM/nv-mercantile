"use client"

import { Button } from "@/components/ui/button"
import { CheckCircle, Truck, Mail, Download } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

export function OrderConfirmation() {
  const [isVisible, setIsVisible] = useState(false)

  // Mock order data - in real app this would come from the order API
  const orderNumber = "NK" + Math.random().toString(36).substr(2, 9).toUpperCase()
  const estimatedDelivery = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="relative min-h-screen bg-white">
      <div
        className={`max-w-2xl mx-auto px-6 py-20 transition-all duration-1000 ease-out ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <div className="text-center mb-16">
          <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-black mb-6 tracking-tight">Order Confirmed</h1>
          <p className="text-xl text-gray-600 mb-4">Thanks for choosing Nike</p>
          <p className="text-gray-500 text-lg">
            Order <span className="font-semibold text-black">#{orderNumber}</span>
          </p>
        </div>

        <div className="bg-gray-50 rounded-none p-8 mb-12">
          <div className="space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-gray-200">
              <span className="text-gray-600">Order Date</span>
              <span className="font-medium">{new Date().toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-gray-200">
              <span className="text-gray-600">Payment</span>
              <span className="font-medium">Card ending in 3456</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-gray-200">
              <span className="text-gray-600">Estimated Delivery</span>
              <span className="font-medium">{estimatedDelivery}</span>
            </div>
            <div className="flex justify-between items-center text-lg">
              <span className="font-semibold">Total</span>
              <span className="font-bold">$53.00</span>
            </div>
          </div>
        </div>

        <div className="mb-12">
          <h3 className="text-xl font-semibold mb-6">Shipping Address</h3>
          <div className="text-gray-600 space-y-1">
            <p className="font-medium text-black">John Doe</p>
            <p>123 Main Street</p>
            <p>Apartment 4B</p>
            <p>New York, NY 10001</p>
          </div>
        </div>

        <div className="mb-12">
          <h3 className="text-xl font-semibold mb-6">Order Status</h3>
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-3 h-3 bg-black rounded-full"></div>
              <div>
                <p className="font-medium">Order Confirmed</p>
                <p className="text-sm text-gray-500">We've received your order</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
              <div>
                <p className="font-medium text-gray-500">Processing</p>
                <p className="text-sm text-gray-400">We're preparing your order</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
              <div>
                <p className="font-medium text-gray-500">Shipped</p>
                <p className="text-sm text-gray-400">Your order is on the way</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-12">
          <h3 className="text-xl font-semibold mb-6">What's Next?</h3>
          <div className="space-y-4 text-gray-600">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-black mt-0.5 flex-shrink-0" />
              <p>We've sent a confirmation email with your order details</p>
            </div>
            <div className="flex items-start gap-3">
              <Truck className="w-5 h-5 text-black mt-0.5 flex-shrink-0" />
              <p>You'll receive tracking information once your order ships</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-12">
          <Button
            variant="outline"
            size="lg"
            className="flex-1 border-black text-black hover:bg-black hover:text-white transition-colors duration-200 bg-transparent"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Receipt
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="flex-1 border-black text-black hover:bg-black hover:text-white transition-colors duration-200 bg-transparent"
          >
            Track Order
          </Button>
        </div>

        <div className="text-center">
          <Link href="/">
            <Button
              size="lg"
              className="bg-black hover:bg-gray-800 text-white px-12 py-4 text-lg font-medium transition-colors duration-200"
            >
              Continue Shopping
            </Button>
          </Link>
        </div>

        <div className="text-center mt-16 pt-8 border-t border-gray-200">
          <p className="text-gray-500 mb-4">Need help with your order?</p>
          <div className="flex justify-center gap-6">
            <button className="text-black hover:text-gray-600 transition-colors underline">Contact Support</button>
            <button className="text-black hover:text-gray-600 transition-colors underline">Return Policy</button>
          </div>
        </div>
      </div>
    </div>
  )
}
