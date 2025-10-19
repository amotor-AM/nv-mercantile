export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
      <div className="space-y-4 text-sm leading-6 text-muted-foreground">
        <p>These Terms of Service govern your use of NV Mercantile's website and services.</p>
        <p>By using our services, you agree to these Terms.</p>
        <h2 className="text-xl font-semibold mt-6">Use of Services</h2>
        <p>You agree to use our services responsibly and comply with applicable laws.</p>
        <h2 className="text-xl font-semibold mt-6">Orders and Payments</h2>
        <p>All orders are subject to acceptance. Payments are processed securely via Stripe and PayPal.</p>
        <h2 className="text-xl font-semibold mt-6">Warranty and Liability</h2>
        <p>NV Mercantile provides products and services as-is subject to warranty terms outlined in your order.</p>
        <p>To contact us, email info@nvmercantile.com.</p>
      </div>
    </div>
  )
}