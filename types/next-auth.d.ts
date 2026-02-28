import { DefaultSession, DefaultUser } from "next-auth"
import { ContextUser } from "."

declare module "next-auth" {
  interface Session {
    user: ContextUser & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    id: string
    email: string
    name: string
    imageUrl?: string
    role: "user" | "staff" | "admin"
    isVerified: boolean
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string
    role: string
    imageUrl?: string
  }
}