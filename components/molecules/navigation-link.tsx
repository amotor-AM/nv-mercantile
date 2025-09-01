import Link from "next/link"
import { cn } from "@/lib/utils"

interface NavigationLinkProps {
  href: string
  children: React.ReactNode
  className?: string
  active?: boolean
}

export function NavigationLink({ href, children, className, active }: NavigationLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "font-medium transition-colors hover:text-primary",
        active && "text-primary",
        className
      )}
    >
      {children}
    </Link>
  )
}
