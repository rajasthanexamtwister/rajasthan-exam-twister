import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Student } from "@/server/models/Student";

const isProduction = process.env.NODE_ENV === "production";

async function logAuthDiagnostic(type: "error" | "warn" | "debug", code: string, metadata: any) {
  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (db) {
      await db.collection("auth_debug_logs").insertOne({
        type,
        code,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata, Object.getOwnPropertyNames(metadata))) : null,
        timestamp: new Date(),
      });
    }
  } catch {
    // Ignore logging failures
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: (process.env.GOOGLE_CLIENT_ID || "").trim(),
      clientSecret: (process.env.GOOGLE_CLIENT_SECRET || "").trim(),
      checks: ["state"],
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: (process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || "ret_student_nextauth_secret_fallback_key").trim(),
  useSecureCookies: isProduction,
  debug: true,
  logger: {
    error(code, metadata) {
      console.error("[NextAuth Error]", code, metadata);
      logAuthDiagnostic("error", code, metadata);
    },
    warn(code) {
      console.warn("[NextAuth Warn]", code);
    },
    debug(code, metadata) {
      console.log("[NextAuth Debug]", code, metadata);
    },
  },
  callbacks: {
    async signIn({ user, account, profile }) {
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
          return true; // Still allow login even if background sync has DB blip
        }
      }
      return true;
    },
    async jwt({ token, user }) {
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
