import { describe, it, expect, vi, beforeEach } from "vitest";
import { PresenceService } from "@/server/services/presence-service";
import { Presence } from "@/server/models/Presence";
import { getSessionFromRequest } from "@/server/lib/token";
import { NextRequest } from "next/server";

vi.mock("@/server/lib/mongodb", () => ({
  connectToDatabase: vi.fn().mockResolvedValue(true),
}));

describe("Live Presence Service & Security", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sanitizes paths correctly, stripping queries/hashes and capping length", () => {
    expect(PresenceService.sanitizePath("/notes/rajasthan-gk?foo=bar#section")).toBe("/notes/rajasthan-gk");
    expect(PresenceService.sanitizePath("quizzes")).toBe("/quizzes");
    expect(PresenceService.sanitizePath(undefined)).toBe("/");
    expect(PresenceService.sanitizePath("")).toBe("/");
  });

  it("identifies known crawler/bot user-agents accurately", () => {
    expect(PresenceService.isBot("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)")).toBe(true);
    expect(PresenceService.isBot("Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)")).toBe(true);
    expect(PresenceService.isBot("curl/7.68.0")).toBe(true);
    expect(PresenceService.isBot("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")).toBe(false);
    expect(PresenceService.isBot("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)")).toBe(false);
  });

  it("ignores heartbeat from bots without saving to DB", async () => {
    const result = await PresenceService.recordHeartbeat({
      sessionId: "session-123",
      currentPath: "/notes",
      userAgent: "Googlebot/2.1",
    });

    expect(result.recorded).toBe(false);
    expect(result.reason).toBe("bot_ignored");
  });

  it("ignores heartbeat for admin paths to prevent admin inclusion", async () => {
    const result = await PresenceService.recordHeartbeat({
      sessionId: "session-123",
      currentPath: "/admin/blogs",
      userAgent: "Mozilla/5.0",
    });

    expect(result.recorded).toBe(false);
    expect(result.reason).toBe("admin_path_ignored");
  });

  it("rejects invalid session IDs safely", async () => {
    const result = await PresenceService.recordHeartbeat({
      sessionId: "",
      currentPath: "/",
      userAgent: "Mozilla/5.0",
    });

    expect(result.recorded).toBe(false);
    expect(result.reason).toBe("invalid_session_id");
  });

  it("upserts presence record for valid visitor session", async () => {
    const findOneAndUpdateSpy = vi.spyOn(Presence, "findOneAndUpdate").mockResolvedValue({} as any);

    const result = await PresenceService.recordHeartbeat({
      sessionId: "session-valid-123",
      currentPath: "/quizzes/rajasthan-history",
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    });

    expect(result.recorded).toBe(true);
    expect(findOneAndUpdateSpy).toHaveBeenCalledTimes(1);
    expect(findOneAndUpdateSpy).toHaveBeenCalledWith(
      { sessionId: "session-valid-123" },
      expect.objectContaining({
        $set: expect.objectContaining({
          currentPath: "/quizzes/rajasthan-history",
        }),
      }),
      { upsert: true, new: true }
    );
  });

  it("filters active sessions within 90s cutoff in getActivePresence", async () => {
    const mockNow = new Date("2026-09-17T12:00:00Z");
    vi.setSystemTime(mockNow);

    const mockRecords = [
      { sessionId: "s1", currentPath: "/notes", lastSeenAt: new Date("2026-09-17T11:59:45Z") }, // 15s ago -> active
      { sessionId: "s2", currentPath: "/notes", lastSeenAt: new Date("2026-09-17T11:59:10Z") }, // 50s ago -> active
      { sessionId: "s3", currentPath: "/quizzes", lastSeenAt: new Date("2026-09-17T11:59:00Z") }, // 60s ago -> active
    ];

    vi.spyOn(Presence, "find").mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockRecords),
      }),
    } as any);

    const presenceSummary = await PresenceService.getActivePresence(90);

    expect(presenceSummary.activeUsers).toBe(3);
    expect(presenceSummary.paths).toEqual([
      { path: "/notes", count: 2 },
      { path: "/quizzes", count: 1 },
    ]);

    vi.useRealTimers();
  });

  it("prevents unauthenticated request from accessing admin presence API", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/presence");
    const session = await getSessionFromRequest(req);

    expect(session).toBeNull();
  });
});
