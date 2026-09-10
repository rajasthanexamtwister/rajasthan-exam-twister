import { NextRequest } from "next/server";

interface RateLimitRecord {
  timestamps: number[];
}

// In-memory store for rate limiting by key (e.g. IP + endpoint)
const rateLimitStore = new Map<string, RateLimitRecord>();

// Cleanup stale entries every 5 minutes to prevent memory leak
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    rateLimitStore.forEach((record, key) => {
      // Remove timestamps older than 1 hour
      const valid = record.timestamps.filter((ts: number) => now - ts < 3600000);
      if (valid.length === 0) {
        rateLimitStore.delete(key);
      } else {
        record.timestamps = valid;
      }
    });
  }, 300000);
}

export interface RateLimitOptions {
  windowMs: number; // Window duration in milliseconds
  max: number;      // Max allowed requests within windowMs
  keyPrefix?: string;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number; // Unix timestamp in ms when oldest request expires
}

export function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "127.0.0.1";
}

export function checkRateLimit(
  key: string,
  options: RateLimitOptions
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - options.windowMs;
  const storeKey = options.keyPrefix ? `${options.keyPrefix}:${key}` : key;

  let record = rateLimitStore.get(storeKey);
  if (!record) {
    record = { timestamps: [] };
    rateLimitStore.set(storeKey, record);
  }

  // Filter out timestamps outside the active sliding window
  record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

  if (record.timestamps.length >= options.max) {
    const oldest = record.timestamps[0] || now;
    const resetTime = oldest + options.windowMs;
    return {
      success: false,
      limit: options.max,
      remaining: 0,
      resetTime,
    };
  }

  // Record this request
  record.timestamps.push(now);

  return {
    success: true,
    limit: options.max,
    remaining: options.max - record.timestamps.length,
    resetTime: now + options.windowMs,
  };
}

export function resetRateLimit(key: string, keyPrefix?: string): void {
  const storeKey = keyPrefix ? `${keyPrefix}:${key}` : key;
  rateLimitStore.delete(storeKey);
}
