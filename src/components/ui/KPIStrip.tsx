"use client";
import { useStationStore, fuelToStatus, pressureToStatus } from "@/lib/store";

export function KPIStrip() {
  const s = useStationStore((state) => state.stationState);
  const fuelColor = fuelToStatus(s.generatorFuel) === "critical" ? "#ef4444"
    : fuelToStatus(s.generatorFuel) === "warning" ? "#f59e0b" : "#22c55e";
  const kpis = [
    { label: "FUEL",       value: `${s.generatorFuel.toFixed(1)}%`,        color: fuelColor },
    { label: "OUTPUT",     value: `${s.generatorOutput.toFixed(1)} kW`,    color: "#58a6ff" },
    { label: "EXT. TEMP",  value: `${s.environment.temperature.toFixed(1)}°C`, color: "#58a6ff" },
    { label: "WIND",       value: `${s.environment.windSpeed.toFixed(1)} km/h`, color: "#e2e8f0" },
    { label: "BLIZZARD",   value: s.environment.blizzard ? "ACTIVE" : "Clear",
      color: s.environment.blizzard ? "#ef4444" : "#22c55e" },
    { label: "PIPELINE",   value: `${s.pipelinePressure.toFixed(1)} bar`,
      color: pressureToStatus(s.pipelinePressure) === "normal" ? "#22c55e" : "#f59e0b" },
    { label: "GENERATOR",  value: `${s.generatorOutput.toFixed(0)} kW`,   color: "#58a6ff" },
  ];
  return (
    <div style={{
      height: "36px", background: "#060d1a",
      borderBottom: "1px solid #1e3a5f",
      display: "flex", alignItems: "center",
      padding: "0 16px", flexShrink: 0,
    }}>
      {kpis.map((kpi, i) => (
        <div key={kpi.label} style={{ display: "flex", alignItems: "center" }}>
          <div style={{ padding: "0 14px", textAlign: "center" }}>
            <span style={{ fontSize: "9px", color: "#4a6380", textTransform: "uppercase",
              letterSpacing: "0.6px", display: "block", lineHeight: 1, marginBottom: "2px" }}>
              {kpi.label}
            </span>
            <span style={{ fontSize: "12px", fontWeight: 600, color: kpi.color, lineHeight: 1 }}>
              {kpi.value}
            </span>
          </div>
          {i < kpis.length - 1 && (
            <div style={{ width: "1px", height: "20px", background: "#1e3a5f" }} />
          )}
        </div>
      ))}
    </div>
  );
}