"use client"

import { useState } from "react"
import useSWR from "swr"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SearchBar } from "@/components/molecules/search-bar"
import { NavigationLink } from "@/components/molecules/navigation-link"
import { CartIcon } from "@/components/cart-icon"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { data: navItems } = useSWR("/api/navigation?location=HEADER", fetcher)
  const navigationItems = (navItems ?? []) as Array<{ id: string; url: string; label: string }>

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
              <NavigationLink key={item.id} href={item.url}>
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
                <NavigationLink key={item.id} href={item.url}>
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
