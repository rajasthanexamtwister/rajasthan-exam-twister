import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/server/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;

    if (req.nextUrl.searchParams.get("clear") === "true") {
      if (db) {
        await db.collection("auth_debug_logs").deleteMany({});
      }
      return NextResponse.json({ message: "Cleared logs" });
    }

    const logs = db
      ? await db
          .collection("auth_debug_logs")
          .find({})
          .sort({ timestamp: -1 })
          .limit(20)
          .toArray()
      : [];

    const rawSecret = process.env.GOOGLE_CLIENT_SECRET || "";
    const lines = rawSecret.split(/\r?\n|\s+/);
    const words = lines.map(w => ({
      starts: w.substring(0, 10),
      ends: w.substring(Math.max(0, w.length - 10)),
      len: w.length
    }));

    return NextResponse.json({
      environment: {
        nodeEnv: process.env.NODE_ENV,
        nextAuthUrl: process.env.NEXTAUTH_URL,
        googleClientIdPresent: !!process.env.GOOGLE_CLIENT_ID,
        googleClientIdPrefix: (process.env.GOOGLE_CLIENT_ID || "").substring(0, 15) + "...",
        rawSecretLength: rawSecret.length,
        secretTokens: words,
        nextAuthSecretPresent: !!process.env.NEXTAUTH_SECRET,
      },
      request: {
        host: req.headers.get("host"),
        xForwardedHost: req.headers.get("x-forwarded-host"),
        xForwardedProto: req.headers.get("x-forwarded-proto"),
        cookieNames: req.cookies.getAll().map((c) => c.name),
      },
      recentLogs: logs,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
