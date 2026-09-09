"use client";

import { useState, useEffect } from "react";

const API_BASE = "http://127.0.0.1:8000";

interface Status {
  online: boolean;
  pendingChanges: number;
  lastSync: { timestamp: string; changes_synced: number } | null;
}

export function ConnectivityToggle() {
  const [status, setStatus] = useState<Status | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [lastMessage, setLastMessage] = useState<string | null>(null);

  async function refresh() {
    try {
      const res = await fetch(`${API_BASE}/connectivity/status`);
      setStatus(await res.json());
    } catch {
      // ignore transient failures
    }
  }

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 3000);
    return () => clearInterval(interval);
  }, []);

  async function toggle() {
    if (!status) return;
    const goingOnline = !status.online;

    if (goingOnline) setSyncing(true);

    try {
      const res = await fetch(`${API_BASE}/connectivity/set`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ online: goingOnline }),
      });
      const data = await res.json();
      setLastMessage(data.message);
      await refresh();
    } finally {
      if (goingOnline) {
        setTimeout(() => setSyncing(false), 1200); // let the sync animation play briefly
      }
    }
  }

  if (!status) return null;

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center">
      <button
        onClick={toggle}
        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold shadow-lg transition-colors ${
          status.online
            ? "bg-emerald-600 hover:bg-emerald-500 text-white"
            : "bg-amber-600 hover:bg-amber-500 text-white"
        }`}
      >
        {syncing ? (
          <>⏳ Syncing to NCPOR Cloud...</>
        ) : status.online ? (
          <>🛰️ ONLINE — Satellite Link Active</>
        ) : (
          <>📡 OFFLINE — Edge Mode {status.pendingChanges > 0 && `(${status.pendingChanges} queued)`}</>
        )}
      </button>
      {lastMessage && !syncing && (
        <p className="text-xs text-zinc-400 mt-1">{lastMessage}</p>
      )}
    </div>
  );
}