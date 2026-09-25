import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnAdmin = nextUrl.pathname.startsWith('/admin');
      // ?mock=true shows fake captions for local demo prep without needing OAuth
      // set up — must never bypass login once this is actually deployed, or
      // anyone can reach the operator panel with a URL param.
      const isDemo = process.env.NODE_ENV !== 'production' && nextUrl.searchParams.get('mock') === 'true';

      if (isOnAdmin) {
        if (isLoggedIn || isDemo) return true;
        return false; // Redirects unauthenticated users to pages.signIn
      }
      return true;
    },
  },
  providers: [], // Configured with providers in auth.ts
} satisfies NextAuthConfig;
