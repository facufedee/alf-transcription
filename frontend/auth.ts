import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { authConfig } from '@/auth.config';

const getAdminEmails = (): string[] => {
  const raw = process.env.ADMIN_EMAILS || '';
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
};

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    signIn({ user }) {
      const email = user.email?.toLowerCase();
      if (!email) return false;

      const adminEmails = getAdminEmails();
      if (adminEmails.length > 0 && !adminEmails.includes(email)) {
        return false;
      }
      return true;
    },
    jwt({ token, user }) {
      if (user?.email) {
        token.email = user.email;
        token.role = 'operator';
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.email) {
        session.user.email = token.email as string;
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
});
