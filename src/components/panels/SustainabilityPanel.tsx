"use client";

import { useEffect, useState } from "react";

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

  return (
    <div className="absolute bottom-4 left-[26rem] z-10 w-72 rounded-lg bg-zinc-900/90 backdrop-blur p-4 text-white text-sm">
      <h2 className="font-bold mb-2">Eco-Command Center</h2>

      <div className="flex justify-between mb-1">
        <span className="text-zinc-400">Est. CO₂ Emissions</span>
        <span className="text-zinc-200">{data.estimatedCarbonKg} kg</span>
      </div>

      <div className="flex justify-between mb-1">
        <span className="text-zinc-400">Waste Storage</span>
        <span style={{ color: wasteColor }} className="font-semibold">
          {data.wasteAccumulatedKg} / {data.treatyLimitKg} kg
        </span>
      </div>
      <div className="w-full h-2 bg-zinc-800 rounded overflow-hidden mb-2">
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${data.wasteCapacityPercent}%`, backgroundColor: wasteColor }}
        />
      </div>

      <p className="text-xs text-zinc-500">
        Antarctic Treaty compliance tracking · {data.hoursRunning}h operational
      </p>
    </div>
  );
}