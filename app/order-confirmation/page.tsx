import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { OrderConfirmation } from "@/components/order-confirmation"

export default function OrderConfirmationPage() {
  return (
    <main className="min-h-screen">
      <Header />
      <OrderConfirmation />
      <Footer />
    </main>
  )
}
