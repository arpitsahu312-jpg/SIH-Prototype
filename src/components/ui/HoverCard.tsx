"use client";

import { useEffect, useState } from "react";
import { useStationStore, type RoomId, type SensorStatus } from "@/lib/store";

const ROOM_META: Record<RoomId, { label: string; equipment: string[] }> = {
  habitat: {
    label: "Habitat Module",
    equipment: ["Bunk units (×8)", "Life support console", "Medical kit station"],
  },
  laboratory: {
    label: "Research Laboratory",
    equipment: ["Ice core drill", "Mass spectrometer", "Sample storage unit"],
  },
  workshop: {
    label: "Engineering Workshop",
    equipment: ["Hydraulic press", "Spare parts storage", "Welding station"],
  },
};

const STATUS_LABEL: Record<SensorStatus, string> = {
  normal: "Operational",
  warning: "Warning",
  critical: "Critical",
};

const STATUS_COLOR: Record<SensorStatus, string> = {
  normal: "#22c55e",
  warning: "#f59e0b",
  critical: "#ef4444",
};

export function HoverCard() {
  const hoveredRoom = useStationStore((s) => s.stationState.hoveredRoom);
  const stationState = useStationStore((s) => s.stationState);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handler = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  if (!hoveredRoom) return null;

  const status = stationState.roomStatus[hoveredRoom];
  const temperature = stationState.roomTemperature[hoveredRoom];
  const meta = ROOM_META[hoveredRoom];
  const color = STATUS_COLOR[status];

  return (
    <div
      style={{
        position: "fixed",
        left: mousePos.x + 16,
        top: mousePos.y - 10,
        zIndex: 50,
        pointerEvents: "none",
        background: "rgba(10, 18, 35, 0.95)",
        border: `1px solid ${color}`,
        borderRadius: "8px",
        padding: "10px 14px",
        minWidth: "190px",
        fontFamily: "system-ui, sans-serif",
        backdropFilter: "blur(8px)",
      }}
    >
      <div style={{ fontSize: "12px", fontWeight: 600, color: "#e2e8f0", marginBottom: "6px" }}>
        {meta.label}
      </div>
      <div style={{ fontSize: "11px", color, marginBottom: "6px", display: "flex", alignItems: "center", gap: "5px" }}>
        <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: color, display: "inline-block" }} />
        {STATUS_LABEL[status]}
      </div>
      <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "8px" }}>
        Temp: <span style={{ color: "#e2e8f0" }}>{temperature.toFixed(1)}°C</span>
      </div>
      <div style={{ fontSize: "10px", color: "#64748b", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        Equipment
      </div>
      {meta.equipment.map((item) => (
        <div key={item} style={{ fontSize: "10px", color: "#94a3b8", paddingLeft: "8px", lineHeight: "1.6" }}>
          · {item}
        </div>
      ))}
      <div style={{ marginTop: "8px", paddingTop: "6px", borderTop: "1px solid rgba(255,255,255,0.08)", fontSize: "9px", color: "#475569" }}>
        Click for full details →
      </div>
    </div>
  );
}
