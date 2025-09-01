import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { CheckoutFlow } from "@/components/checkout-flow"

export default function CheckoutPage() {
  return (
    <main className="min-h-screen">
      <Header />
      <CheckoutFlow />
      <Footer />
    </main>
  )
}
