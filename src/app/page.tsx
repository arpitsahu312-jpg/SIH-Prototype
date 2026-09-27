/**
 * Home Page (Main Dashboard)
 * 
 * This is the primary entry point for the PolarTwin application.
 * It renders the entire command center interface including the left sidebar,
 * the 3D viewer (StationCanvas) in the center, and the right sidebar with telemetry.
 * It manages the global fault simulation state.
 */
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
import { PipelineLegend } from "@/components/ui/PipelineLegend";
import { SensorMap } from "@/components/ui/SensorMap";
import { ArchitectureModal } from "@/components/ui/ArchitectureModal";
import { MessagesPanel } from "@/components/panels/MessagesPanel";
import Link from "next/link";
import { useState, useRef } from "react";

export default function Home() {
  // Start listening to WebSocket telemetry when the dashboard mounts
  useTelemetry();
  
  const stationStore = useStationStore();
  const stationState = stationStore.stationState;
  const connected = stationState.connected;
  const satelliteOnline = stationState.satelliteOnline;
  const lastSyncTime = stationState.lastSyncTime;
  const timestamp = stationState.timestamp;
  const pendingCount = stationState.reorderRequests.filter(
    (r) => r.status === "pending"
  ).length;
  const messages = stationState.messages;
  const unreadCount = messages.filter(m => m.from === "ncpor" && !m.read).length;
  
  // Local state for modals and notifications
  const [showArchitecture, setShowArchitecture] = useState(false);
  const [showRestoredToast, setShowRestoredToast] = useState(false);
  const [faultActive, setFaultActive] = useState(false);
  
  const messagesPanelRef = useRef<HTMLDivElement>(null);

  /**
   * handleInjectFault
   * Simulates a catastrophic system failure by overriding live telemetry data
   * in the Zustand store for 15 seconds. After the timeout, it restores normal
   * operation and displays a toast notification.
   */
  const handleInjectFault = () => {
    if (faultActive) return;
    setFaultActive(true);
    stationStore.triggerFault(); // Sets fault mode flag and critical values
    
    setTimeout(() => {
      stationStore.clearFault(); // Restores telemetry processing
      setFaultActive(false);
      setShowRestoredToast(true);
      setTimeout(() => setShowRestoredToast(false), 3000); // Hide toast after 3s
    }, 15000);
  };

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
        <span style={{
          background: "rgba(34,197,94,0.15)",
          border: "1px solid rgba(34,197,94,0.3)",
          color: "#22c55e",
          fontSize: "10px",
          padding: "2px 8px",
          borderRadius: "3px",
          letterSpacing: "0.3px",
        }}>
          LEAD SCIENTIST VIEW
        </span>
        <span style={{ color: "#1e3a5f" }}>|</span>
        <span style={{ fontSize: "13px", color: "#8b949e" }}>
          Antarctic Station Command Center
        </span>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "16px" }}>
          {satelliteOnline ? (
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
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e", display: "inline-block" }} className="animate-pulse" />
              ONLINE — Satellite Link Active
            </span>
          ) : (
            <span style={{
              background: "rgba(239,68,68,0.15)",
              border: "1px solid rgba(239,68,68,0.4)",
              color: "#ef4444",
              fontSize: "11px",
              padding: "3px 10px",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#ef4444", display: "inline-block" }} />
              OFFLINE — Satellite Link Broken
            </span>
          )}
          <span style={{ fontSize: "11px", color: "#8b949e" }}>
            {satelliteOnline ? (timestamp ? new Date(timestamp).toLocaleTimeString() : "--:--:--") : `Last sync: ${lastSyncTime || "--:--:--"}`}
          </span>
          
          <button 
            onClick={handleInjectFault}
            disabled={faultActive}
            className="text-[10px] bg-[#1a0a0a] border border-[#ef4444] text-[#ef4444] px-2 py-1 rounded cursor-pointer hover:bg-[#ef4444]/20 disabled:opacity-50 transition-colors"
          >
            {faultActive ? "⚡ FAULT ACTIVE" : "⚡ Demo: Inject Fault"}
          </button>
          
          <div className="relative">
            <div 
              onClick={() => messagesPanelRef.current?.scrollIntoView({ behavior: "smooth" })}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                cursor: "pointer",
                padding: "3px 8px",
                background: unreadCount > 0 ? "rgba(248,81,73,0.1)" : "transparent",
                border: unreadCount > 0 ? "1px solid #ef4444" : "1px solid transparent",
                borderRadius: "4px",
              }}
            >
              <span style={{ fontSize: "12px" }}>📨</span>
              <span style={{ 
                fontSize: "11px", 
                color: unreadCount > 0 ? "#ef4444" : "#8b949e" 
              }}>
                {unreadCount > 0 
                  ? `${unreadCount} NCPOR message${unreadCount > 1 ? "s" : ""}` 
                  : "Messages"}
              </span>
            </div>
          </div>
          
          <button 
            onClick={() => setShowArchitecture(true)}
            className="text-[11px] text-[#e2e8f0] bg-[#1e3a5f]/50 border border-[#1e3a5f] px-2 py-1 rounded cursor-pointer hover:bg-[#1e3a5f] transition-colors"
          >
            🏗 Architecture
          </button>

          {stationState.userRole === "operator" && (
            <Link href="/operator"
              style={{ fontSize: "11px", color: "#58a6ff", textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
              NCPOR View →
              {pendingCount > 0 && (
                <span style={{
                  background: "#f59e0b",
                  color: "white",
                  borderRadius: "50%",
                  width: "16px",
                  height: "16px",
                  fontSize: "9px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginLeft: "5px",
                }}>
                  {pendingCount}
                </span>
              )}
              {unreadCount > 0 && (
                <span style={{
                  background: "#ef4444",
                  color: "white", borderRadius: "50%",
                  width: "16px", height: "16px",
                  fontSize: "9px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginLeft: "4px",
                }}>
                  {unreadCount}
                </span>
              )}
            </Link>
          )}

          <Link href="/login" style={{ fontSize: "11px", color: "#8b949e", textDecoration: "none", marginLeft: "8px" }}>
            Logout
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
          <div ref={messagesPanelRef}>
            <MessagesPanel />
          </div>
          <EmergencyPanel />
          <ConnectivityToggle />
          <MaintenancePanel />
          <SustainabilityPanel />
          
          <div style={{
            padding: "8px 12px",
            borderTop: "1px solid #1e3a5f",
            fontSize: "9px",
            color: "#2a3a4a",
            fontFamily: "monospace",
            lineHeight: "1.8",
            flexShrink: 0,
          }}>
            PolarTwin v1.0.0<br/>
            Built for NCPOR · SIH 2025<br/>
            Edge: FastAPI 0.104 + Ollama<br/>
            Frontend: Next.js 14 + R3F
          </div>
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
          <PipelineLegend />
          <SensorMap />
          
          <div style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            zIndex: 10,
            background: "rgba(6,13,26,0.85)",
            border: "1px solid #1e3a5f",
            borderRadius: "6px",
            padding: "6px 10px",
            fontSize: "9px",
            color: "#4a6380",
            fontFamily: "monospace",
            letterSpacing: "0.3px",
            lineHeight: "1.8",
            pointerEvents: "none",
          }}>
            <span style={{ color: "#58a6ff", fontWeight: 600 }}>
              BHARATI RESEARCH STATION
            </span><br/>
            Digital Twin v1.0 · Edge-to-Cloud<br/>
            Larsemann Hills · 69.40°S 76.19°E
          </div>
          
          <div style={{
            position: "absolute",
            top: "10px",
            right: "10px", 
            zIndex: 10,
            background: "rgba(6,13,26,0.85)",
            border: "1px solid #1e3a5f",
            borderRadius: "6px",
            padding: "6px 10px",
            fontSize: "9px",
            color: "#4a6380",
            fontFamily: "monospace",
            letterSpacing: "0.3px",
            lineHeight: "1.6",
            pointerEvents: "none",
            textAlign: "right",
          }}>
            <span style={{ color: "#22c55e" }}>●</span> LIVE telemetry via MQTT/WebSocket<br/>
            Sensor refresh: ~2s interval<br/>
            Model: Bharati Research Station, Antarctica<br/>
            69.40°S 76.19°E · Larsemann Hills
          </div>
          <AlertToast />
          
          {showRestoredToast && (
            <div className="absolute top-[80px] left-1/2 -translate-x-1/2 z-50 bg-[#052e16]/90 border border-[#22c55e] text-[#22c55e] px-4 py-2 rounded-lg text-xs font-bold shadow-lg animate-in fade-in slide-in-from-top-4">
              ✓ Fault simulation complete — systems restored
            </div>
          )}
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
      
      {showArchitecture && <ArchitectureModal onClose={() => setShowArchitecture(false)} />}
    </div>
  );
}
