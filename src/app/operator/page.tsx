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

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">NCPOR Operator Console</h1>
          <p className="text-zinc-400 text-sm">Multi-station overview — India control center</p>
        </div>
        <Link href="/" className="text-sm text-blue-400 hover:text-blue-300">
          ← Back to Station View
        </Link>
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
