"use client";

import { useEffect, useState } from "react";
import { useStationStore, fuelToStatus, pressureToStatus } from "@/lib/store";

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
  const stationState = useStationStore((s) => s.stationState);

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

  let score = 100;
  score -= fuelToStatus(stationState.generatorFuel) === "critical" ? 30 : fuelToStatus(stationState.generatorFuel) === "warning" ? 15 : 0;
  score -= pressureToStatus(stationState.pipelinePressure) === "critical" ? 25 : pressureToStatus(stationState.pipelinePressure) === "warning" ? 12 : 0;
  score -= stationState.environment.blizzard ? 20 : 0;
  Object.values(stationState.roomStatus).forEach(status => {
    if (status === "critical") score -= 10;
    if (status === "warning") score -= 5;
  });
  
  const scoreColor = score >= 70 ? "#22c55e" : score >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div className="w-full z-10 w-64 rounded-lg bg-zinc-900/90 backdrop-blur p-3 text-white text-sm">
      <div className="mb-4">
        <div className="text-xs uppercase text-zinc-400 mb-1">Station Health</div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold" style={{ color: scoreColor }}>{Math.max(0, score)}</span>
          <span className="text-xs text-zinc-500">/100</span>
        </div>
      </div>
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