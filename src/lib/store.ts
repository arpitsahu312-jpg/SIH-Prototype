import { create } from "zustand";

export type SensorStatus = "normal" | "warning" | "critical";
export type RoomId = "habitat" | "laboratory" | "workshop";

export const STATUS_COLORS: Record<SensorStatus, string> = {
  normal: "#22c55e",
  warning: "#f59e0b",
  critical: "#ef4444",
};

export function fuelToStatus(fuel: number): SensorStatus {
  if (fuel <= 15) return "critical";
  if (fuel <= 30) return "warning";
  return "normal";
}

export function pressureToStatus(pressure: number): SensorStatus {
  if (pressure <= 1.5 || pressure >= 8) return "critical";
  if (pressure <= 2.5 || pressure >= 6) return "warning";
  return "normal";
}

// Shape sent by the FastAPI backend over /ws/telemetry
export interface BackendTelemetry {
  rooms: { id: string; status: SensorStatus; temperature: number }[];
  generator: { status: SensorStatus; fuelLevel: number; output: number };
  pipeline: { status: SensorStatus; pressure: number };
  environment: { windSpeed: number; temperature: number; blizzard: boolean };
  timestamp: string;
}

// Backend uses room-1/room-2/room-3; the 3D model uses named rooms.
const BACKEND_ROOM_MAP: Record<string, RoomId> = {
  "room-1": "habitat",
  "room-2": "laboratory",
  "room-3": "workshop",
};

interface InternalStationState {
  roomStatus: Record<RoomId, SensorStatus>;
  roomTemperature: Record<RoomId, number>;
  generatorFuel: number;
  generatorOutput: number;
  pipelinePressure: number;
  environment: BackendTelemetry["environment"];
  timestamp: string | null;
  connected: boolean;
  hoveredRoom: RoomId | null;
}

export interface StationStore {
  stationState: InternalStationState;
  setConnected: (connected: boolean) => void;
  applyTelemetry: (data: BackendTelemetry) => void;
  setHoveredRoom: (id: RoomId | null) => void;
}

const initialState: InternalStationState = {
  roomStatus: { habitat: "normal", laboratory: "normal", workshop: "normal" },
  roomTemperature: { habitat: 21.5, laboratory: 22.0, workshop: 20.8 },
  generatorFuel: 87,
  generatorOutput: 42.3,
  pipelinePressure: 4.2,
  environment: { windSpeed: 15, temperature: -32, blizzard: false },
  timestamp: null,
  connected: false,
  hoveredRoom: null,
};

export const useStationStore = create<StationStore>((set) => ({
  stationState: initialState,

  setConnected: (connected) =>
    set((s) => ({ stationState: { ...s.stationState, connected } })),

  applyTelemetry: (data) =>
    set((s) => {
      const roomStatus = { ...s.stationState.roomStatus };
      const roomTemperature = { ...s.stationState.roomTemperature };
      for (const room of data.rooms) {
        const id = BACKEND_ROOM_MAP[room.id];
        if (!id) continue;
        roomStatus[id] = room.status;
        roomTemperature[id] = room.temperature;
      }
      return {
        stationState: {
          ...s.stationState,
          roomStatus,
          roomTemperature,
          generatorFuel: data.generator.fuelLevel,
          generatorOutput: data.generator.output,
          pipelinePressure: data.pipeline.pressure,
          environment: data.environment,
          timestamp: data.timestamp,
        },
      };
    }),

  setHoveredRoom: (id) =>
    set((s) => ({ stationState: { ...s.stationState, hoveredRoom: id } })),
}));