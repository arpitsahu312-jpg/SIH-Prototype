/**
 * Global Zustand Store
 * 
 * Manages the state for the entire digital twin, including telemetry data,
 * connection status, hovered 3D objects, and simulated faults.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SensorStatus = "normal" | "warning" | "critical";
export type RoomId = "habitat" | "laboratory" | "workshop";

export const STATUS_COLORS: Record<SensorStatus, string> = {
  normal: "#22c55e",
  warning: "#f59e0b",
  critical: "#ef4444",
};

/** Converts generator fuel level to a standardized status string */
export function fuelToStatus(fuel: number): SensorStatus {
  if (fuel <= 15) return "critical";
  if (fuel <= 30) return "warning";
  return "normal";
}

/** Converts pipeline pressure to a standardized status string */
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

export interface ReorderRequest {
  id: string;
  itemName: string;
  quantity: string;
  station: string;
  requestedAt: string;
  status: "pending" | "approved" | "dispatched" | "rejected";
  eta?: string;
  approvedBy?: string;
}

export interface StationMessage {
  id: string;
  from: "ncpor" | "station";
  content: string;
  timestamp: string;
  read: boolean;
  priority: "normal" | "urgent";
}

export interface ProtocolState {
  id: string;
  name: string;
  active: boolean;
  activatedAt: string | null;
  checklist: {
    item: string;
    checked: boolean;
    checkedAt: string | null;
    checkedBy: string | null;
  }[];
}

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
  faultModeActive: boolean;
  reorderRequests: ReorderRequest[];
  satelliteOnline: boolean;
  lastSyncTime: string | null;
  userRole: "scientist" | "operator" | null;
  messages: StationMessage[];
  activeProtocols: ProtocolState[];
  pendingMessages: StationMessage[];
}

export interface StationStore {
  stationState: InternalStationState;
  cloudState: InternalStationState;
  setConnected: (connected: boolean) => void;
  setSatelliteStatus: (online: boolean, lastSyncTime?: string | null) => void;
  applyTelemetry: (data: BackendTelemetry) => void;
  setHoveredRoom: (id: RoomId | null) => void;
  triggerFault: () => void;
  clearFault: () => void;
  addReorderRequest: (item: string, quantity: string) => void;
  updateReorderStatus: (
    id: string, 
    status: ReorderRequest["status"],
    eta?: string,
    approvedBy?: string
  ) => void;
  setUserRole: (role: "scientist" | "operator" | null) => void;
  sendMessage: (from: "ncpor" | "station", content: string, priority: "normal" | "urgent") => void;
  markMessagesRead: () => void;
  activateProtocol: (id: string) => void;
  deactivateProtocol: (id: string) => void;
  checkProtocolItem: (protocolId: string, itemIndex: number, checkedBy: string) => void;
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
  faultModeActive: false,
  reorderRequests: [],
  pendingMessages: [],
  satelliteOnline: true,
  lastSyncTime: null,
  userRole: null,
  messages: [
    {
      id: "msg-001",
      from: "ncpor",
      content: "Routine check-in. Please confirm fuel reserve status and crew health.",
      timestamp: "09:00:00",
      read: true,
      priority: "normal",
    },
    {
      id: "msg-002", 
      from: "station",
      content: "All systems nominal. Fuel at 84%. Crew health good. Minor pipeline pressure fluctuation being monitored.",
      timestamp: "09:15:00",
      read: true,
      priority: "normal",
    },
  ],
  activeProtocols: [
    {
      id: "blizzard-7",
      name: "Blizzard Protocol 7",
      active: false,
      activatedAt: null,
      checklist: [
        { item: "Secure all external equipment", checked: false, checkedAt: null, checkedBy: null },
        { item: "Activate backup heating", checked: false, checkedAt: null, checkedBy: null },
        { item: "Check emergency food supplies", checked: false, checkedAt: null, checkedBy: null },
        { item: "Notify NCPOR control center", checked: false, checkedAt: null, checkedBy: null },
      ],
    },
    {
      id: "fuel-alpha",
      name: "Fuel Emergency Alpha",
      active: false,
      activatedAt: null,
      checklist: [
        { item: "Switch to reserve fuel tank", checked: false, checkedAt: null, checkedBy: null },
        { item: "Reduce non-essential power", checked: false, checkedAt: null, checkedBy: null },
        { item: "Dispatch resupply request", checked: false, checkedAt: null, checkedBy: null },
        { item: "Log incident report", checked: false, checkedAt: null, checkedBy: null },
      ],
    },
    {
      id: "pipeline-lockdown",
      name: "Pipeline Lockdown",
      active: false,
      activatedAt: null,
      checklist: [
        { item: "Close main valve", checked: false, checkedAt: null, checkedBy: null },
        { item: "Isolate affected segment", checked: false, checkedAt: null, checkedBy: null },
        { item: "Check pressure gauges", checked: false, checkedAt: null, checkedBy: null },
        { item: "Call systems engineer", checked: false, checkedAt: null, checkedBy: null },
      ],
    },
  ],
};

export const useStationStore = create<StationStore>()(
  persist(
    (set) => ({
      stationState: initialState,
      cloudState: initialState,

  setUserRole: (role) =>
    set((s) => ({
      stationState: { ...s.stationState, userRole: role },
      cloudState: { ...s.cloudState, userRole: role },
    })),

  // Updates WebSocket connection state
  setConnected: (connected) =>
    set((s) => ({ stationState: { ...s.stationState, connected } })),

  setSatelliteStatus: (online, lastSyncTime = null) =>
    set((s) => {
      const newLastSync = online ? null : (lastSyncTime || s.stationState.lastSyncTime || new Date().toLocaleTimeString());
      const flushedMessages = online
        ? s.stationState.pendingMessages.map((message) => ({
            ...message,
            content: message.content.replace("[QUEUED - will sync on reconnect] ", ""),
            timestamp: new Date().toLocaleTimeString(),
          }))
        : [];
      const syncNotification: StationMessage = {
        id: `msg-sync-${Date.now()}`,
        from: "station",
        content: `✓ Satellite link restored. ${flushedMessages.length} queued message${flushedMessages.length !== 1 ? "s" : ""} synced to NCPOR.`,
        timestamp: new Date().toLocaleTimeString(),
        read: false,
        priority: "normal",
      };
      const nextState = {
        ...s.stationState,
        satelliteOnline: online,
        lastSyncTime: newLastSync,
        ...(online && {
          messages: [
            ...s.stationState.messages,
            ...flushedMessages,
            ...(flushedMessages.length > 0 ? [syncNotification] : []),
          ],
          pendingMessages: [],
        }),
      };
      // If we just went offline, ensure cloudState captures the last known timestamp properly,
      // but otherwise cloudState remains frozen until we go back online.
      return {
        stationState: nextState,
        cloudState: online ? nextState : { ...s.cloudState, satelliteOnline: false, lastSyncTime: newLastSync },
      };
    }),

  /**
   * applyTelemetry
   * Merges incoming WebSocket data into the state.
   */
  applyTelemetry: (data) =>
    set((s) => {
      const roomStatus = { ...s.stationState.roomStatus };
      const roomTemperature = { ...s.stationState.roomTemperature };
      
      const isFault = s.stationState.faultModeActive;
      
      for (const room of data.rooms) {
        const id = BACKEND_ROOM_MAP[room.id];
        if (!id) continue;
        roomStatus[id] = isFault ? "critical" : room.status;
        roomTemperature[id] = room.temperature;
      }
      
      const nextState = {
        ...s.stationState,
        roomStatus,
        roomTemperature,
        generatorFuel: isFault ? 8 : data.generator.fuelLevel,
        generatorOutput: data.generator.output,
        pipelinePressure: isFault ? 1.2 : data.pipeline.pressure,
        environment: isFault ? { ...data.environment, blizzard: true } : data.environment,
        timestamp: data.timestamp,
      };

      return {
        stationState: nextState,
        // Sync to cloud only if satellite is online
        cloudState: s.stationState.satelliteOnline ? nextState : s.cloudState,
      };
    }),

  setHoveredRoom: (id) =>
    set((s) => ({ stationState: { ...s.stationState, hoveredRoom: id } })),

  triggerFault: () =>
    set((s) => {
      const nextState = {
        ...s.stationState,
        faultModeActive: true,
        generatorFuel: 8,
        pipelinePressure: 1.2,
        environment: { ...s.stationState.environment, blizzard: true },
        roomStatus: { habitat: "critical", laboratory: "critical", workshop: "critical" } as Record<RoomId, SensorStatus>,
      };
      return {
        stationState: nextState,
        cloudState: s.stationState.satelliteOnline ? nextState : s.cloudState,
      };
    }),
    
  clearFault: () =>
    set((s) => {
      const nextState = {
        ...s.stationState,
        faultModeActive: false,
      };
      return {
        stationState: nextState,
        cloudState: s.stationState.satelliteOnline ? nextState : s.cloudState,
      };
    }),

  addReorderRequest: (item, quantity) =>
    set((s) => {
      const newReq: ReorderRequest = {
        id: `REQ-${Date.now()}`,
        itemName: item,
        quantity,
        station: "Bharati",
        requestedAt: new Date().toLocaleTimeString(),
        status: "pending",
      };
      return {
        stationState: { ...s.stationState, reorderRequests: [...s.stationState.reorderRequests, newReq] },
        cloudState: { ...s.cloudState, reorderRequests: [...s.cloudState.reorderRequests, newReq] },
      };
    }),

  updateReorderStatus: (id, status, eta, approvedBy) =>
    set((s) => {
      const updateFn = (reqs: ReorderRequest[]) => reqs.map((r) => (r.id === id ? { ...r, status, eta, approvedBy } : r));
      return {
        stationState: { ...s.stationState, reorderRequests: updateFn(s.stationState.reorderRequests) },
        cloudState: { ...s.cloudState, reorderRequests: updateFn(s.cloudState.reorderRequests) },
      };
    }),

sendMessage: (from, content, priority) =>
  set((s) => {
    const now = new Date().toLocaleTimeString();
    const newMessage: StationMessage = {
      id: `msg-${Date.now()}`,
      from,
      content,
      timestamp: now,
      read: false,
      priority,
    };

    // If satellite offline AND message from station,
    // queue it instead of sending
    if (!s.stationState.satelliteOnline && from === "station") {
      return {
        stationState: {
          ...s.stationState,
          pendingMessages: [
            ...s.stationState.pendingMessages,
            {
              ...newMessage,
              content: `[QUEUED - will sync on reconnect] ${content}`,
            },
          ],
        },
      };
    }

    // Satellite online - send immediately
    return {
      stationState: {
        ...s.stationState,
        messages: [...s.stationState.messages, newMessage],
      },
    };
  }),
    

  markMessagesRead: () =>
    set((s) => {
      const updateFn = (msgs: StationMessage[]) => msgs.map((m) => ({ ...m, read: true }));
      return {
        stationState: {
          ...s.stationState,
          messages: updateFn(s.stationState.messages),
        },
        cloudState: {
          ...s.cloudState,
          messages: updateFn(s.cloudState.messages),
        },
      };
    }),

  activateProtocol: (id) =>
    set((s) => {
      const now = new Date().toLocaleTimeString();
      const protocol = s.stationState.activeProtocols.find((p: ProtocolState) => p.id === id);
      if (!protocol || protocol.active) return s;
      
      const updatedProtocols = s.stationState.activeProtocols.map((p: ProtocolState) =>
        p.id === id ? { ...p, active: true, activatedAt: now } : p
      );
      
      const autoMessage: StationMessage = {
        id: `msg-${Date.now()}`,
        from: "station",
        content: `🚨 PROTOCOL ACTIVATED: ${protocol.name} triggered at ${now}. Station crew implementing emergency procedures.`,
        timestamp: now,
        read: false,
        priority: "urgent",
      };

      if (!s.stationState.satelliteOnline) {
        return {
          stationState: {
            ...s.stationState,
            activeProtocols: updatedProtocols,
            pendingMessages: [...s.stationState.pendingMessages, autoMessage],
          },
        };
      }

      return {
        stationState: {
          ...s.stationState,
          activeProtocols: updatedProtocols,
          messages: [...s.stationState.messages, autoMessage],
        },
        cloudState: {
          ...s.cloudState,
          activeProtocols: updatedProtocols,
          messages: [...s.cloudState.messages, autoMessage],
        },
      };
    }),

  deactivateProtocol: (id) =>
    set((s) => {
      const updateFn = (protocols: ProtocolState[]) => protocols.map(p =>
        p.id === id
          ? {
              ...p,
              active: false,
              activatedAt: null,
              checklist: p.checklist.map(item => ({
                ...item,
                checked: false,
                checkedAt: null,
                checkedBy: null,
              })),
            }
          : p
      );

      return {
        stationState: {
          ...s.stationState,
          activeProtocols: updateFn(s.stationState.activeProtocols),
        },
        cloudState: {
          ...s.cloudState,
          activeProtocols: updateFn(s.cloudState.activeProtocols),
        },
      };
    }),

  checkProtocolItem: (protocolId, itemIndex, checkedBy) =>
    set((s) => {
      const now = new Date().toLocaleTimeString();
      const updateFn = (protocols: ProtocolState[]) => protocols.map(p => {
        if (p.id !== protocolId) return p;
        const newChecklist = [...p.checklist];
        newChecklist[itemIndex] = {
          ...newChecklist[itemIndex],
          checked: !newChecklist[itemIndex].checked,
          checkedAt: now,
          checkedBy,
        };
        return { ...p, checklist: newChecklist };
      });
      return {
        stationState: {
          ...s.stationState,
          activeProtocols: updateFn(s.stationState.activeProtocols),
        },
        cloudState: {
          ...s.cloudState,
          activeProtocols: updateFn(s.cloudState.activeProtocols),
        },
      };
    }),
  }),
  {
    name: "polartwin-store",
    partialize: (state) => ({
      messages: state.stationState.messages,
      reorderRequests: state.stationState.reorderRequests,
      activeProtocols: state.stationState.activeProtocols,
    }),
    merge: (persisted: any, current: StationStore) => ({
      ...current,
      stationState: {
        ...current.stationState,
        messages: persisted.messages ?? current.stationState.messages,
        reorderRequests: persisted.reorderRequests ?? current.stationState.reorderRequests,
        activeProtocols: persisted.activeProtocols ?? current.stationState.activeProtocols,
      },
      cloudState: {
        ...current.cloudState,
        messages: persisted.messages ?? current.cloudState.messages,
        reorderRequests: persisted.reorderRequests ?? current.cloudState.reorderRequests,
        activeProtocols: persisted.activeProtocols ?? current.cloudState.activeProtocols,
      },
    }),
  }
)
);

// Cross-tab sync — when one tab writes to localStorage,
// other tabs re-hydrate automatically
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === "polartwin-store") {
      useStationStore.persist.rehydrate();
    }
  });
}