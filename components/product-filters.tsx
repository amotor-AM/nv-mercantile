"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"

interface ProductFiltersProps {
  activeFilters?: {
    material: string[]
    priceRange: [number, number]
    leadTime: string[]
    applications: string[]
    tolerance: string[]
  }
  onFilterChange?: (filterType: string, value: any) => void
  onClearAll?: () => void
  isMobile?: boolean
}

export function ProductFilters({ 
  activeFilters: externalActiveFilters, 
  onFilterChange: externalOnFilterChange, 
  onClearAll: externalOnClearAll, 
  isMobile = false 
}: ProductFiltersProps) {
  // Local state for when component is used independently
  const [localActiveFilters, setLocalActiveFilters] = useState({
    material: [] as string[],
    priceRange: [0, 1000] as [number, number],
    leadTime: [] as string[],
    applications: [] as string[],
    tolerance: [] as string[]
  })

  // Use external state if provided, otherwise use local state
  const activeFilters = externalActiveFilters || localActiveFilters
  const onFilterChange = externalOnFilterChange || ((filterType: string, value: any) => {
    setLocalActiveFilters(prev => ({
      ...prev,
      [filterType]: value
    }))
  })
  const onClearAll = externalOnClearAll || (() => {
    setLocalActiveFilters({
      material: [],
      priceRange: [0, 1000],
      leadTime: [],
      applications: [],
      tolerance: []
    })
  })

  const [localPriceRange, setLocalPriceRange] = useState(activeFilters.priceRange)

  // Update local price range when activeFilters change
  useEffect(() => {
    setLocalPriceRange(activeFilters.priceRange)
  }, [activeFilters.priceRange])

  const materials = [
    "Aluminum", "Titanium", "Stainless Steel", "Brass", "Steel", 
    "Nylon", "ABS", "PETG", "PLA", "Carbon Fiber"
  ]

  const leadTimes = [
    "1-2 weeks", "2-3 weeks", "3-4 weeks", "4+ weeks"
  ]

  const applications = [
    "Aerospace", "Medical", "Industrial", "Automotive", 
    "Architectural", "Prototyping", "Construction", "Robotics"
  ]

  const tolerances = [
    "High Precision (±0.001\")", "Standard (±0.005\")", "General (±0.01\")"
  ]

  const handlePriceChange = (value: number[]) => {
    setLocalPriceRange([value[0], value[1]])
  }

  const handlePriceCommit = (value: number[]) => {
    onFilterChange("priceRange", [value[0], value[1]])
  }

  const handleCheckboxChange = (filterType: string, value: string, checked: boolean) => {
    const currentFilters = activeFilters[filterType as keyof typeof activeFilters] as string[]
    if (checked) {
      onFilterChange(filterType, [...currentFilters, value])
    } else {
      onFilterChange(filterType, currentFilters.filter(item => item !== value))
    }
  }

  const removeFilter = (filterType: string, value: string) => {
    const currentFilters = activeFilters[filterType as keyof typeof activeFilters] as string[]
    onFilterChange(filterType, currentFilters.filter(item => item !== value))
  }

  const hasActiveFilters = Object.values(activeFilters).some(filter => 
    Array.isArray(filter) ? filter.length > 0 : false
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Filters</h3>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClearAll}>
            Clear All
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Active Filters:</p>
          <div className="flex flex-wrap gap-2">
            {activeFilters.material.map(material => (
              <Badge key={`material-${material}`} variant="secondary" className="gap-1">
                {material}
                <button
                  onClick={() => removeFilter("material", material)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
            {activeFilters.leadTime.map(leadTime => (
              <Badge key={`leadTime-${leadTime}`} variant="secondary" className="gap-1">
                {leadTime}
                <button
                  onClick={() => removeFilter("leadTime", leadTime)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
            {activeFilters.applications.map(app => (
              <Badge key={`app-${app}`} variant="secondary" className="gap-1">
                {app}
                <button
                  onClick={() => removeFilter("applications", app)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
            {activeFilters.tolerance.map(tol => (
              <Badge key={`tolerance-${tol}`} variant="secondary" className="gap-1">
                {tol}
                <button
                  onClick={() => removeFilter("tolerance", tol)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Price Range */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Price Range</Label>
        <div className="px-2">
          <Slider
            value={localPriceRange}
            onValueChange={handlePriceChange}
            onValueCommit={handlePriceCommit}
            max={1000}
            min={0}
            step={25}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>${localPriceRange[0]}</span>
            <span>${localPriceRange[1]}</span>
          </div>
        </div>
      </div>

      {/* Material */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Material</Label>
        <div className="space-y-2">
          {materials.map((material) => (
            <div key={material} className="flex items-center space-x-2">
              <Checkbox
                id={`material-${material}`}
                checked={activeFilters.material.includes(material)}
                onCheckedChange={(checked) => 
                  handleCheckboxChange("material", material, checked as boolean)
                }
              />
              <Label htmlFor={`material-${material}`} className="text-sm">
                {material}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Lead Time */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Lead Time</Label>
        <div className="space-y-2">
          {leadTimes.map((leadTime) => (
            <div key={leadTime} className="flex items-center space-x-2">
              <Checkbox
                id={`leadTime-${leadTime}`}
                checked={activeFilters.leadTime.includes(leadTime)}
                onCheckedChange={(checked) => 
                  handleCheckboxChange("leadTime", leadTime, checked as boolean)
                }
              />
              <Label htmlFor={`leadTime-${leadTime}`} className="text-sm">
                {leadTime}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Applications */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Applications</Label>
        <div className="space-y-2">
          {applications.map((app) => (
            <div key={app} className="flex items-center space-x-2">
              <Checkbox
                id={`app-${app}`}
                checked={activeFilters.applications.includes(app)}
                onCheckedChange={(checked) => 
                  handleCheckboxChange("applications", app, checked as boolean)
                }
              />
              <Label htmlFor={`app-${app}`} className="text-sm">
                {app}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Tolerance */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Tolerance</Label>
        <div className="space-y-2">
          {tolerances.map((tolerance) => (
            <div key={tolerance} className="flex items-center space-x-2">
              <Checkbox
                id={`tolerance-${tolerance}`}
                checked={activeFilters.tolerance.includes(tolerance)}
                onCheckedChange={(checked) => 
                  handleCheckboxChange("tolerance", tolerance, checked as boolean)
                }
              />
              <Label htmlFor={`tolerance-${tolerance}`} className="text-sm">
                {tolerance}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
