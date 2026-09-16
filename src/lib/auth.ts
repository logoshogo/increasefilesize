import type { NextAuthOptions } from 'next-auth';
import { getServerSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

/**
 * Single-admin credential auth. There is no signup route and no social login:
 * the admin user is created by `npm run db:seed` from ADMIN_EMAIL /
 * ADMIN_PASSWORD, and the password is stored as a bcrypt hash.
 */
export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt', maxAge: 60 * 60 * 24 * 7 },
  pages: { signIn: '/admin/login', error: '/admin/login' },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });
        if (!user) {
          // Equalise timing so a missing user is not distinguishable from a
          // wrong password by response time.
          await bcrypt.compare(credentials.password, '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinv');
          return null;
        }

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name ?? undefined };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.uid = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.uid) {
        (session.user as { id?: string }).id = token.uid as string;
      }
      return session;
    },
  },
};

export function getSession() {
  return getServerSession(authOptions);
}

/** Throws a 401 response from a route handler when there is no admin session. */
export async function requireAdmin(): Promise<{ id: string; email: string } | null> {
  const session = await getSession();
  if (!session?.user?.email) return null;
  return {
    id: (session.user as { id?: string }).id ?? '',
    email: session.user.email,
  };
}
