import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface ProductBadgeProps {
  type: "fast" | "top-rated" | "custom"
  className?: string
  children?: React.ReactNode
}

export function ProductBadge({ type, className, children }: ProductBadgeProps) {
  const getBadgeContent = () => {
    switch (type) {
      case "fast":
        return "Fast"
      case "top-rated":
        return "Top Rated"
      case "custom":
        return children
      default:
        return children
    }
  }

  const getBadgeVariant = () => {
    switch (type) {
      case "fast":
        return "default"
      case "top-rated":
        return "secondary"
      case "custom":
        return "outline"
      default:
        return "outline"
    }
  }

  return (
    <Badge
      variant={getBadgeVariant() as any}
      className={cn("text-xs px-2 py-1", className)}
    >
      {getBadgeContent()}
    </Badge>
  )
}
