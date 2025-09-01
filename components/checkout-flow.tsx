"use client"

import { useState } from "react"
import { useCartStore } from "@/lib/cart-store"
import { getProductById } from "@/lib/product-data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { ShoppingBag, Info } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface CheckoutFormData {
  email: string
  firstName: string
  lastName: string
  address: string
  phoneNumber: string
  paymentMethod: string
  cardNumber: string
  expiryDate: string
  cvv: string
  nameOnCard: string
  billingAddress: string
  billingEmail: string
  billingFirstName: string
  billingLastName: string
  billingAddressLine: string
  billingPhoneNumber: string
  saveInfo: boolean
}

export function CheckoutFlow() {
  const { items, getTotalItems, getTotalPrice, clearCart } = useCartStore()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)
  const [formData, setFormData] = useState<CheckoutFormData>({
    email: "",
    firstName: "",
    lastName: "",
    address: "",
    phoneNumber: "",
    paymentMethod: "card",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    nameOnCard: "",
    billingAddress: "same",
    billingEmail: "",
    billingFirstName: "",
    billingLastName: "",
    billingAddressLine: "",
    billingPhoneNumber: "",
    saveInfo: false,
  })

  const subtotal = getTotalPrice()
  const shipping = 8.0
  const tax = 0.0
  const total = subtotal + shipping + tax

  const handlePlaceOrder = () => {
    // Placeholder for order placement logic
    setIsProcessing(true)
    setTimeout(() => {
      setIsProcessing(false)
      clearCart()
      router.push("/order-confirmation")
    }, 2000)
  }

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto min-h-[80vh] px-4 py-16">
        <div className="text-center">
          <ShoppingBag className="w-24 h-24 mx-auto text-muted-foreground mb-6" />
          <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
          <p className="text-muted-foreground mb-8">Add some items to your cart before checking out.</p>
          <Link href="/">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const handleInputChange = (field: keyof CheckoutFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleStepComplete = (step: number) => {
    if (step < 3) {
      setCurrentStep(step + 1)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 min-h-[80vh]">
      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-12">
        <div className="flex items-center space-x-4">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= step
                    ? "bg-primary text-primary-foreground"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {step}
              </div>
              {step < 3 && (
                <div
                  className={`w-16 h-1 mx-2 ${
                    currentStep > step ? "bg-primary" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Left Column - Checkout Form */}
        <div className="space-y-8">
          {/* Step 1: Shipping Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-medium">Shipping Information</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    placeholder="First Name"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    placeholder="Last Name"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Email"
                />
              </div>

              <div>
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                  placeholder="Phone Number"
                />
              </div>

              <div>
                <Label htmlFor="address">Shipping Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="Full Address"
                />
              </div>

              <Button
                onClick={() => handleStepComplete(1)}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={!formData.firstName || !formData.lastName || !formData.email || !formData.address}
              >
                Continue to Payment
              </Button>
            </div>
          )}

          {/* Step 2: Payment Information */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-medium">Payment Information</h2>
              
              <div>
                <Label htmlFor="cardNumber">Card Number</Label>
                <Input
                  id="cardNumber"
                  value={formData.cardNumber}
                  onChange={(e) => handleInputChange("cardNumber", e.target.value)}
                  placeholder="1234 5678 9012 3456"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="expiryDate">Expiry Date</Label>
                  <Input
                    id="expiryDate"
                    value={formData.expiryDate}
                    onChange={(e) => handleInputChange("expiryDate", e.target.value)}
                    placeholder="MM/YY"
                  />
                </div>
                <div>
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    value={formData.cvv}
                    onChange={(e) => handleInputChange("cvv", e.target.value)}
                    placeholder="123"
                  />
                </div>
                <div>
                  <Label htmlFor="nameOnCard">Name on Card</Label>
                  <Input
                    id="nameOnCard"
                    value={formData.nameOnCard}
                    onChange={(e) => handleInputChange("nameOnCard", e.target.value)}
                    placeholder="Full Name"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={() => handleStepComplete(2)}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={!formData.cardNumber || !formData.expiryDate || !formData.cvv || !formData.nameOnCard}
                >
                  Continue to Review
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Review and Place Order */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-medium">Review Your Order</h2>
              
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">Shipping Address</h3>
                  <p className="text-sm text-gray-600">
                    {formData.firstName} {formData.lastName}
                  </p>
                  <p className="text-sm text-gray-600">{formData.address}</p>
                  <p className="text-sm text-gray-600">{formData.email}</p>
                  <p className="text-sm text-gray-600">{formData.phoneNumber}</p>
                  <button className="text-sm text-blue-600 underline mt-2">
                    Edit
                  </button>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">Payment Method</h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                        <span className="text-sm font-medium">💳</span>
                      </div>
                      <span>Credit Card</span>
                    </div>
                    <button className="text-sm text-blue-600 underline">
                      Edit
                    </button>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p className="font-medium text-black">Card ending in {formData.cardNumber.slice(-4)}</p>
                    <p>{formData.nameOnCard}</p>
                  </div>
                </div>

                <p className="text-sm text-gray-600">
                  By placing your order, you agree to NV Mercantile's Privacy Policy and Terms of Use.
                </p>

                <Button
                  onClick={handlePlaceOrder}
                  disabled={isProcessing}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300"
                >
                  {isProcessing ? "Processing..." : "Place Order"}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Order Summary */}
        <div className="space-y-6">
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium">In Your Cart</h3>
              <Link href="/cart" className="text-sm underline">
                Edit
              </Link>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-sm">
                <span>
                  Subtotal <Info className="w-3 h-3 inline ml-1" />
                </span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Shipping</span>
                <span>${shipping.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>
                  Estimated Tax <Info className="w-3 h-3 inline ml-1" />
                </span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            <div className="text-sm text-gray-600 mb-6">Arrives by Mon, Sep 8</div>

            {/* Product Items */}
            <div className="space-y-4">
              {items.map((item) => {
                const product = getProductById(item.id)
                return (
                  <div key={item.id} className="flex gap-4">
                    <img
                      src={item.image || "/placeholder.svg"}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">${item.price.toFixed(2)}</h4>
                      <p className="text-sm">{item.name}</p>
                      <p className="text-sm text-gray-600">{product?.subtitle}</p>
                      <p className="text-sm text-gray-600">
                        Qty: {item.quantity}
                        {item.material && ` | Material: ${item.material}`}
                        {item.dimensions && ` | Dimensions: ${item.dimensions}`}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
