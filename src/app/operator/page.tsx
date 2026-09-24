"use client";

import { useTelemetry } from "@/lib/useTelemetry";
import { useStationStore } from "@/lib/store";
import Link from "next/link";

const STATIONS = [
  { id: "maitri", name: "Maitri Station", location: "Schirmacher Oasis" },
  { id: "bharati", name: "Bharati Station", location: "Larsemann Hills" },
];

function statusColor(status: string) {
  if (status === "critical") return "#ef4444";
  if (status === "warning") return "#f59e0b";
  return "#22c55e";
}

export default function OperatorView() {
  useTelemetry();
  const stationState = useStationStore((s) => s.stationState);

  // Derive an overall station status from the worst component status
  function fuelStatus(fuel: number): string {
  if (fuel <= 15) return "critical";
  if (fuel <= 30) return "warning";
  return "normal";
}

function pressureStatus(pressure: number): string {
  if (pressure <= 1.5 || pressure >= 8) return "critical";
  if (pressure <= 2.5 || pressure >= 6) return "warning";
  return "normal";
}

const statuses = [
  ...Object.values(stationState.roomStatus),
  fuelStatus(stationState.generatorFuel),
  pressureStatus(stationState.pipelinePressure),
];
const worstStatus = statuses.includes("critical")
  ? "critical"
  : statuses.includes("warning")
  ? "warning"
  : "normal";

  const isDiff = (val1: number, val2: number) => Math.abs(val1 - val2) / Math.max(0.1, Math.abs(val1)) > 0.2;

  return (
    <main className="min-h-screen bg-[#020617] text-[#e2e8f0] p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">NCPOR Operator Console</h1>
          <p className="text-[#8b949e] text-sm">Multi-station overview — India control center</p>
        </div>
        <Link href="/" className="text-sm text-[#58a6ff] hover:text-blue-300">
          ← Back to Station View
        </Link>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-bold mb-3 text-[#e2e8f0]">MAITRI vs BHARATI — Station Comparison</h2>
        <div className="flex bg-[#080f1e] rounded-lg border border-[#1e3a5f] overflow-hidden text-sm">
          {/* MAITRI */}
          <div className="flex-1 border-r border-[#1e3a5f]">
            <div className="bg-[#0a1628] px-4 py-3 border-b border-[#1e3a5f]">
              <h3 className="font-bold text-[#58a6ff]">MAITRI STATION</h3>
            </div>
            <div className="p-4 flex flex-col gap-3">
              <div className="flex justify-between">
                <span className="text-[#8b949e]">Status</span>
                <span className="text-[#22c55e] font-bold text-[10px] border border-[#22c55e] px-1.5 py-0.5 rounded">OPERATIONAL</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8b949e]">Location</span>
                <span className="text-[#e2e8f0]">Maitri (70.77°S, 11.73°E)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8b949e]">Est. Crew</span>
                <span className="text-[#e2e8f0]">25 personnel</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8b949e]">Fuel Level</span>
                <span className="text-[#e2e8f0]">71%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8b949e]">Output</span>
                <span className="text-[#e2e8f0]">38.2 kW</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8b949e]">Ext. Temp</span>
                <span className="text-[#e2e8f0]">-28.4°C</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8b949e]">Wind</span>
                <span className="text-[#e2e8f0]">31.2 km/h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8b949e]">Last Sync</span>
                <span className="text-[#e2e8f0]">8 min ago</span>
              </div>
            </div>
          </div>

          {/* BHARATI */}
          <div className="flex-1">
            <div className="bg-[#0a1628] px-4 py-3 border-b border-[#1e3a5f]">
              <h3 className="font-bold text-[#58a6ff]">BHARATI STATION</h3>
            </div>
            <div className="p-4 flex flex-col gap-3">
              <div className="flex justify-between">
                <span className="text-[#8b949e]">Status</span>
                <span className="text-[#22c55e] font-bold text-[10px] border border-[#22c55e] px-1.5 py-0.5 rounded">OPERATIONAL</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8b949e]">Location</span>
                <span className="text-[#e2e8f0]">Bharati (69.40°S, 76.19°E)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8b949e]">Est. Crew</span>
                <span className="text-[#e2e8f0]">
                  47 personnel
                  {isDiff(25, 47) && <span className="text-[#f59e0b] ml-2 font-bold">⚠</span>}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8b949e]">Fuel Level</span>
                <span className="text-[#e2e8f0]">
                  {stationState.generatorFuel.toFixed(1)}%
                  {isDiff(71, stationState.generatorFuel) && <span className="text-[#f59e0b] ml-2 font-bold">⚠</span>}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8b949e]">Output</span>
                <span className="text-[#e2e8f0]">
                  {stationState.generatorOutput.toFixed(1)} kW
                  {isDiff(38.2, stationState.generatorOutput) && <span className="text-[#f59e0b] ml-2 font-bold">⚠</span>}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8b949e]">Ext. Temp</span>
                <span className="text-[#e2e8f0]">
                  {stationState.environment.temperature.toFixed(1)}°C
                  {isDiff(-28.4, stationState.environment.temperature) && <span className="text-[#f59e0b] ml-2 font-bold">⚠</span>}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8b949e]">Wind</span>
                <span className="text-[#e2e8f0]">
                  {stationState.environment.windSpeed.toFixed(1)} km/h
                  {isDiff(31.2, stationState.environment.windSpeed) && <span className="text-[#f59e0b] ml-2 font-bold">⚠</span>}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8b949e]">Last Sync</span>
                <span className="text-[#e2e8f0]">2 min ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {STATIONS.map((station) => {
          // Only Maitri is wired to live data in this prototype; Bharati is a static demo card
          const isLive = station.id === "maitri";
          const color = isLive ? statusColor(worstStatus) : "#22c55e";

          return (
            <div key={station.id} className="rounded-lg bg-zinc-900 border border-zinc-800 p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-lg font-semibold">{station.name}</h2>
                  <p className="text-xs text-zinc-500">{station.location}</p>
                </div>
                <span
                  className="text-xs font-bold px-2 py-1 rounded"
                  style={{ color, border: `1px solid ${color}` }}
                >
                  {isLive ? worstStatus.toUpperCase() : "NOMINAL"}
                </span>
              </div>

              {isLive ? (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-zinc-500 text-xs">Generator Fuel</p>
                    <p className="font-semibold">{stationState.generatorFuel.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-zinc-500 text-xs">Pipeline Pressure</p>
                    <p className="font-semibold">{stationState.pipelinePressure.toFixed(2)} bar</p>
                  </div>
                  <div>
                    <p className="text-zinc-500 text-xs">Environment</p>
                    <p className="font-semibold">{stationState.environment.temperature.toFixed(1)}°C</p>
                  </div>
                  <div>
                    <p className="text-zinc-500 text-xs">Blizzard</p>
                    <p className="font-semibold">{stationState.environment.blizzard ? "Active" : "Clear"}</p>
                  </div>
                </div>
              ) : (
                <p className="text-zinc-500 text-sm italic">
                  Simulated station — demo build connects one live edge server at a time.
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-zinc-900 border border-zinc-800 p-5">
        <h2 className="text-lg font-semibold mb-2">Live Connection</h2>
        <p className="text-sm text-zinc-400">
          {stationState.connected ? "Connected to Maitri edge server" : "Connecting..."}
          {stationState.timestamp && ` · Last update ${new Date(stationState.timestamp).toLocaleTimeString()}`}
        </p>
      </div>
    </main>
  );
}
