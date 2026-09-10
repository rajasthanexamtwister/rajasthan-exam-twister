/**
 * PresenceService
 * Manages 100% REAL active online visitors using an in-memory sliding window cache.
 * Heartbeats have a default TTL of 45 seconds.
 */

interface VisitorSession {
  lastSeen: number;
}

class PresenceServiceSingleton {
  private visitors = new Map<string, VisitorSession>();
  private readonly TTL_MS = 45 * 1000; // 45 seconds

  /**
   * Clean expired sessions older than TTL
   */
  private pruneExpired(): void {
    const now = Date.now();
    const cutoff = now - this.TTL_MS;

    for (const [id, session] of Array.from(this.visitors.entries())) {
      if (session.lastSeen < cutoff) {
        this.visitors.delete(id);
      }
    }
  }

  /**
   * Record a heartbeat from a visitor ID
   */
  public recordHeartbeat(visitorId?: string): number {
    this.pruneExpired();

    if (visitorId && typeof visitorId === "string" && visitorId.trim().length > 0) {
      const cleanId = visitorId.trim().slice(0, 64);
      this.visitors.set(cleanId, { lastSeen: Date.now() });
    }

    return this.getActiveCount();
  }

  /**
   * Get 100% real active users count based strictly on active visitor heartbeats
   */
  public getActiveCount(): number {
    this.pruneExpired();
    return this.visitors.size;
  }

  /**
   * Get raw active session count (same as getActiveCount)
   */
  public getRawActiveCount(): number {
    this.pruneExpired();
    return this.visitors.size;
  }

  /**
   * Clear active sessions (used in test teardown)
   */
  public clear(): void {
    this.visitors.clear();
  }
}

// Global singleton instance across Next.js module reloads
const globalForPresence = global as unknown as { presenceService?: PresenceServiceSingleton };

export const PresenceService =
  globalForPresence.presenceService || new PresenceServiceSingleton();

if (process.env.NODE_ENV !== "production") {
  globalForPresence.presenceService = PresenceService;
}
