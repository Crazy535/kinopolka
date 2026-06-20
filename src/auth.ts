import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) return null

          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
          })

          if (!user?.passwordHash) return null

          const valid = await bcrypt.compare(credentials.password as string, user.passwordHash)
          if (!valid) return null

          return { id: user.id, email: user.email, name: user.name }
        } catch (err) {
          console.error('[auth] authorize error:', err)
          return null
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id as string
      return token
    },
    session({ session, token }) {
      session.user.id = token.id as string
      if (token.email) session.user.email = token.email
      if (token.name) session.user.name = token.name
      return session
    },
  },
  pages: { signIn: '/login' },
})
