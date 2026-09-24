"use client";

import { useEffect, useState, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { useStationStore } from "@/lib/store";

interface HistoryPoint {
  timestamp: string;
  fuelLevel: number;
  output: number;
}

const API_BASE = "http://127.0.0.1:8000";

type TimeWindow = "1h" | "24h" | "7d";

export function EnergyPanel() {
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [window, setWindow] = useState<TimeWindow>("24h");
  const generatorFuel = useStationStore((s) => s.stationState.generatorFuel);
  const generatorOutput = useStationStore((s) => s.stationState.generatorOutput);

  const prevOut = useRef(generatorOutput);
  useEffect(() => {
    prevOut.current = generatorOutput;
  }, [generatorOutput]);

  const outTrend = generatorOutput > prevOut.current ? "↑" : generatorOutput < prevOut.current ? "↓" : "→";
  const outTrendColor = generatorOutput > prevOut.current ? "#22c55e" : generatorOutput < prevOut.current ? "#ef4444" : "#8b949e";

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch(`${API_BASE}/energy/history?window=${window}`);
        let data: HistoryPoint[] = await res.json();

        // Client-side fallback if backend returns a large dataset not respecting window
        if (data.length > 0) {
          if (window === "1h" && data.length > 12) {
            data = data.slice(-12);
          } else if (window === "7d" && data.length > 200) { // arbitrary threshold to apply grouping
            const grouped = new Map<string, { sumFuel: number; sumOut: number; count: number }>();
            data.forEach((pt) => {
              // Extract YYYY-MM-DDTHH
              const hourKey = pt.timestamp.substring(0, 13);
              const existing = grouped.get(hourKey) || { sumFuel: 0, sumOut: 0, count: 0 };
              grouped.set(hourKey, {
                sumFuel: existing.sumFuel + pt.fuelLevel,
                sumOut: existing.sumOut + pt.output,
                count: existing.count + 1,
              });
            });
            data = Array.from(grouped.entries()).map(([hourKey, vals]) => ({
              timestamp: hourKey + ":00:00Z", // mock full timestamp
              fuelLevel: vals.sumFuel / vals.count,
              output: vals.sumOut / vals.count,
            })).sort((a, b) => a.timestamp.localeCompare(b.timestamp));
          }
        }
        setHistory(data);
      } catch {
        // silently handle fetch errors
      }
    }
    fetchHistory();
    const interval = setInterval(fetchHistory, 3000);
    return () => clearInterval(interval);
  }, [window]);

  const fuelColor = generatorFuel <= 15 ? "#ef4444" : generatorFuel <= 30 ? "#f59e0b" : "#22c55e";
  
  const daysRemaining = generatorFuel / (100 / 30);
  const daysColor = daysRemaining < 3 ? "#ef4444" : daysRemaining < 7 ? "#f59e0b" : "#8b949e";

  return (
    <div className="w-full z-10 rounded-lg bg-zinc-900/90 backdrop-blur p-4 text-white text-sm">
      <div className="flex justify-between items-center mb-2">
        <h2 className="font-bold">Energy & Power</h2>
        <div className="flex gap-1">
          {(["1h", "24h", "7d"] as TimeWindow[]).map((w) => (
            <button
              key={w}
              onClick={() => setWindow(w)}
              className="text-[10px] px-2 py-0.5 rounded transition-colors"
              style={{
                background: window === w ? "#58a6ff" : "transparent",
                color: window === w ? "#fff" : "#8b949e",
                border: `1px solid ${window === w ? "#58a6ff" : "#1e3a5f"}`,
              }}
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-between mb-1">
        <span className="text-zinc-400">Fuel Level</span>
        <span style={{ color: fuelColor }} className="font-semibold">
          {generatorFuel.toFixed(1)}%
          <span style={{ color: "#ef4444", fontSize: "10px", marginLeft: "4px" }}>↓</span>
        </span>
      </div>
      <div className="text-[11px] mb-3" style={{ color: daysColor }}>
        ⚡ ~{daysRemaining.toFixed(1)} days remaining
      </div>
      
      <div className="flex justify-between mb-3">
        <span className="text-zinc-400">Output</span>
        <span className="text-zinc-200">
          {generatorOutput.toFixed(1)} kW
          <span style={{ color: outTrendColor, fontSize: "10px", marginLeft: "4px" }}>{outTrend}</span>
        </span>
      </div>

      <div className="h-24">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={history}>
            <XAxis dataKey="timestamp" hide />
            <YAxis hide domain={[0, 100]} />
            <Tooltip
              contentStyle={{ background: "#18181b", border: "none", fontSize: 12 }}
              labelFormatter={() => ""}
              formatter={(value) => [`${(value as number).toFixed(1)}%`, "Fuel"]}
            />
            <Line type="monotone" dataKey="fuelLevel" stroke="#22c55e" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}