"use client";

import { useEffect, useState, useRef } from "react";
import { useStationStore } from "@/lib/store";

interface Alert {
  id: string;
  message: string;
  severity: "warning" | "critical";
  timestamp: number;
}

export function AlertToast() {
  const stationState = useStationStore((s) => s.stationState);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const stateRef = useRef(stationState);
  const lastFired = useRef<Record<string, number>>({});

  useEffect(() => {
    stateRef.current = stationState;
  }, [stationState]);

  useEffect(() => {
    const checkAlerts = () => {
      const state = stateRef.current;
      const now = Date.now();
      const newAlerts: Omit<Alert, "timestamp">[] = [];

      if (state.generatorFuel < 15) {
        newAlerts.push({ id: "fuel", message: "⚠ Fuel Level Critical — Generator fuel below 30%", severity: "critical" });
      } else if (state.generatorFuel < 30) {
        newAlerts.push({ id: "fuel", message: "⚠ Fuel Level Critical — Generator fuel below 30%", severity: "warning" });
      }

      if (state.pipelinePressure < 2.5 || state.pipelinePressure > 6) {
        newAlerts.push({ id: "pressure", message: "⚠ Pipeline Pressure Alert", severity: "warning" });
      }

      if (state.environment.blizzard) {
        newAlerts.push({ id: "blizzard", message: "🌨 Blizzard Active — Station on weather alert", severity: "critical" });
      }

      setAlerts((prev) => {
        let updated = [...prev];
        let changed = false;

        newAlerts.forEach((alert) => {
          const lastTime = lastFired.current[alert.id] || 0;
          if (now - lastTime > 30000) {
            lastFired.current[alert.id] = now;
            updated.push({ ...alert, timestamp: now });
            changed = true;
          }
        });

        const filtered = updated.filter((a) => now - a.timestamp < 6000);
        if (filtered.length !== updated.length) changed = true;

        return changed ? filtered : prev;
      });
    };

    const interval = setInterval(checkAlerts, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const cleanup = setInterval(() => {
      setAlerts((prev) => {
        const now = Date.now();
        const filtered = prev.filter((a) => now - a.timestamp < 6000);
        return filtered.length !== prev.length ? filtered : prev;
      });
    }, 1000);
    return () => clearInterval(cleanup);
  }, []);

  const dismiss = (id: string, timestamp: number) => {
    setAlerts((prev) => prev.filter((a) => !(a.id === id && a.timestamp === timestamp)));
  };

  if (alerts.length === 0) return null;

  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-3 pointer-events-none">
      {alerts.map((alert) => (
        <div
          key={`${alert.id}-${alert.timestamp}`}
          className="flex items-center justify-between p-4 rounded-md shadow-2xl min-w-[350px] pointer-events-auto"
          style={{
            background: "rgba(2, 6, 23, 0.95)",
            border: `1px solid ${alert.severity === "critical" ? "#ef4444" : "#f59e0b"}`,
            borderLeftWidth: "4px",
            color: "#e2e8f0",
            backdropFilter: "blur(8px)",
          }}
        >
          <span className="text-sm font-medium">{alert.message}</span>
          <button
            onClick={() => dismiss(alert.id, alert.timestamp)}
            className="ml-4 text-[#8b949e] hover:text-[#e2e8f0] transition-colors focus:outline-none"
            style={{ fontSize: "20px", lineHeight: "1" }}
            aria-label="Close"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
