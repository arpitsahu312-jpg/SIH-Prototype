"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { useStationStore } from "@/lib/store";

interface HistoryPoint {
  timestamp: string;
  fuelLevel: number;
  output: number;
}

const API_BASE = "http://127.0.0.1:8000";

export function EnergyPanel() {
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const generatorFuel = useStationStore((s) => s.stationState.generatorFuel);
  const generatorOutput = useStationStore((s) => s.stationState.generatorOutput);

  useEffect(() => {
    async function fetchHistory() {
      const res = await fetch(`${API_BASE}/energy/history`);
      setHistory(await res.json());
    }
    fetchHistory();
    const interval = setInterval(fetchHistory, 3000);
    return () => clearInterval(interval);
  }, []);

  const fuelColor = generatorFuel <= 15 ? "#ef4444" : generatorFuel <= 30 ? "#f59e0b" : "#22c55e";

  return (
    <div className="absolute bottom-4 left-4 z-10 w-96 rounded-lg bg-zinc-900/90 backdrop-blur p-4 text-white text-sm">
      <h2 className="font-bold mb-2">Energy & Power</h2>

      <div className="flex justify-between mb-1">
        <span className="text-zinc-400">Fuel Level</span>
        <span style={{ color: fuelColor }} className="font-semibold">
          {generatorFuel.toFixed(1)}%
        </span>
      </div>
      <div className="flex justify-between mb-3">
        <span className="text-zinc-400">Output</span>
        <span className="text-zinc-200">{generatorOutput.toFixed(1)} kW</span>
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