import { DefaultSession, DefaultUser } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      imageUrl?: string
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    role: string
    imageUrl?: string
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string
    role: string
    imageUrl?: string
  }
}