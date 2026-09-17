"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshCw } from "lucide-react";

interface PathDistribution {
  path: string;
  count: number;
}

interface PresenceSummary {
  activeUsers: number;
  paths: PathDistribution[];
  updatedAt: string;
}

export function AdminLiveUsersCard() {
  const [data, setData] = useState<PresenceSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPresence = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const res = await fetch("/api/admin/presence", { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const json: PresenceSummary = await res.json();
      setData(json);
      setError(null);
    } catch (err: any) {
      console.error("Failed to fetch live presence:", err);
      setError("Failed to load active user presence");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPresence();

    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        fetchPresence();
      }
    }, 12000); // Poll every 12 seconds

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchPresence();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchPresence]);

  const activeCount = data?.activeUsers ?? 0;
  const paths = data?.paths ?? [];

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-3 w-3 items-center justify-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 leading-tight">Live Active Visitors</h2>
            <p className="text-[11px] text-slate-500">Real-time public presence (last 90s)</p>
          </div>
        </div>

        <button
          onClick={() => fetchPresence(true)}
          disabled={isRefreshing}
          className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          title="Refresh live count"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-amber-500" : ""}`} />
        </button>
      </div>

      {loading ? (
        <div className="py-6 text-center text-xs text-slate-400 animate-pulse">Loading live activity...</div>
      ) : error ? (
        <div className="py-4 text-center text-xs text-rose-500">{error}</div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-slate-900 tracking-tight">{activeCount}</span>
              <span className="text-xs font-semibold text-slate-500">
                {activeCount === 1 ? "active user online" : "active users online"}
              </span>
            </div>
            {data?.updatedAt && (
              <span className="text-[10px] text-slate-400 font-medium">
                Updated {new Date(data.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
            )}
          </div>

          {paths.length > 0 ? (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Current Page Activity</div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {paths.map((item) => (
                  <div key={item.path} className="flex items-center justify-between text-xs py-1 px-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="font-mono text-slate-700 truncate max-w-[200px]" title={item.path}>
                      {item.path}
                    </span>
                    <span className="font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md text-[11px]">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 italic pt-2 border-t border-slate-100">
              No active public visitors in the last 90 seconds.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
