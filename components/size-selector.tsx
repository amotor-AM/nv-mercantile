"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface SizeSelectorProps {
  sizes: string[]
  selectedSize: string
  onSizeSelect: (size: string) => void
}

export function SizeSelector({ sizes, selectedSize, onSizeSelect }: SizeSelectorProps) {
  // Mock availability - in real app this would come from inventory
  const unavailableSizes = ["6", "13"] // Example unavailable sizes

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Size</h3>
        <Button variant="link" className="text-sm p-0 h-auto">
          Size Guide
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-4">
        {sizes.map((size) => {
          const isUnavailable = unavailableSizes.includes(size)
          const isSelected = selectedSize === size

          return (
            <Button
              key={size}
              variant={isSelected ? "default" : "outline"}
              className={`h-12 ${isUnavailable ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={() => !isUnavailable && onSizeSelect(size)}
              disabled={isUnavailable}
            >
              {size}
              {isUnavailable && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="w-full h-0.5 bg-muted-foreground rotate-45" />
                </span>
              )}
            </Button>
          )
        })}
      </div>

      {!selectedSize && <p className="text-sm text-muted-foreground">Please select a size</p>}

      {selectedSize && (
        <div className="flex items-center gap-2">
          <Badge variant="outline">Selected: {selectedSize}</Badge>
        </div>
      )}
    </div>
  )
}
