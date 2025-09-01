"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SearchBar } from "@/components/molecules/search-bar"
import { NavigationLink } from "@/components/molecules/navigation-link"
import { CartIcon } from "@/components/cart-icon"

const navigationItems = [
  { href: "/machined-parts", label: "Machined Parts" },
  { href: "/metalwork", label: "Metalwork" },
  { href: "/3d-prints", label: "3D Prints" },
  { href: "/custom-orders", label: "Custom Orders" },
]

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border">
      {/* Main header */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="text-2xl font-bold text-primary">NV MERCANTILE</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <NavigationLink key={item.href} href={item.href}>
                {item.label}
              </NavigationLink>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="hidden md:block relative">
              <SearchBar className="w-80" />
            </div>

            {/* Icons */}
            <CartIcon />

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-border py-4">
            <nav className="flex flex-col space-y-4">
              {navigationItems.map((item) => (
                <NavigationLink key={item.href} href={item.href}>
                  {item.label}
                </NavigationLink>
              ))}
              <SearchBar className="mt-4" />
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
