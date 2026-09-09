"use client";

import { useTelemetry } from "../lib/useTelemetry";
import { useStationStore } from "../lib/store";
import StationCanvas from "../components/scene/StationCanvas";
import { InventoryPanel } from "../components/panels/InventoryPanel";
import { EnergyPanel } from "../components/panels/EnergyPanel";
import { EnvironmentPanel } from "../components/panels/EnvironmentPanel";
import { StationAssistant } from "../components/panels/StationAssistant";
import { MaintenancePanel } from "../components/panels/MaintenancePanel";
import { ConnectivityToggle } from "@/components/panels/ConnectivityToggle";
import { SustainabilityPanel } from "@/components/panels/SustainabilityPanel";
import Link from "next/link";

export default function Home() {
  useTelemetry();
  const stationState = useStationStore((s) => s.stationState);
  const connected = stationState.connected;
  const timestamp = stationState.timestamp;

  return (
    <main className="relative h-screen w-screen bg-black">
      {!connected && (
        <div className="absolute inset-0 z-40 bg-black flex items-center justify-center">
          <p className="text-zinc-400 text-sm animate-pulse">Connecting to Maitri Station edge server...</p>
        </div>
      )}
      <div className="absolute top-4 left-4 z-10 text-white">
        <h1 className="text-xl font-bold">Antarctic Digital Twin — Prototype</h1>
        <p className="text-sm text-zinc-400">
          {connected && timestamp
            ? `Live · ${new Date(timestamp).toLocaleTimeString()}`
            : "Connecting..."}
        </p>
        <Link href="/operator" className="text-xs text-blue-400 hover:text-blue-300">
          Switch to NCPOR Operator View →
        </Link>
      </div>
      <StationCanvas />
      <InventoryPanel />
      <EnergyPanel />
      <EnvironmentPanel />
      <StationAssistant />
      <MaintenancePanel />
      <ConnectivityToggle />
      <SustainabilityPanel />
    </main>
  );
}