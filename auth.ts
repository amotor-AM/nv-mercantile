import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
import Google from "next-auth/providers/google"
import Email from "next-auth/providers/email"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./lib/db"
import { sendSignInEmail } from "./lib/email"

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || "",
  session: {
    strategy: "database",
  },
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID || "",
      clientSecret: process.env.GITHUB_SECRET || "",
    }),
    Google({
      clientId: process.env.GOOGLE_ID || "",
      clientSecret: process.env.GOOGLE_SECRET || "",
    }),
    Email({
      async sendVerificationRequest(params) {
        const { identifier, url } = params
        await sendSignInEmail(identifier, url)
      },
    }),
  ],
  callbacks: {
    session: async ({ session, user }) => {
      if (session.user) {
        ;(session.user as any).id = user.id
        ;(session.user as any).role = (user as any).role ?? "CUSTOMER"
        ;(session.user as any).twoFactorEnabled = !!(user as any).twoFactorEnabled
      }
      return session
    },
  },
  events: {
    // Make the first user to sign in an admin for initial bootstrap
    signIn: async ({ user }) => {
      const adminCount = await prisma.user.count({ where: { role: "ADMIN" } })
      if (adminCount === 0) {
        await prisma.user.update({ where: { id: user.id }, data: { role: "ADMIN" } })
      }
    },
  },
  trustHost: true,
})

export type AuthUser = Awaited<ReturnType<typeof auth>> extends { user: infer U } ? U : never