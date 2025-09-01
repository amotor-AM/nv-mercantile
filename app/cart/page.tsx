import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { CartPage } from "@/components/cart-page"

export default function Cart() {
  return (
    <main className="min-h-screen">
      <Header />
      <CartPage />
      <Footer />
    </main>
  )
}
