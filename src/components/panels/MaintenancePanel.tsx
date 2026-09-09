"use client";

import { useEffect, useState } from "react";

interface MaintenanceData {
  riskPercent: number;
  level: "nominal" | "elevated" | "critical";
  timestamp: string;
}

const API_BASE = "http://127.0.0.1:8000";

const LEVEL_COLOR: Record<string, string> = {
  nominal: "#22c55e",
  elevated: "#f59e0b",
  critical: "#ef4444",
};

export function MaintenancePanel() {
  const [data, setData] = useState<MaintenanceData | null>(null);

  useEffect(() => {
    async function fetchRisk() {
      try {
        const res = await fetch(`${API_BASE}/predict-maintenance`);
        setData(await res.json());
      } catch {
        // silent — panel just won't update this cycle
      }
    }
    fetchRisk();
    const interval = setInterval(fetchRisk, 4000);
    return () => clearInterval(interval);
  }, []);

  if (!data) return null;
  const color = LEVEL_COLOR[data.level];

  return (
    <div className="absolute top-28 left-4 z-10 w-64 rounded-lg bg-zinc-900/90 backdrop-blur p-3 text-white text-sm">
      <div className="flex justify-between items-center mb-1">
        <span className="text-zinc-400 text-xs uppercase">Predictive Maintenance</span>
        <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ color, border: `1px solid ${color}` }}>
          {data.level.toUpperCase()}
        </span>
      </div>
      <div className="w-full h-2 bg-zinc-800 rounded overflow-hidden mb-1">
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${data.riskPercent}%`, backgroundColor: color }}
        />
      </div>
      <p className="text-xs text-zinc-400">Generator breakdown risk: <span style={{ color }}>{data.riskPercent}%</span></p>
    </div>
  );
}