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
import { Elements, PaymentElement, useElements, useStripe, PaymentRequestButtonElement } from "@stripe/react-stripe-js"
import { stripePromise } from "@/lib/stripe-client"
import { track } from "@vercel/analytics"
import { csrfHeader } from "@/lib/csrf"
import Image from "next/image"
import { normalizeCountryCode } from "@/lib/utils"

interface CheckoutFormData {
  email: string
  firstName: string
  lastName: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  postalCode: string
  country: string
  lat?: number
  lng?: number
  phoneNumber: string
  paymentMethod: string
  saveInfo: boolean
}

function useGooglePlacesAutocomplete(setFormData: (updater: (prev: CheckoutFormData) => CheckoutFormData) => void) {
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) return

    function injectScript() {
      return new Promise<void>((resolve, reject) => {
        if (typeof window !== "undefined" && (window as any).google?.maps?.places) {
          resolve()
          return
        }
        const script = document.createElement("script")
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
        script.async = true
        script.onload = () => resolve()
        script.onerror = (e) => reject(e)
        document.head.appendChild(script)
      })
    }

    let autocomplete: any
    injectScript()
      .then(() => {
        const input = document.getElementById("addressLine1") as HTMLInputElement | null
        if (!input || !(window as any).google?.maps?.places) return
        const places = (window as any).google.maps.places
        autocomplete = new places.Autocomplete(input, {
          types: ["address"],
          fields: ["address_components", "geometry"],
        })
        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace()
          if (!place) return
          const comps = place.address_components || []
          const getComp = (type: string) => comps.find((c: any) => c.types.includes(type))
          const streetNumber = getComp("street_number")?.short_name || ""
          const route = getComp("route")?.short_name || ""
          const locality = getComp("locality")?.short_name || getComp("postal_town")?.short_name || ""
          const admin1 = getComp("administrative_area_level_1")?.short_name || ""
          const postal = getComp("postal_code")?.short_name || ""
          const country = getComp("country")?.short_name || "US"
          const geometry = place.geometry

          setFormData((prev) => ({
            ...prev,
            addressLine1: [streetNumber, route].filter(Boolean).join(" "),
            city: locality,
            state: admin1,
            postalCode: postal,
            country,
            lat: geometry?.location?.lat() ?? prev.lat,
            lng: geometry?.location?.lng() ?? prev.lng,
          }))
        })
      })
      .catch(() => {
        // ignore script load errors
      })

    return () => {
      // no cleanup needed for Google Autocomplete
    }
  }, [setFormData])
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

function PaymentRequestExpress({
  clientSecret,
  orderId,
  amount,
  country,
  currency,
  onSuccess,
}: {
  clientSecret: string
  orderId: string
  amount: number // cents
  country: string // ISO 3166-1 alpha-2
  currency: string // ISO currency code (e.g., "usd")
  onSuccess: () => void
}) {
  const stripe = useStripe()
  const [paymentRequest, setPaymentRequest] = useState<any>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let mounted = true
    async function init() {
      if (!stripe || !clientSecret) return
      const pr = stripe.paymentRequest({
        country,
        currency,
        total: { label: "NV Mercantile", amount },
        requestPayerEmail: true,
        requestPayerName: true,
      })
      const result = await pr.canMakePayment()
      if (result && mounted) {
        pr.on("paymentmethod", async (ev: any) => {
          try {
            const { error } = await stripe.confirmCardPayment(
              clientSecret,
              {
                payment_method: ev.paymentMethod.id,
              },
              { handleActions: true }
            )
            if (error) {
              ev.complete("fail")
              return
            }
            ev.complete("success")
            onSuccess()
          } catch (e) {
            ev.complete("fail")
          }
        })
        setPaymentRequest(pr)
        setReady(true)
      }
    }
    init()
    return () => {
      mounted = false
    }
  }, [stripe, clientSecret, amount, country, currency, onSuccess])

  if (!ready || !paymentRequest) return null

  return (
    <div className="border rounded-lg p-4">
      <div className="mb-3 text-sm text-muted-foreground">Or pay instantly</div>
      <PaymentRequestButtonElement options={{ paymentRequest }} />
    </div>
  )
}

function StripeReviewAndPlaceOrder(props: {
  orderId: string | null
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
          <div className="text-sm text-destructive" aria-live="polite">
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
          type="button"
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
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "US",
    phoneNumber: "",
    paymentMethod: "stripe",
    saveInfo: false,
  })
  useGooglePlacesAutocomplete((updater) => setFormData((prev) => updater(prev)))

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

  const isEmailValid = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const normalizedCountry = normalizeCountryCode(formData.country)

  const createOrderAndPaymentIntent = async () => {
    const orderRes = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...csrfHeader() },
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
          addressLine1: formData.addressLine1,
          addressLine2: formData.addressLine2,
          city: formData.city,
          state: formData.state,
          postalCode: formData.postalCode,
          country: normalizedCountry || formData.country,
          lat: formData.lat,
          lng: formData.lng,
        },
      }),
    })
    if (!orderRes.ok) throw new Error("Failed to create order")
    const order = await orderRes.json()
    setOrderId(order.id)
    track("create_order", { orderId: order.id, value: order.total / 100, currency: order.currency })

    // Create or update a PaymentIntent for Stripe (optional)
    try {
      const piRes = await fetch("/api/checkout/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...csrfHeader() },
        body: JSON.stringify({ orderId: order.id }),
      })
      if (piRes.ok) {
        const { clientSecret } = await piRes.json()
        setClientSecret(clientSecret)
      } else {
        setClientSecret(null)
      }
    } catch {
      setClientSecret(null)
    }

    try {
      window.localStorage.setItem("nv-mercantile-email", formData.email)
    } catch {}
  }

  const handleStepComplete = async (step: number) => {
    if (step === 1) {
      setIsProcessing(true)
      try {
        if (!isEmailValid(formData.email)) {
          throw new Error("Please enter a valid email address.")
        }
        if (!formData.firstName || !formData.lastName) {
          throw new Error("Please enter your name.")
        }
        if (!formData.addressLine1 || !formData.city || !formData.state || !formData.postalCode) {
          throw new Error("Please complete your shipping address.")
        }
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
        <div className="flex items-center space-x-4" role="group" aria-label="Checkout progress">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= step ? "bg-primary text-primary-foreground" : "bg-gray-200 text-gray-600"
                }`}
                aria-current={currentStep === step ? "step" : undefined}
              >
                {step}
              </div>
              {step < 3 && (
                <div className={`w-16 h-1 mx-2 ${currentStep > step ? "bg-primary" : "bg-gray-200"}`} aria-hidden="true" />
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
                    aria-invalid={!formData.firstName ? true : undefined}
                    aria-describedby="firstName-error"
                  />
                  {!formData.firstName && (
                    <p id="firstName-error" className="text-sm text-destructive mt-1" aria-live="polite">
                      Please enter your first name.
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    placeholder="Last Name"
                    aria-invalid={!formData.lastName ? true : undefined}
                    aria-describedby="lastName-error"
                  />
                  {!formData.lastName && (
                    <p id="lastName-error" className="text-sm text-destructive mt-1" aria-live="polite">
                      Please enter your last name.
                    </p>
                  )}
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
                  aria-invalid={!formData.email || !isEmailValid(formData.email) ? true : undefined}
                  aria-describedby="email-error"
                />
                {!isEmailValid(formData.email) && formData.email && (
                  <p id="email-error" className="text-sm text-destructive mt-1" aria-live="polite">
                    Please enter a valid email address.
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                  placeholder="Phone Number"
                  aria-invalid={!formData.phoneNumber ? true : undefined}
                />
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <Label htmlFor="addressLine1">Address Line 1</Label>
                  <Input
                    id="addressLine1"
                    value={formData.addressLine1}
                    onChange={(e) => handleInputChange("addressLine1", e.target.value)}
                    placeholder="Street address"
                    aria-invalid={!formData.addressLine1 ? true : undefined}
                    aria-describedby="addressLine1-error"
                  />
                  {!formData.addressLine1 && (
                    <p id="addressLine1-error" className="text-sm text-destructive mt-1" aria-live="polite">
                      Please enter your street address.
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="addressLine2">Address Line 2</Label>
                  <Input
                    id="addressLine2"
                    value={formData.addressLine2}
                    onChange={(e) => handleInputChange("addressLine2", e.target.value)}
                    placeholder="Apt, suite, unit (optional)"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange("city", e.target.value)}
                      aria-invalid={!formData.city ? true : undefined}
                      aria-describedby="city-error"
                    />
                    {!formData.city && (
                      <p id="city-error" className="text-sm text-destructive mt-1" aria-live="polite">
                        Please enter your city.
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => handleInputChange("state", e.target.value)}
                      aria-invalid={!formData.state ? true : undefined}
                      aria-describedby="state-error"
                    />
                    {!formData.state && (
                      <p id="state-error" className="text-sm text-destructive mt-1" aria-live="polite">
                        Please enter your state or region.
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      id="postalCode"
                      value={formData.postalCode}
                      onChange={(e) => handleInputChange("postalCode", e.target.value)}
                      aria-invalid={!formData.postalCode ? true : undefined}
                      aria-describedby="postalCode-error"
                    />
                    {!formData.postalCode && (
                      <p id="postalCode-error" className="text-sm text-destructive mt-1" aria-live="polite">
                        Please enter your postal code.
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => handleInputChange("country", e.target.value)}
                    onBlur={() => {
                      const normalized = normalizeCountryCode(formData.country)
                      if (normalized) {
                        setFormData((prev) => ({ ...prev, country: normalized }))
                      }
                    }}
                    aria-describedby="country-error"
                  />
                  {formData.country && !normalizedCountry && (
                    <p id="country-error" className="text-sm text-destructive mt-1" aria-live="polite">
                      Country should be a 2-letter code (e.g., US, GB) or a recognizable country name.
                    </p>
                  )}
                </div>
              </div>

              <Button
                onClick={() => handleStepComplete(1)}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={
                  isProcessing ||
                  !formData.firstName ||
                  !formData.lastName ||
                  !formData.email ||
                  !isEmailValid(formData.email) ||
                  !formData.addressLine1 ||
                  !formData.city ||
                  !formData.state ||
                  !formData.postalCode
                }
                type="button"
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
                        <div className="flex gap-3" role="radiogroup" aria-label="Select payment method">
                          <button
                            className={`px-3 py-2 rounded border ${formData.paymentMethod === "stripe" ? "border-primary" : "border-gray-200"}`}
                            onClick={() => handleInputChange("paymentMethod", "stripe")}
                            type="button"
                            aria-pressed={formData.paymentMethod === "stripe"}
                          >
                            Stripe (Card)
                          </button>
                          <button
                            className={`px-3 py-2 rounded border ${formData.paymentMethod === "paypal" ? "border-primary" : "border-gray-200"}`}
                            onClick={() => handleInputChange("paymentMethod", "paypal")}
                            type="button"
                            aria-pressed={formData.paymentMethod === "paypal"}
                          >
                            PayPal
                          </button>
                        </div>
                      </div>

                      {orderId && clientSecret ? (
                        <PaymentRequestExpress
                          clientSecret={clientSecret}
                          orderId={orderId}
                          amount={Math.round(total * 100)}
                          country={normalizedCountry || "US"}
                          currency={"usd"}
                          onSuccess={() => {
                            clearCart()
                            router.push(`/order-confirmation?order=${orderId}`)
                          }}
                        />
                      ) : null}

                      <div className="border rounded-lg p-4">
                        <PaymentElement />
                      </div>

                      <div className="flex gap-4">
                        <Button variant="outline" onClick={() => setCurrentStep(1)} className="flex-1" type="button">
                          Back
                        </Button>
                        <Button
                          onClick={() => handleStepComplete(2)}
                          className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                          type="button"
                        >
                          Continue to Review
                        </Button>
                      </div>
                    </div>
                  )}

                  {currentStep === 3 && (
                    <StripeReviewAndPlaceOrder
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
                   <<div className="space-y-6">
                     <<h2 className="text-2xl font-medium">Payment Informati</</h2>

                      {providerError &&pace-y-3">
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
                        <Button variant="outline" onClick={() => setCurrentStep(1)} className="flex-1" type="button">
                          Back
                        </Button>
                        <Button
                          onClick={() => handleStepComplete(2)}
                          className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                          type="button"
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
                          <p className="text-sm text-gray-600">
                            {formData.addressLine1}
                            {formData.addressLine2 ? `, ${formData.addressLine2}` : ""}
                          </p>
                          <p className="text-sm text-gray-600">
                            {formData.city}, {formData.state} {formData.postalCode} {formData.country}
                          </p>
                          <p className="text-sm text-gray-600">{formData.email}</p>
                          <p className="text-sm text-gray-600">{formData.phoneNumber}</p>
                          <button className="text-sm text-blue-600 underline mt-2" onClick={() => setCurrentStep(1)} type="button">
                            Edit
                          </button>
                        </div>

                        <div className="border rounded-lg p-4">
                          <h3 className="font-medium mb-2">Payment Method</h3>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center" aria-hidden="true">
                                <span className="text-sm font-medium">💳</span>
                              </div>
                              <span className="capitalize">{formData.paymentMethod}</span>
                            </div>
                            <button className="text-sm text-blue-600 underline" onClick={() => setCurrentStep(2)} type="button">
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
                                headers: { "Content-Type": "application/json", ...csrfHeader() },
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
                          type="button"
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
                    <Image
                      src={item.image || "/placeholder.svg"}
                      alt={item.name}
                      width={80}
                      height={80}
                      className="object-cover rounded"
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
