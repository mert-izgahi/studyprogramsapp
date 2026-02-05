import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { User } from "@/models/User"
import dbConnect from "@/lib/mongoose"

export const authOptions = {
    providers: [
        Credentials({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                try {
                    const { email, password } = credentials as {
                        email: string
                        password: string
                    }

                    if (!email || !password) {
                        return null
                    }

                    await dbConnect()

                    const user = await User.findOne({ email }).select('+password')

                    if (!user || !user.password || !user.isActive) {
                        return null
                    }

                    const isPasswordValid = await bcrypt.compare(password, user.password)

                    if (!isPasswordValid) {
                        return null
                    }

                    return {
                        id: user._id.toString(),
                        email: user.email,
                        name: `${user.firstName} ${user.lastName}`,
                        image: user.imageUrl, // Note: use 'image' not 'imageUrl'
                        role: user.role
                    }
                } catch (error) {
                    console.error("Authorization error:", error)
                    return null
                }
            }
        })
    ],
    session: {
        strategy: "jwt" as const,
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    callbacks: {
        async jwt({ token, user }: any) {
            if (user) {
                token.id = user.id
                token.role = user.role
                token.picture = user.image // Map image to picture
            }
            return token
        },
        async session({ session, token }: any) {
            if (token && session.user) {
                session.user.id = token.id as string
                session.user.role = token.role as string
                session.user.image = token.picture as string
            }
            return session
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
    pages: {
        signIn: "/sign-in",
        error: "/sign-in", // Add error page
    },
    debug: process.env.NODE_ENV === "development",
}

// Export handlers and auth function
export const { handlers, signIn, signOut, auth } = NextAuth(authOptions)