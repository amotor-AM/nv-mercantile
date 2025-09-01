"use client"

import { useCartStore } from "@/lib/cart-store"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingBag } from "lucide-react"
import Link from "next/link"

export function CartIcon() {
  const { getTotalItems } = useCartStore()
  const totalItems = getTotalItems()

  return (
    <Button variant="ghost" size="icon" className="relative" asChild>
      <Link href="/cart">
        <ShoppingBag className="w-5 h-5" />
        {totalItems > 0 && (
          <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
            {totalItems}
          </Badge>
        )}
      </Link>
    </Button>
  )
}
