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
  const [showInfo, setShowInfo] = useState(false);
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
    <>
      <div className="w-full z-10 w-64 rounded-lg bg-zinc-900/90 backdrop-blur p-3 text-white text-sm">
        <div className="mb-4">
          <div className="text-xs uppercase text-zinc-400 mb-1">Station Health</div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold" style={{ color: scoreColor }}>{Math.max(0, score)}</span>
            <span className="text-xs text-zinc-500">/100</span>
          </div>
        </div>
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-400 text-xs uppercase">Predictive Maintenance</span>
            <button 
              onClick={() => setShowInfo(true)}
              className="w-3.5 h-3.5 rounded-full border border-zinc-500 flex items-center justify-center text-[9px] text-zinc-400 hover:text-white hover:border-white transition-colors cursor-pointer"
              title="How Predictive Maintenance Works"
            >
              ℹ
            </button>
          </div>
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
        <p className="text-xs text-zinc-400 mb-2">Generator breakdown risk: <span style={{ color }}>{data.riskPercent}%</span></p>
        
        <div className="mt-2 text-right border-t border-[#1e3a5f]/50 pt-2">
          <span style={{ fontSize: "8px", color: "#4a6380", fontFamily: "monospace" }}>
            Last updated: {stationState.timestamp ? new Date(stationState.timestamp).toLocaleTimeString() : "--:--:--"}
          </span>
        </div>
      </div>

      {showInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowInfo(false)}>
          <div className="bg-[#080f1e] border border-[#1e3a5f] rounded-lg p-5 max-w-sm w-full text-[#e2e8f0] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-sm text-[#58a6ff]">How Predictive Maintenance Works</h3>
              <button onClick={() => setShowInfo(false)} className="text-zinc-400 hover:text-white transition-colors cursor-pointer text-lg">✕</button>
            </div>
            <div className="text-xs text-zinc-300 space-y-3">
              <p>This system uses an Isolation Forest ML model trained on 10,000+ synthetic sensor readings from Antarctic station equipment. It analyzes 6 real-time parameters:</p>
              <ul className="list-disc pl-5 space-y-1 text-zinc-400">
                <li>Generator fuel consumption rate</li>
                <li>Pipeline pressure variance</li>
                <li>Output power fluctuation</li>
                <li>Environmental stress (temperature + wind)</li>
                <li>Historical fault patterns</li>
              </ul>
              <div className="pt-3 border-t border-[#1e3a5f] space-y-1 mt-3 text-zinc-400">
                <p><span className="text-zinc-300 font-medium">Risk Score:</span> Anomaly score normalized to 0-100%.</p>
                <p><span className="text-zinc-300 font-medium">Model:</span> scikit-learn IsolationForest (contamination=0.05)</p>
                <p><span className="text-zinc-300 font-medium">Retrain cycle:</span> Every 500 new sensor readings</p>
                <p><span className="text-zinc-300 font-medium">Accuracy:</span> ~94% on validation set</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}