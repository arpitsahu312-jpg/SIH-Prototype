"use client";

import { useStationStore } from "@/lib/store";

function riskLevel(windSpeed: number, temperature: number, blizzard: boolean): {
  label: string;
  color: string;
} {
  if (blizzard || windSpeed > 35 || temperature < -45) {
    return { label: "SEVERE", color: "#ef4444" };
  }
  if (windSpeed > 25 || temperature < -38) {
    return { label: "ELEVATED", color: "#f59e0b" };
  }
  return { label: "NOMINAL", color: "#22c55e" };
}

export function EnvironmentPanel() {
  const environment = useStationStore((s) => s.stationState.environment);
  const { windSpeed, temperature, blizzard } = environment;
  const risk = riskLevel(windSpeed, temperature, blizzard);

  return (
    <div className="absolute bottom-4 right-4 z-10 w-72 rounded-lg bg-zinc-900/90 backdrop-blur p-4 text-white text-sm">
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-bold">Environmental Telemetry</h2>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded"
          style={{ color: risk.color, border: `1px solid ${risk.color}` }}
        >
          {risk.label}
        </span>
      </div>

      <div className="flex justify-between py-0.5">
        <span className="text-zinc-400">Wind Speed</span>
        <span className={windSpeed > 25 ? "text-amber-400 font-semibold" : "text-zinc-200"}>
          {windSpeed.toFixed(1)} km/h
        </span>
      </div>
      <div className="flex justify-between py-0.5">
        <span className="text-zinc-400">Temperature</span>
        <span className={temperature < -38 ? "text-amber-400 font-semibold" : "text-zinc-200"}>
          {temperature.toFixed(1)}°C
        </span>
      </div>
      <div className="flex justify-between py-0.5">
        <span className="text-zinc-400">Blizzard</span>
        <span className={blizzard ? "text-red-400 font-semibold" : "text-zinc-200"}>
          {blizzard ? "ACTIVE" : "Clear"}
        </span>
      </div>
    </div>
  );
}