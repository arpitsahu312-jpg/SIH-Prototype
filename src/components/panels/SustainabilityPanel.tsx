/**
 * SustainabilityPanel Component
 * 
 * This component displays the eco-compliance metrics for the station based on the
 * Antarctic Treaty Protocol on Environmental Protection. It tracks estimated CO2 
 * emissions and accumulated waste against treaty limits, showing an overall compliance score.
 */
"use client";

import { useEffect, useState } from "react";
// import { useStationStore } from "@/lib/store"; // UNUSED IMPORT

interface SustainabilityData {
  estimatedCarbonKg: number;
  wasteAccumulatedKg: number;
  wasteCapacityPercent: number;
  treatyLimitKg: number;
  hoursRunning: number;
}

const API_BASE = "http://127.0.0.1:8000";

export function SustainabilityPanel() {
  const [data, setData] = useState<SustainabilityData | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  // const stationState = useStationStore((s) => s.stationState); // UNUSED VARIABLE

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`${API_BASE}/sustainability`);
        setData(await res.json());
      } catch {
        // silent
      }
    }
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!data) return null;

  const wasteColor = data.wasteCapacityPercent >= 80 ? "#ef4444" : data.wasteCapacityPercent >= 50 ? "#f59e0b" : "#22c55e";

  const score = Math.max(0, 100 - Math.min(100, (data.wasteAccumulatedKg / 200) * 60 + (data.estimatedCarbonKg / 50) * 40));
  const label = score > 70 ? "COMPLIANT" : score >= 50 ? "AT RISK" : "VIOLATION";
  const scoreColor = score > 70 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <>
      <div className="w-full z-10 w-64 rounded-lg bg-zinc-900/90 backdrop-blur p-3 text-white text-sm">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-bold text-xs uppercase text-zinc-400">Eco-Command Center</h2>
          <button 
            onClick={() => setShowInfo(true)}
            className="w-3.5 h-3.5 rounded-full border border-zinc-500 flex items-center justify-center text-[9px] text-zinc-400 hover:text-white hover:border-white transition-colors cursor-pointer"
            title="CO₂ Calculation"
          >
            ℹ
          </button>
        </div>

        <div className="mb-4">
          <div className="flex justify-between items-end mb-1">
            <span className="text-zinc-400 text-xs uppercase">Treaty Compliance</span>
            <span className="font-bold text-xs" style={{ color: scoreColor }}>
              {label} — {Math.round(score)}%
            </span>
          </div>
          <div className="w-full h-1 bg-zinc-800 rounded overflow-hidden mb-1.5">
            <div className="h-full transition-all duration-500" style={{ width: `${score}%`, backgroundColor: scoreColor }} />
          </div>
          <div className="text-[9px] text-zinc-500 leading-tight">
            Per Antarctic Treaty Protocol on Environmental Protection — Annex III (Waste Management)
          </div>
        </div>

        <div className="flex justify-between mb-1 text-xs">
          <span className="text-zinc-400">Est. CO₂ Emissions</span>
          <span className="text-zinc-200">{data.estimatedCarbonKg} kg</span>
        </div>

        <div className="flex justify-between mb-1 text-xs">
          <span className="text-zinc-400">Waste Storage</span>
          <span style={{ color: wasteColor }} className="font-semibold">
            {data.wasteAccumulatedKg} / {data.treatyLimitKg} kg
          </span>
        </div>
        <div className="w-full h-2 bg-zinc-800 rounded overflow-hidden mb-3">
          <div
            className="h-full transition-all duration-500"
            style={{ width: `${data.wasteCapacityPercent}%`, backgroundColor: wasteColor }}
          />
        </div>

        <div className="bg-[#0a1628] rounded border border-[#1e3a5f] p-2 mb-3">
          <table className="w-full text-[9px] text-left">
            <thead>
              <tr className="text-zinc-500 uppercase border-b border-[#1e3a5f]">
                <th className="pb-1 font-normal">Waste Category</th>
                <th className="pb-1 font-normal text-right">This Week</th>
                <th className="pb-1 font-normal text-right">Limit</th>
              </tr>
            </thead>
            <tbody className="text-zinc-300 font-mono">
              <tr><td className="py-1">Liquid waste</td><td className="text-right">8.2 L</td><td className="text-right text-zinc-500">50 L</td></tr>
              <tr><td className="py-1">Solid waste</td><td className="text-right">2.1 kg</td><td className="text-right text-zinc-500">15 kg</td></tr>
              <tr><td className="py-1 border-b border-[#1e3a5f]">Chemical waste</td><td className="text-right border-b border-[#1e3a5f]">0.3 kg</td><td className="text-right text-zinc-500 border-b border-[#1e3a5f]">5 kg</td></tr>
              <tr><td className="pt-1">Sewage treated</td><td className="text-right text-[#22c55e]">94%</td><td className="text-right text-zinc-500">&gt;90% ✓</td></tr>
            </tbody>
          </table>
        </div>

        <div className="text-[10px] text-zinc-500 flex justify-between items-center">
          <span>Op: {data.hoursRunning}h</span>
          <span className="text-[#f59e0b]">12 days since collection</span>
        </div>
      </div>

      {showInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowInfo(false)}>
          <div className="bg-[#080f1e] border border-[#1e3a5f] rounded-lg p-5 max-w-sm w-full text-[#e2e8f0] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-sm text-[#58a6ff]">CO₂ Calculation Model</h3>
              <button onClick={() => setShowInfo(false)} className="text-zinc-400 hover:text-white transition-colors cursor-pointer text-lg">✕</button>
            </div>
            <div className="text-xs text-zinc-300 space-y-3">
              <p>CO₂ calculated from kerosene consumption:</p>
              <ul className="list-disc pl-5 space-y-1 text-zinc-400">
                <li><strong className="text-zinc-300 font-medium">Kerosene density:</strong> 0.82 kg/L</li>
                <li><strong className="text-zinc-300 font-medium">CO₂ factor:</strong> 2.52 kg CO₂ per kg kerosene</li>
                <li><strong className="text-zinc-300 font-medium">CHP efficiency:</strong> 85%</li>
              </ul>
              <div className="pt-3 border-t border-[#1e3a5f] mt-3 bg-black/40 p-2 rounded border border-zinc-800 font-mono text-zinc-400">
                Formula: Output_kW × 0.28 × hours_running
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}