import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user?: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role?: "ADMIN" | "CUSTOMER"
    }
  }

  interface User {
    id: string
    role?: "ADMIN" | "CUSTOMER"
  }
}