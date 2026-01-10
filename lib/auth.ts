import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Instagram from "next-auth/providers/instagram";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    
    Instagram({
      clientId: process.env.AUTH_INSTAGRAM_ID!,
      clientSecret: process.env.AUTH_INSTAGRAM_SECRET!,
    }),
  ],

  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },

  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
  },

  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },

    async signIn({ user, account, profile }) {
      // Allow sign in
      return true;
    },

    async redirect({ url, baseUrl }) {
      // Redirect to dashboard after sign in
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },

  events: {
    async createUser({ user }) {
      console.log("New user created:", user.id);
      // You can add custom logic here, e.g., send welcome email
    },

    async signIn({ user, account, profile, isNewUser }) {
      console.log("User signed in:", user.id);
    },

    async signOut({ token, session }) {
      console.log("User signed out");
    },
  },

  debug: process.env.NODE_ENV === "development",
});