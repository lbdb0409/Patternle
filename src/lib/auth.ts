import { NextAuthOptions, getServerSession } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { db } from './db';

const isDev = process.env.NODE_ENV === 'development';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db) as NextAuthOptions['adapter'],
  providers: [
    // Email + Password authentication
    CredentialsProvider({
      id: 'credentials',
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter your email and password');
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          throw new Error('No account found with this email');
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error('Invalid password');
        }

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
    // Google OAuth
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;

        // Fetch subscription status
        const subscription = await db.subscription.findUnique({
          where: { userId: token.id as string },
        });

        session.user.isSubscribed = !!(
          subscription?.status === 'active' &&
          subscription.currentPeriodEnd &&
          subscription.currentPeriodEnd > new Date()
        );
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    verifyRequest: '/auth/verify-request',
    error: '/auth/error',
  },
  debug: process.env.NODE_ENV === 'development',
};

/**
 * Gets the current session on the server.
 */
export async function getSession() {
  return await getServerSession(authOptions);
}

/**
 * Gets the current user from the session.
 */
export async function getCurrentUser() {
  const session = await getSession();
  if (!session?.user?.id) {
    return null;
  }
  return db.user.findUnique({
    where: { id: session.user.id },
    include: { subscription: true },
  });
}

/**
 * Checks if the current user has an active subscription.
 * In development mode, all signed-in users are treated as subscribed.
 */
export async function isSubscribed(): Promise<boolean> {
  const session = await getSession();
  if (!session?.user?.id) {
    return false;
  }

  // In dev mode, all signed-in users are subscribed
  if (isDev && process.env.DEV_BYPASS_SUBSCRIPTION === 'true') {
    return true;
  }

  const user = await getCurrentUser();
  if (!user?.subscription) {
    return false;
  }
  return (
    user.subscription.status === 'active' &&
    user.subscription.currentPeriodEnd !== null &&
    user.subscription.currentPeriodEnd > new Date()
  );
}

/**
 * Checks if the current user is an admin.
 */
export async function isAdmin(): Promise<boolean> {
  const session = await getSession();
  if (!session?.user?.email) {
    return false;
  }
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map((e) => e.trim().toLowerCase());
  return adminEmails.includes(session.user.email.toLowerCase());
}

// Type augmentation for NextAuth
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      isSubscribed?: boolean;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
  }
}
