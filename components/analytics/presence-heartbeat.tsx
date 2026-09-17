"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const HEARTBEAT_INTERVAL_MS = 30 * 1000; // 30 seconds

export function PresenceHeartbeat() {
  const pathname = usePathname();
  const lastPathRef = useRef<string>(pathname);

  useEffect(() => {
    // Exclude admin pages from visitor heartbeat tracking
    if (pathname.startsWith("/admin")) {
      return;
    }

    const sendHeartbeat = (pathToSend: string) => {
      // Skip heartbeat when document tab is hidden
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }

      fetch("/api/presence/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPath: pathToSend }),
        keepalive: true,
      }).catch(() => {
        // Silent catch to handle transient network issues cleanly
      });
    };

    // Send heartbeat immediately on initial mount or route navigation change
    sendHeartbeat(pathname);
    lastPathRef.current = pathname;

    // Set up 30-second recurring heartbeat timer
    const intervalId = setInterval(() => {
      sendHeartbeat(lastPathRef.current);
    }, HEARTBEAT_INTERVAL_MS);

    // Handle document visibility changes (e.g. switching back to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        sendHeartbeat(lastPathRef.current);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [pathname]);

  return null;
}
