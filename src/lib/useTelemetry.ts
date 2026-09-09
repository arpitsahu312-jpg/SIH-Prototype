"use client";

import { useEffect, useRef } from "react";
import { useStationStore, type BackendTelemetry } from "@/lib/store";

const WS_URL = "ws://127.0.0.1:8000/ws/telemetry";
const RECONNECT_DELAY_MS = 2000;

export function useTelemetry() {
  const applyTelemetry = useStationStore((s) => s.applyTelemetry);
  const setConnected = useStationStore((s) => s.setConnected);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    function connect() {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => setConnected(true);

      ws.onmessage = (event) => {
        try {
          const data: BackendTelemetry = JSON.parse(event.data);
          applyTelemetry(data);
        } catch (err) {
          console.error("[telemetry] failed to parse message", err);
        }
      };

      ws.onclose = () => {
        setConnected(false);
        if (!cancelled) reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY_MS);
      };

      ws.onerror = () => ws.close();
    }

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [applyTelemetry, setConnected]);
}