import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Student } from "@/server/models/Student";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || "ret_student_nextauth_secret_fallback_key",
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        try {
          await connectToDatabase();
          await Student.findOneAndUpdate(
            { email: user.email.toLowerCase() },
            {
              $set: {
                googleId: account.providerAccountId,
                name: user.name || "Student",
                avatarUrl: user.image || undefined,
                email: user.email.toLowerCase(),
              },
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );
          return true;
        } catch (err) {
          console.error("Failed to sync student during Google signIn:", err);
          return true;
        }
      }
      return true;
    },
    async jwt({ token }) {
      if (token?.email) {
        try {
          await connectToDatabase();
          const student = await Student.findOne({ email: token.email.toLowerCase() }).lean();
          if (student) {
            token.studentId = student._id.toString();
          }
        } catch (err) {
          console.error("Failed to lookup studentId in jwt callback:", err);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user && token?.studentId) {
        (session.user as any).id = token.studentId;
      }
      return session;
    },
  },
};
