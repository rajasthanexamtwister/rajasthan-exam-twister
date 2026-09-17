import { connectToDatabase } from "@/server/lib/mongodb";
import { Presence } from "@/server/models/Presence";

export interface HeartbeatOptions {
  sessionId: string;
  currentPath?: string;
  userAgent?: string;
}

export interface PathDistribution {
  path: string;
  count: number;
}

export interface PresenceSummary {
  activeUsers: number;
  paths: PathDistribution[];
  updatedAt: string;
}

const BOT_USER_AGENT_REGEX =
  /bot|crawler|spider|slurp|facebookexternalhit|whatsapp|preview|curl|wget|python-requests/i;

export class PresenceService {
  /**
   * Check if a User-Agent belongs to a known bot or crawler.
   */
  static isBot(userAgent?: string): boolean {
    if (!userAgent) return false;
    return BOT_USER_AGENT_REGEX.test(userAgent);
  }

  /**
   * Sanitize currentPath input for privacy and grouping.
   */
  static sanitizePath(rawPath?: string): string {
    if (!rawPath || typeof rawPath !== "string") return "/";
    let clean = rawPath.trim();
    if (!clean.startsWith("/")) clean = "/" + clean;
    // Strip query strings and hashes
    clean = clean.split("?")[0].split("#")[0];
    if (clean.length > 200) clean = clean.substring(0, 200);
    return clean || "/";
  }

  /**
   * Record or update an anonymous visitor's presence heartbeat.
   */
  static async recordHeartbeat({
    sessionId,
    currentPath = "/",
    userAgent = "",
  }: HeartbeatOptions): Promise<{ recorded: boolean; reason?: string }> {
    if (!sessionId || typeof sessionId !== "string") {
      return { recorded: false, reason: "invalid_session_id" };
    }

    if (this.isBot(userAgent)) {
      return { recorded: false, reason: "bot_ignored" };
    }

    const cleanPath = this.sanitizePath(currentPath);

    // Ignore admin paths from visitor presence count
    if (cleanPath.startsWith("/admin")) {
      return { recorded: false, reason: "admin_path_ignored" };
    }

    await connectToDatabase();

    const now = new Date();
    await Presence.findOneAndUpdate(
      { sessionId },
      {
        $set: {
          currentPath: cleanPath,
          lastSeenAt: now,
        },
        $setOnInsert: {
          sessionId,
          firstSeenAt: now,
        },
      },
      { upsert: true, new: true }
    );

    return { recorded: true };
  }

  /**
   * Query active visitor summary within the specified time window (default: 90s).
   */
  static async getActivePresence(windowSeconds = 90): Promise<PresenceSummary> {
    await connectToDatabase();

    const cutoff = new Date(Date.now() - windowSeconds * 1000);

    const activeRecords = await Presence.find({
      lastSeenAt: { $gte: cutoff },
    })
      .select("sessionId currentPath lastSeenAt")
      .lean();

    const activeUsers = activeRecords.length;

    // Aggregate active users by currentPath
    const pathMap = new Map<string, number>();
    for (const record of activeRecords) {
      const p = record.currentPath || "/";
      pathMap.set(p, (pathMap.get(p) || 0) + 1);
    }

    const paths: PathDistribution[] = Array.from(pathMap.entries())
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      activeUsers,
      paths,
      updatedAt: new Date().toISOString(),
    };
  }
}
