/**
 * ConnectivityToggle Component
 * 
 * This component manages the station's edge-to-cloud connectivity simulation.
 * It tracks offline queuing, synchronization states, and manages an offline mode 
 * that buffers telemetry data locally in a simulated SQLite/ChromaDB queue.
 */
"use client";

import { useState, useEffect } from "react";
import { useStationStore } from "@/lib/store";

const API_BASE = "http://127.0.0.1:8000";

interface Status {
  online: boolean;
  pendingChanges: number;
  lastSync: { timestamp: string; changes_synced: number } | null;
}

export function ConnectivityToggle() {
  const [status, setStatus] = useState<Status | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [queued, setQueued] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [secondsOffline, setSecondsOffline] = useState(0);
  
  const setSatelliteStatus = useStationStore((s) => s.setSatelliteStatus);

  async function refresh() {
    try {
      const res = await fetch(`${API_BASE}/connectivity/status`);
      const data = await res.json();
      setStatus(data);
      setSatelliteStatus(data.online);
    } catch {
      // ignore transient failures
    }
  }

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 3000);
    return () => clearInterval(interval);
  }, []);

  // Simulate queued packets incrementing
  useEffect(() => {
    let qInterval: NodeJS.Timeout;
    if (status && !status.online) {
      qInterval = setInterval(() => {
        setQueued(q => q + Math.floor(Math.random() * 3) + 1);
      }, 2000);
    } else {
      setQueued(0);
    }
    return () => clearInterval(qInterval);
  }, [status?.online]);

  // Simulate sync log updates
  useEffect(() => {
    const events = [
      "Telemetry batch synced — 47 packets",
      "Inventory update pushed to NCPOR",
      "Maintenance log uploaded",
      "Alert acknowledged by control center",
      "Environmental data batch synced"
    ];
    
    // Initial dummy data
    const initialLogs: string[] = [];
    let t = new Date();
    for (let i = 0; i < 5; i++) {
       initialLogs.push(`[${t.toLocaleTimeString('en-US', {hour12: false})}] ${events[i]}`);
       t = new Date(t.getTime() - 8000); 
    }
    setLogs(initialLogs);

    let logInterval: NodeJS.Timeout;
    if (status?.online) {
      logInterval = setInterval(() => {
        const time = new Date().toLocaleTimeString('en-US', { hour12: false });
        const event = events[Math.floor(Math.random() * events.length)];
        setLogs(prev => [`[${time}] ${event}`, ...prev].slice(0, 5));
      }, 8000);
    }
    return () => clearInterval(logInterval);
  }, [status?.online]);

  // Offline timer counter
  useEffect(() => {
    let i: NodeJS.Timeout;
    if (!status?.online) {
      setSecondsOffline(0); // reset when we go offline
      i = setInterval(() => setSecondsOffline(s => s + 1), 1000);
    }
    return () => clearInterval(i);
  }, [status?.online]);

  async function toggle() {
    if (!status) return;
    const goingOnline = !status.online;

    if (goingOnline) setSyncing(true);

    try {
      await fetch(`${API_BASE}/connectivity/set`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ online: goingOnline }),
      });
      await refresh();
    } finally {
      if (goingOnline) {
        setTimeout(() => setSyncing(false), 1200); 
      }
    }
  }

  if (!status) return null;
  
  const totalQueued = status.pendingChanges + queued;

  return (
    <>
      <div className="w-full z-10 w-64 rounded-lg bg-zinc-900/90 backdrop-blur p-3 text-white text-sm">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-400 text-xs uppercase font-bold">Network & Edge</span>
            <button 
              onClick={() => setShowInfo(true)}
              className="w-3.5 h-3.5 rounded-full border border-zinc-500 flex items-center justify-center text-[9px] text-zinc-400 hover:text-white hover:border-white transition-colors cursor-pointer"
              title="Why Offline-First?"
            >
              ℹ
            </button>
          </div>
          <button
            onClick={toggle}
            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
              status.online
                ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-600/30"
                : "bg-red-600/20 text-red-400 border border-red-500/50 hover:bg-red-600/30"
            }`}
          >
            {syncing ? "SYNCING..." : status.online ? "GO OFFLINE" : "RECONNECT"}
          </button>
        </div>

        <div className="mb-4">
          {status.online ? (
            <>
              <div className="text-[#22c55e] font-bold text-xs mb-1">● SATELLITE LINK ACTIVE</div>
              <div className="text-[10px] text-zinc-400">Signal: 73% · Latency: 142ms · Uplink: 2.4 Mbps</div>
            </>
          ) : (
            <>
              <div className="text-[#ef4444] font-bold text-xs mb-1">● OFFLINE MODE</div>
              <div className="text-[10px] text-zinc-400">Last sync: {secondsOffline} seconds ago</div>
            </>
          )}
        </div>

        {!status.online && (
          <div className="mb-4 bg-black/40 p-2 rounded border border-zinc-800">
            <div className="text-[#f59e0b] text-xs font-mono mb-1">Queued packets: {totalQueued}</div>
            <div className="text-[10px] text-zinc-500">Est. sync time: ~{Math.ceil(totalQueued / 10)}s when reconnected</div>
          </div>
        )}

        <div className="mb-4">
          <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Sync Log</div>
          <div className="bg-[#020617] p-2 rounded border border-[#1e3a5f] h-[80px] overflow-y-auto font-mono text-[9px] text-zinc-400 space-y-1">
            {status.online ? (
              logs.length > 0 ? (
                logs.map((log, i) => <div key={i}>{log}</div>)
              ) : (
                <div className="text-emerald-500/50">Listening for sync events...</div>
              )
            ) : (
              <div className="text-[#f59e0b]/70">● Sync paused — queuing locally</div>
            )}
          </div>
        </div>

        <div className="bg-[#0a1628] rounded border border-[#1e3a5f] p-2">
          <div className="text-[10px] text-[#58a6ff] uppercase font-bold mb-1.5">EDGE COMPUTE STATUS</div>
          <div className="space-y-1 text-[10px] font-mono">
            <div className="flex items-center gap-1">
              <span className="text-zinc-300">Local AI (Ollama):</span>
              <span className="text-[#22c55e]">●</span>
              <span className="text-zinc-500">Running — llama3.2:3b</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-zinc-300">Vector DB (ChromaDB):</span>
              <span className="text-[#22c55e]">●</span>
              <span className="text-zinc-500">Active — 847 chunks indexed</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-zinc-300">MQTT Broker:</span>
              <span className="text-[#22c55e]">●</span>
              <span className="text-zinc-500">Listening on port 1883</span>
            </div>
          </div>
        </div>

        <div className="bg-[#0a1628] rounded border border-[#1e3a5f] p-2 mt-4">
          <div className="text-[10px] text-[#58a6ff] uppercase font-bold mb-1.5">LOCAL STORAGE STATUS</div>
          <div className="space-y-1 text-[10px] font-mono text-zinc-300">
            <div className="flex justify-between">
              <span>SQLite Queue:</span>
              <span className="text-zinc-400">2.3 MB used / 10 GB capacity</span>
            </div>
            <div className="flex justify-between">
              <span>ChromaDB:</span>
              <span className="text-zinc-400">847 chunks / ~50,000 max</span>
            </div>
            <div className="flex justify-between">
              <span>Sensor logs:</span>
              <span className="text-zinc-400">156 MB / 500 GB capacity</span>
            </div>
            <div className="flex justify-between text-[#22c55e] mt-1 pt-1 border-t border-[#1e3a5f]">
              <span>Offline buffer:</span>
              <span>Up to 72 hrs autonomous operation</span>
            </div>
          </div>
        </div>
      </div>

      {showInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowInfo(false)}>
          <div className="bg-[#080f1e] border border-[#1e3a5f] rounded-lg p-5 max-w-sm w-full text-[#e2e8f0] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-sm text-[#58a6ff]">Why Offline-First?</h3>
              <button onClick={() => setShowInfo(false)} className="text-zinc-400 hover:text-white transition-colors cursor-pointer text-lg">✕</button>
            </div>
            <div className="text-xs text-zinc-300 space-y-3">
              <p>Antarctic satellite links fail during blizzards and polar nights. Our edge-first architecture ensures:</p>
              <ul className="list-disc pl-5 space-y-1 text-zinc-400">
                <li><strong className="text-zinc-300 font-medium">All sensor data stored locally first</strong></li>
                <li><strong className="text-zinc-300 font-medium">AI assistant works with zero connectivity</strong></li>
                <li><strong className="text-zinc-300 font-medium">Changes queued and synced when link restores</strong></li>
                <li><strong className="text-zinc-300 font-medium">No data loss during outages up to 72 hours</strong></li>
              </ul>
              <div className="pt-3 border-t border-[#1e3a5f] mt-3 text-zinc-400 leading-relaxed">
                <span className="text-zinc-300 font-medium">Tech stack:</span> FastAPI edge server + SQLite queue + MQTT broker + ChromaDB + Ollama — all running locally on station hardware.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}