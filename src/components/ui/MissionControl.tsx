"use client";

import { useStationStore, fuelToStatus, STATUS_COLORS } from "@/lib/store";

export function MissionControl() {
  const generatorFuel = useStationStore((s) => s.stationState.generatorFuel);
  
  const powerStatus = fuelToStatus(generatorFuel);
  const waterStatus = "normal"; // hardcoded for now
  const fuelStatus = fuelToStatus(generatorFuel); // same as POWER

  const buttons = [
    { label: "POWER", status: powerStatus },
    { label: "WATER", status: waterStatus as "normal" | "warning" | "critical" },
    { label: "FUEL", status: fuelStatus },
  ];

  return (
    <div className="w-full p-4 border-b flex flex-col gap-3" style={{ borderColor: "#1e3a5f", background: "#0a1628" }}>
      <h2 className="text-[11px] font-semibold tracking-wider text-[#8b949e] uppercase m-0">Mission Control</h2>
      <div className="flex gap-3 justify-between">
        {buttons.map((btn) => (
          <div key={btn.label} className="flex-1 flex flex-col items-center justify-center py-3 rounded" style={{ background: "#020617", border: "1px solid #1e3a5f" }}>
            <span style={{ fontSize: "11px", color: "#8b949e", marginBottom: "6px", fontWeight: 500 }}>{btn.label}</span>
            <div 
              className={btn.status === "critical" ? "animate-pulse" : ""}
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                background: STATUS_COLORS[btn.status],
                boxShadow: btn.status !== "normal" ? `0 0 8px ${STATUS_COLORS[btn.status]}` : "none",
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
