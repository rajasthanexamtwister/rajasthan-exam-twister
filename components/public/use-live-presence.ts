"use client";

import { useState, useEffect, useRef } from "react";

const HEARTBEAT_INTERVAL_MS = 30 * 1000; // 30 seconds
const VISITOR_STORAGE_KEY = "ret_presence_vid";

function getOrCreateVisitorId(): string {
  if (typeof window === "undefined") return "ssr-visitor";
  try {
    let vid = sessionStorage.getItem(VISITOR_STORAGE_KEY);
    if (!vid) {
      vid = "v_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now().toString(36);
      sessionStorage.setItem(VISITOR_STORAGE_KEY, vid);
    }
    return vid;
  } catch {
    return "anon_" + Math.random().toString(36).substring(2, 8);
  }
}

export function useLivePresence() {
  const [liveCount, setLiveCount] = useState<number>(0);
  const [isLive, setIsLive] = useState<boolean>(true);
  const isMounted = useRef(false);

  const sendHeartbeat = async () => {
    // Only send if tab is visible to conserve battery & bandwidth
    if (typeof document !== "undefined" && document.visibilityState !== "visible") {
      return;
    }

    try {
      const visitorId = getOrCreateVisitorId();
      const res = await fetch("/api/presence/heartbeat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ visitorId }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data && typeof data.liveCount === "number") {
          setLiveCount(data.liveCount);
          setIsLive(true);
        }
      }
    } catch {
      // Graceful silence on network failure
    }
  };

  useEffect(() => {
    isMounted.current = true;

    // Send initial heartbeat
    sendHeartbeat();

    // Set up polling interval
    const interval = setInterval(() => {
      if (isMounted.current) {
        sendHeartbeat();
      }
    }, HEARTBEAT_INTERVAL_MS);

    // Send heartbeat when tab becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        sendHeartbeat();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isMounted.current = false;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return { liveCount, isLive };
}
