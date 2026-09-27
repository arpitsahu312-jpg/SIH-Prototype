/**
 * useTelemetry Hook
 * 
 * Establishes a WebSocket connection to the local edge server to receive 
 * real-time telemetry data. Handles automatic reconnection and parsing.
 */
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
    let cancelled = false; // Flag to prevent state updates if unmounted

    /**
     * connect
     * Instantiates the WebSocket and sets up event listeners.
     */
    function connect() {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => setConnected(true);

      // Parse incoming messages and push them to the Zustand store
      ws.onmessage = (event) => {
        try {
          const data: BackendTelemetry = JSON.parse(event.data);
          applyTelemetry(data);
        } catch (err) {
          console.error("[telemetry] failed to parse message", err);
        }
      };

      // On disconnect, schedule a reconnection attempt
      ws.onclose = () => {
        setConnected(false);
        if (!cancelled) reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY_MS);
      };

      ws.onerror = () => ws.close();
    }

    connect();

    // Cleanup function runs on unmount
    return () => {
      cancelled = true;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [applyTelemetry, setConnected]);
}