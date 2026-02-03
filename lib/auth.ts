import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { User } from "@/models/User"
import dbConnect from "@/lib/mongoose"

// Remove the MongoDB adapter and client connection if you're using Mongoose
// Since you're using Mongoose, you don't need the MongoDB adapter
// The adapter is for when you want NextAuth to handle user creation/sessions in MongoDB
// But you're handling authentication yourself with credentials provider

export const { handlers, signIn, signOut, auth } = NextAuth({
    // Remove the adapter line if you're only using credentials provider
    // adapter: MongoDBAdapter(clientPromise),

    providers: [
        Credentials({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
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
                    imageUrl: user.imageUrl,
                    role: user.role
                }
            }
        })
    ],
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async jwt({ token, user }: any) {
            if (user) {
                token.id = user.id
                token.role = user.role
                token.imageUrl = user.imageUrl
            }
            return token
        },
        async session({ session, token }: any) {
            if (token && session.user) {
                session.user.id = token.id as string
                session.user.role = token.role as string
                session.user.imageUrl = token.imageUrl as string
            }
            return session
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
    pages: {
        signIn: "/sign-in",
    },
})