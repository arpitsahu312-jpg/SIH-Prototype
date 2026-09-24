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
import { CrewPanel } from "@/components/panels/CrewPanel";
import { EmergencyPanel } from "@/components/panels/EmergencyPanel";
import { HoverCard } from "@/components/ui/HoverCard";
import { KPIStrip } from "../components/ui/KPIStrip";
import { MissionControl } from "@/components/ui/MissionControl";
import { AlertToast } from "@/components/ui/AlertToast";
import Link from "next/link";

export default function Home() {
  useTelemetry();
  const stationState = useStationStore((s) => s.stationState);
  const connected = stationState.connected;
  const timestamp = stationState.timestamp;

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden"
      style={{ background: "#020617", color: "#e2e8f0", fontFamily: "system-ui, sans-serif" }}>

      {/* TOP NAV */}
      <div style={{
        background: "#0a1628",
        borderBottom: "1px solid #1e3a5f",
        padding: "0 20px",
        height: "48px",
        display: "flex",
        alignItems: "center",
        gap: "16px",
        flexShrink: 0,
      }}>
        <span style={{ fontSize: "14px", fontWeight: 600, color: "#58a6ff", letterSpacing: "0.3px" }}>
          ⬡ PolarTwin
        </span>
        <span style={{ color: "#1e3a5f" }}>|</span>
        <span style={{ fontSize: "13px", color: "#8b949e" }}>
          Antarctic Station Command Center
        </span>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "16px" }}>
          {connected ? (
            <span style={{
              background: "rgba(34,197,94,0.15)",
              border: "1px solid rgba(34,197,94,0.4)",
              color: "#22c55e",
              fontSize: "11px",
              padding: "3px 10px",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
              ONLINE — Satellite Link Active
            </span>
          ) : (
            <span style={{ color: "#ef4444", fontSize: "11px" }}>● CONNECTING...</span>
          )}
          <span style={{ fontSize: "11px", color: "#8b949e" }}>
            {timestamp ? new Date(timestamp).toLocaleTimeString() : "--:--:--"}
          </span>
          <Link href="/operator"
            style={{ fontSize: "11px", color: "#58a6ff", textDecoration: "none" }}>
            NCPOR View →
          </Link>
        </div>
      </div>
      <KPIStrip />
      {/* MAIN AREA */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT SIDEBAR */}
        <div style={{
          width: "260px",
          flexShrink: 0,
          background: "#080f1e",
          borderRight: "1px solid #1e3a5f",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "1px",
        }}>
          <MissionControl />
          <CrewPanel />
          <EmergencyPanel />
          <ConnectivityToggle />
          <MaintenancePanel />
          <SustainabilityPanel />
        </div>

        {/* CENTER — 3D VIEWER */}
        <div className="flex-1 relative overflow-hidden">
          {!connected && (
            <div className="absolute inset-0 z-40 flex items-center justify-center"
              style={{ background: "rgba(2,6,23,0.9)" }}>
              <p style={{ color: "#8b949e", fontSize: "13px" }} className="animate-pulse">
                Connecting to station edge server...
              </p>
            </div>
          )}
          <StationCanvas />
          <HoverCard />
          <AlertToast />
        </div>

        {/* RIGHT SIDEBAR */}
        <div style={{
          width: "280px",
          flexShrink: 0,
          background: "#080f1e",
          borderLeft: "1px solid #1e3a5f",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "1px",
        }}>
          <EnergyPanel />
          <EnvironmentPanel />
          <InventoryPanel />
          <StationAssistant />
        </div>

      </div>
    </div>
  );
}
