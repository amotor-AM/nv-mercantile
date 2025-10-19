export default function CookiesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Cookie Policy</h1>
      <div className="space-y-4 text-sm leading-6 text-muted-foreground">
        <p>We use cookies to operate our site and enhance your experience.</p>
        <h2 className="text-xl font-semibold mt-6">Types of Cookies</h2>
        <ul className="list-disc pl-5">
          <li>Essential cookies for site functionality.</li>
          <li>Preference cookies to remember settings.</li>
          <li>Analytics cookies (Google Analytics) only when you consent.</li>
        </ul>
        <h2 className="text-xl font-semibold mt-6">Managing Consent</h2>
        <p>You can accept or decline analytics cookies via the consent banner.</p>
      </div>
    </div>
  )
}