"use client"

import { useEffect, useMemo, useState } from "react"
import { useCartStore } from "@/lib/cart-store"
import { getProductById } from "@/lib/product-data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ShoppingBag, Info } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js"
import { stripePromise } from "@/lib/stripe-client"
import { track } from "@vercel/analytics"

interface CheckoutFormData {
  email: string
  firstName: string
  lastName: string
  address: string
  phoneNumber: string
  paymentMethod: string
  saveInfo: boolean
}

function StripePaymentSection({ clientSecret }: { clientSecret: string | null }) {
  if (!clientSecret) {
    return <div className="text-sm text-muted-foreground">Initializing secure payment...</div>
  }
  return (
    <div className="border rounded-lg p-4">
      <PaymentElement />
    </div>
  )
}

function StripeReviewAndPlaceOrder(props: {
  orderId: string | null
  email: string
  firstName: string
  lastName: string
  address: string
  phoneNumber: string
  isProcessing: boolean
  onProcessing: (v: boolean) => void
  onSuccess: () => void
}) {
  const { orderId, isProcessing, onProcessing, onSuccess } = props
  const stripe = useStripe()
  const elements = useElements()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-medium">Review Your Order</h2>

      <div className="space-y-4">
        <div className="border rounded-lg p-4">
          <h3 className="font-medium mb-2">Payment</h3>
          <p className="text-sm text-muted-foreground">Your card will be securely charged via Stripe.</p>
        </div>

        {errorMessage && (
          <div className="text-sm text-destructive">
            {errorMessage}
          </div>
        )}

        <Button
          onClick={async () => {
            onProcessing(true)
            setErrorMessage(null)
            try {
              if (!orderId) throw new Error("Order not initialized")
              if (!stripe || !elements) throw new Error("Payment not ready")

              const return_url = `${process.env.NEXT_PUBLIC_BASE_URL}/order-confirmation?order=${orderId}`

              const result = await stripe.confirmPayment({
                elements,
                confirmParams: { return_url },
                redirect: "if_required",
              })

              if (result.error) {
                setErrorMessage(result.error.message || "Payment failed. Please try again.")
                onProcessing(false)
                return
              }

              onSuccess()
            } catch (e: any) {
              setErrorMessage(e.message || "Payment failed. Please try again.")
              onProcessing(false)
            }
          }}
          disabled={isProcessing || !stripe || !elements}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300"
        >
          {isProcessing ? "Processing..." : "Place Order"}
        </Button>
      </div>
    </div>
  )
}

export function CheckoutFlow() {
  const { items, getTotalPrice, clearCart } = useCartStore()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)
  const [formData, setFormData] = useState<CheckoutFormData>({
    email: "",
    firstName: "",
    lastName: "",
    address: "",
    phoneNumber: "",
    paymentMethod: "stripe",
    saveInfo: false,
  })

  const [orderId, setOrderId] = useState<string | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const subtotal = getTotalPrice()
  const shipping = 8.0
  const tax = 0.0
  const total = subtotal + shipping + tax

  // Analytics: begin checkout
  useEffect(() => {
    if (currentStep === 1) {
      try {
        track("begin_checkout", { value: total, currency: "USD", items: items.map(i => ({ id: i.id, qty: i.quantity, price: i.price })) })
      } catch {}
    }
  }, [currentStep, total, items])

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

  const createOrderAndPaymentIntent = async () => {
    // Create the order
    const orderRes = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: formData.email,
        items: items.map((i) => ({
          productId: i.id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
        })),
        shipping: {
          name: `${formData.firstName} ${formData.lastName}`,
          phone: formData.phoneNumber,
          address: formData.address,
        },
      }),
    })
    if (!orderRes.ok) throw new Error("Failed to create order")
    const order = await orderRes.json()
    setOrderId(order.id)
    track("create_order", { orderId: order.id, value: order.total / 100, currency: order.currency })

    // Create or update a PaymentIntent for Stripe
    const piRes = await fetch("/api/checkout/stripe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: order.id }),
    })
    if (!piRes.ok) throw new Error("Failed to initialize payment")
    const { clientSecret } = await piRes.json()
    setClientSecret(clientSecret)

    try {
      window.localStorage.setItem("nv-mercantile-email", formData.email)
    } catch {}
  }

  const handleStepComplete = async (step: number) => {
    if (step === 1) {
      setIsProcessing(true)
      try {
        await createOrderAndPaymentIntent()
        track("add_shipping_info", { orderId, email: formData.email })
        setCurrentStep(2)
      } catch (e) {
        console.error(e)
      } finally {
        setIsProcessing(false)
      }
      return
    }
    if (step < 3) {
      if (formData.paymentMethod === "stripe") {
        track("add_payment_info", { method: "stripe", orderId })
      } else {
        track("add_payment_info", { method: "paypal", orderId })
      }
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
                disabled={isProcessing || !formData.firstName || !formData.lastName || !formData.email || !formData.address}
              >
                {isProcessing ? "Preparing Payment..." : "Continue to Payment"}
              </Button>
            </div>
          )}

          {/* Steps 2 and 3 (Stripe or PayPal) */}
          {(currentStep === 2 || currentStep === 3) && (
            <>
              {formData.paymentMethod === "stripe" && clientSecret ? (
                <Elements
                  stripe={stripePromise}
                  options={{
                    clientSecret,
                    appearance: {
                      theme: "flat",
                      variables: {
                        colorPrimary: "hsl(0 0% 9%)",
                        colorBackground: "hsl(0 0% 100%)",
                        colorText: "hsl(0 0% 9%)",
                        borderRadius: "8px",
                        fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",
                      },
                    },
                  }}
                >
                  {currentStep === 2 && (
                    <div className="space-y-6">
                      <h2 className="text-2xl font-medium">Payment Information</h2>

                      <div className="space-y-3">
                        <Label>Payment Method</Label>
                        <div className="flex gap-3">
                          <button
                            className={`px-3 py-2 rounded border ${formData.paymentMethod === "stripe" ? "border-primary" : "border-gray-200"}`}
                            onClick={() => handleInputChange("paymentMethod", "stripe")}
                            type="button"
                          >
                            Stripe (Card)
                          </button>
                          <button
                            className={`px-3 py-2 rounded border ${formData.paymentMethod === "paypal" ? "border-primary" : "border-gray-200"}`}
                            onClick={() => handleInputChange("paymentMethod", "paypal")}
                            type="button"
                          >
                            PayPal
                          </button>
                        </div>
                      </div>

                      <div className="border rounded-lg p-4">
                        <PaymentElement />
                      </div>

                      <div className="flex gap-4">
                        <Button variant="outline" onClick={() => setCurrentStep(1)} className="flex-1">
                          Back
                        </Button>
                        <Button
                          onClick={() => handleStepComplete(2)}
                          className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          Continue to Review
                        </Button>
                      </div>
                    </div>
                  )}

                  {currentStep === 3 && (
                    <StripeReviewAndPlaceOrder
                      email={formData.email}
                      firstName={formData.firstName}
                      lastName={formData.lastName}
                      address={formData.address}
                      phoneNumber={formData.phoneNumber}
                      orderId={orderId}
                      isProcessing={isProcessing}
                      onProcessing={setIsProcessing}
                      onSuccess={() => {
                        clearCart()
                        router.push(`/order-confirmation?order=${orderId}`)
                      }}
                    />
                  )}
                </Elements>
              ) : (
                // PayPal or Stripe not yet initialized
                <>
                  {currentStep === 2 && (
                    <div className="space-y-6">
                      <h2 className="text-2xl font-medium">Payment Information</h2>

                      <div className="space-y-3">
                        <Label>Payment Method</Label>
                        <div className="flex gap-3">
                          <button
                            className={`px-3 py-2 rounded border ${formData.paymentMethod === "stripe" ? "border-primary" : "border-gray-200"}`}
                            onClick={() => handleInputChange("paymentMethod", "stripe")}
                            type="button"
                          >
                            Stripe (Card)
                          </button>
                          <button
                            className={`px-3 py-2 rounded border ${formData.paymentMethod === "paypal" ? "border-primary" : "border-gray-200"}`}
                            onClick={() => handleInputChange("paymentMethod", "paypal")}
                            type="button"
                          >
                            PayPal
                          </button>
                        </div>
                      </div>

                      <div className="text-sm text-muted-foreground">
                        You will be securely redirected to PayPal to complete your purchase.
                      </div>

                      <div className="flex gap-4">
                        <Button variant="outline" onClick={() => setCurrentStep(1)} className="flex-1">
                          Back
                        </Button>
                        <Button
                          onClick={() => handleStepComplete(2)}
                          className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          Continue to Review
                        </Button>
                      </div>
                    </div>
                  )}

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
                          <button className="text-sm text-blue-600 underline mt-2" onClick={() => setCurrentStep(1)}>
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
                              <span className="capitalize">{formData.paymentMethod}</span>
                            </div>
                            <button className="text-sm text-blue-600 underline" onClick={() => setCurrentStep(2)}>
                              Edit
                            </button>
                          </div>
                        </div>

                        <p className="text-sm text-gray-600">
                          By placing your order, you agree to NV Mercantile's Privacy Policy and Terms of Use.
                        </p>

                        <Button
                          onClick={async () => {
                            setIsProcessing(true)
                            try {
                              if (!orderId) throw new Error("Order not initialized")
                              // PayPal redirect
                              const p = await fetch("/api/checkout/paypal", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ orderId }),
                              })
                              if (p.ok) {
                                const data = await p.json()
                                if (data.approveUrl) {
                                  clearCart()
                                  window.location.href = data.approveUrl
                                  return
                                }
                              }
                              // Fallback
                              clearCart()
                              router.push(`/order-confirmation?order=${orderId}`)
                            } catch (e) {
                              console.error(e)
                            } finally {
                              setIsProcessing(false)
                            }
                          }}
                          disabled={isProcessing}
                          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300"
                        >
                          {isProcessing ? "Processing..." : "Place Order"}
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
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
