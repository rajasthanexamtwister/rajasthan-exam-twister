import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { PresenceService } from "@/server/services/presence-service";

describe("PresenceService (100% Real Live User Tracking)", () => {
  beforeEach(() => {
    PresenceService.clear();
    vi.useRealTimers();
  });

  afterEach(() => {
    PresenceService.clear();
    vi.useRealTimers();
  });

  it("1. should start at 0 when no visitors are active", () => {
    expect(PresenceService.getActiveCount()).toBe(0);
  });

  it("2. should record a real visitor heartbeat and reflect exact count of 1", () => {
    const liveCount = PresenceService.recordHeartbeat("visitor-real-1");
    expect(liveCount).toBe(1);
    expect(PresenceService.getActiveCount()).toBe(1);
  });

  it("3. should deduplicate repeated heartbeats from the same visitor to keep count at 1", () => {
    PresenceService.recordHeartbeat("visitor-same");
    PresenceService.recordHeartbeat("visitor-same");
    PresenceService.recordHeartbeat("visitor-same");

    expect(PresenceService.getActiveCount()).toBe(1);
  });

  it("4. should track exact number of distinct real visitors (e.g. 3 visitors = count 3)", () => {
    PresenceService.recordHeartbeat("visitor-1");
    PresenceService.recordHeartbeat("visitor-2");
    PresenceService.recordHeartbeat("visitor-3");

    expect(PresenceService.getActiveCount()).toBe(3);
  });

  it("5. should handle undefined or blank visitor IDs gracefully without incrementing invalid sessions", () => {
    PresenceService.recordHeartbeat(undefined);
    PresenceService.recordHeartbeat("");
    PresenceService.recordHeartbeat("   ");

    expect(PresenceService.getActiveCount()).toBe(0);
  });

  it("6. should automatically prune expired visitor sessions after 45s TTL", () => {
    vi.useFakeTimers();

    PresenceService.recordHeartbeat("visitor-temp");
    expect(PresenceService.getActiveCount()).toBe(1);

    // Fast-forward 50 seconds past TTL window
    vi.advanceTimersByTime(50 * 1000);

    expect(PresenceService.getActiveCount()).toBe(0);
  });
});
