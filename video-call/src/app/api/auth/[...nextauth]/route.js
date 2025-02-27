import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email.endsWith("@gmail.com")) {
        return false; // Reject non-Gmail users
      }
      return true;
    },
  },
};

// ✅ Fix: Use named exports for HTTP methods
export const GET = NextAuth(authOptions);
export const POST = NextAuth(authOptions);
