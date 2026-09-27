/**
 * StationModel 3D Component
 * 
 * Renders the 3D representation of the Bharati Research Station using React Three Fiber.
 * Contains sub-components for the wireframe exterior (BharatiShell), the internal rooms 
 * (RoomMesh) which dynamically change color based on telemetry, and external equipment 
 * (GeneratorMesh, SatelliteDish, AntennaMast, FuelTanks).
 * 
 * It listens directly to the Zustand store via custom hooks to avoid full re-renders 
 * on telemetry updates, updating only the specific Three.js materials.
 */
"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Edges, Html } from "@react-three/drei";
import type { MeshStandardMaterial, Mesh } from "three";
import {
  fuelToStatus,
  STATUS_COLORS,
  useStationStore,
  type RoomId,
  type SensorStatus,
  type StationStore,
} from "@/lib/store";
import Pipelines from "./Pipelines";

const selectRoomStatus: Record<RoomId, (state: StationStore) => SensorStatus> = {
  habitat:    (state) => state.stationState.roomStatus.habitat,
  laboratory: (state) => state.stationState.roomStatus.laboratory,
  workshop:   (state) => state.stationState.roomStatus.workshop,
};

const selectGeneratorStatus = (state: StationStore) =>
  fuelToStatus(state.stationState.generatorFuel);

const GLASS_EMISSIVE: Record<SensorStatus, { color: string; intensity: number }> = {
  normal:   { color: "#00ff88", intensity: 0.55 },
  warning:  { color: "#f59e0b", intensity: 0.45 },
  critical: { color: "#ef4444", intensity: 0.55 },
};

function useStatusMaterial(selectStatus: (state: StationStore) => SensorStatus) {
  const materialRef = useRef<MeshStandardMaterial>(null);
  useEffect(() => {
    const apply = (status: SensorStatus) => {
      materialRef.current?.color.set(STATUS_COLORS[status]);
    };
    apply(selectStatus(useStationStore.getState()));
    return useStationStore.subscribe((state) => apply(selectStatus(state)));
  }, [selectStatus]);
  return materialRef;
}

function useGlassStatusMaterial(
  selectStatus: (state: StationStore) => SensorStatus,
  roomId: RoomId
) {
  const materialRef = useRef<MeshStandardMaterial>(null);
  useEffect(() => {
    const apply = (status: SensorStatus, hovered: boolean) => {
      if (!materialRef.current) return;
      materialRef.current.emissive.set(GLASS_EMISSIVE[status].color);
      materialRef.current.emissiveIntensity = hovered
        ? GLASS_EMISSIVE[status].intensity * 2.8
        : GLASS_EMISSIVE[status].intensity;
      materialRef.current.opacity = hovered ? 0.90 : 0.68;
    };
    const getHovered = () =>
      useStationStore.getState().stationState.hoveredRoom === roomId;
    apply(selectStatus(useStationStore.getState()), getHovered());
    return useStationStore.subscribe((state) =>
      apply(selectStatus(state), state.stationState.hoveredRoom === roomId)
    );
  }, [selectStatus, roomId]);
  return materialRef;
}

// Animated hologram scan line
function ScanLine() {
  const ref = useRef<Mesh>(null);
  useFrame((state) => {
    if (ref.current) {
      const t = (state.clock.elapsedTime * 0.28) % 3.4;
      ref.current.position.y = 0.38 + t;
    }
  });
  return (
    <mesh ref={ref}>
      <boxGeometry args={[7.2, 0.018, 3.0]} />
      <meshStandardMaterial
        color="#00e5ff"
        transparent
        opacity={0.13}
        emissive="#00e5ff"
        emissiveIntensity={1.2}
        depthWrite={false}
      />
    </mesh>
  );
}

// // Holographic grid floor
// function HoloGrid() {
//   const gridLines = [];
//   for (let i = -5; i <= 5; i++) {
//     gridLines.push(
//       <mesh key={`gx${i}`} position={[i * 0.9, 0, 0]}>
//         <boxGeometry args={[0.012, 0.004, 11]} />
//         <meshStandardMaterial color="#00e5ff" transparent opacity={0.22}
//           emissive="#00e5ff" emissiveIntensity={0.6} depthWrite={false} />
//       </mesh>
//     );
//     gridLines.push(
//       <mesh key={`gz${i}`} position={[0, 0, i * 0.9]}>
//         <boxGeometry args={[11, 0.004, 0.012]} />
//         <meshStandardMaterial color="#00e5ff" transparent opacity={0.22}
//           emissive="#00e5ff" emissiveIntensity={0.6} depthWrite={false} />
//       </mesh>
//     );
//   }
//   return <group position={[0, 0.01, 0]}>{gridLines}</group>;
// }

// Hologram emitter platform base
function HoloPlatform() {
  return (
    <group>
      <mesh position={[0, -0.06, 0]}>
        <cylinderGeometry args={[7.5, 7.5, 0.12, 32]} />
        <meshStandardMaterial color="#1a2a3a" metalness={0} roughness={1} />
      </mesh>
      <mesh position={[0, 0.005, 0]}>
        <cylinderGeometry args={[7.4, 7.4, 0.01, 32]} />
        <meshStandardMaterial color="#00e5ff" transparent opacity={0.35}
          emissive="#00e5ff" emissiveIntensity={0.8} depthWrite={false} />
      </mesh>
      <mesh position={[0, -0.06, 0]}>
        <cylinderGeometry args={[7.52, 7.52, 0.12, 32, 1, true]} />
        <meshStandardMaterial color="#00b4d8" transparent opacity={0.18}
          emissive="#0096c7" emissiveIntensity={0.5} side={2} depthWrite={false} />
      </mesh>
      <mesh position={[0, -0.12, 0]}>
        <cylinderGeometry args={[7.8, 7.8, 0.06, 32]} />
        <meshStandardMaterial color="#0f1e2e" metalness={0} roughness={1} />
      </mesh>
    </group>
  );
}

// Bharati wireframe exterior shell — 3 floors based on real architecture
function BharatiShell() {
  return (
    <group>
      {/* STILT LEGS — 8 legs */}
      {[[-2.8,-1.1],[-2.8,1.1],[-1.0,-1.1],[-1.0,1.1],
        [0.8,-1.1],[0.8,1.1],[2.6,-1.1],[2.6,1.1]].map(([x,z], i) => (
        <mesh key={i} position={[x as number, 0.19, z as number]} castShadow>
          <cylinderGeometry args={[0.07, 0.07, 0.38, 8]} />
          <meshStandardMaterial color="#00b4d8" transparent opacity={0.7}
            emissive="#0096c7" emissiveIntensity={0.4} metalness={0.8} roughness={0.2} />
        </mesh>
      ))}

      {/* BASE BEAM */}
      <mesh position={[0, 0.36, 0]}>
        <boxGeometry args={[6.4, 0.07, 2.6]} />
        <meshStandardMaterial color="#00b4d8" transparent opacity={0.3}
          emissive="#0096c7" emissiveIntensity={0.3} />
      </mesh>

      {/* FLOOR 1 — Ground floor: Labs + Workshop (y 0.4 to 1.15) */}
      <mesh position={[0, 0.775, 0]}>
        <boxGeometry args={[7.5, 0.70, 3.0]} />
        <meshStandardMaterial color="#001830" transparent opacity={0.06}
          emissive="#003050" emissiveIntensity={0.3} depthWrite={false} />
        <Edges color="#00d4ff" lineWidth={0.8} />
      </mesh>
      {/* Floor 1 divider wall */}
      <mesh position={[0.4, 0.775, 0]}>
        <boxGeometry args={[0.03, 0.75, 2.5]} />
        <meshStandardMaterial color="#00e5ff" transparent opacity={0.15}
          emissive="#00d4ff" emissiveIntensity={1.2} depthWrite={false} />
      </mesh>
      {/* Floor 1 container grid lines (horizontal) */}
      {[-0.35, 0, 0.35].map((y, i) => (
        <mesh key={i} position={[0, 0.4 + y + 0.375, 1.26]}>
          <boxGeometry args={[6.2, 0.018, 0.01]} />
          <meshStandardMaterial color="#0096c7" transparent opacity={0.5}
            emissive="#0096c7" emissiveIntensity={0.4} />
        </mesh>
      ))}
      {/* Floor 1 vertical container lines */}
      {[-2.4,-1.1,0.2,1.5,2.8].map((x, i) => (
        <mesh key={i} position={[x, 0.775, 1.26]}>
          <boxGeometry args={[0.018, 0.75, 0.01]} />
          <meshStandardMaterial color="#0096c7" transparent opacity={0.4}
            emissive="#0096c7" emissiveIntensity={0.3} />
        </mesh>
      ))}

      <mesh position={[0, 1.15, 0]} renderOrder={10}>
        <boxGeometry args={[7.6, 0.05, 3.1]} />
        <meshStandardMaterial color="#00e5ff" transparent={false}
          emissive="#00e5ff" emissiveIntensity={0.6}/>
      </mesh>

      {/* FLOOR 2 — Residential + Common areas (y 1.15 to 1.9) */}
      <mesh position={[0, 1.525, 0]}>
        <boxGeometry args={[7.5, 0.70, 3.0]} />
        <meshStandardMaterial color="#001830" transparent opacity={0.06}
          emissive="#002040" emissiveIntensity={0.3} depthWrite={false} />
        <Edges color="#00d4ff" lineWidth={0.8} />
      </mesh>
      {/* Floor 2 room dividers */}
      <mesh position={[-1.2, 1.525, 0]}>
        <boxGeometry args={[0.03, 0.75, 2.5]} />
        <meshStandardMaterial color="#00d4ff" transparent opacity={0.15}
          emissive="#00d4ff" emissiveIntensity={0.3} depthWrite={false} />
      </mesh>
      <mesh position={[0, 1.15, 0]} renderOrder={10}>
        <boxGeometry args={[0.03, 0.75, 2.5]} />
        <meshStandardMaterial color="#00d4ff" transparent opacity={0.15}
          emissive="#00d4ff" emissiveIntensity={0.3} depthWrite={false} />
      </mesh>
      {/* Floor 2 front face container grid */}
      {[-0.35, 0, 0.35].map((y, i) => (
        <mesh key={i} position={[0, 1.15 + y + 0.375, 1.26]}>
          <boxGeometry args={[6.2, 0.018, 0.01]} />
          <meshStandardMaterial color="#0096c7" transparent opacity={0.5}
            emissive="#0096c7" emissiveIntensity={0.4} />
        </mesh>
      ))}

      <mesh position={[0, 1.9, 0]}>
        <boxGeometry args={[6.4, 0.04, 2.6]} />
        <meshStandardMaterial color="#00e5ff" transparent opacity={0.6}
          emissive="#00e5ff" emissiveIntensity={0.6} depthWrite={false}/>
      </mesh>

      {/* FLOOR 3 — Observation/terrace (smaller footprint) */}
      <mesh position={[0, 2.25, 0]}>
        <boxGeometry args={[6.0, 0.55, 2.4]} />
        <meshStandardMaterial color="#001020" transparent opacity={0.05}
          emissive="#001830" emissiveIntensity={0.2} depthWrite={false} />
        <Edges color="#00b4d8" lineWidth={0.6} />
      </mesh>

      {/* ROOF */}
      <mesh position={[0, 2.52, 0]} castShadow>
        <boxGeometry args={[7.7, 0.09, 3.1]} />
        <meshStandardMaterial color="#00b4d8" transparent opacity={0.2}
          emissive="#0096c7" emissiveIntensity={0.3} />
        <Edges color="#00d4ff" lineWidth={1} />
      </mesh>

      {/* INCLINED END PANELS (narrow sides, 15° angle like real Bharati) */}
      <mesh position={[-3.76, 1.15, 0]} rotation={[0, 0, 0.26]}>
        <boxGeometry args={[0.08, 2.4, 2.5]} />
        <meshStandardMaterial color="#00d4ff" transparent opacity={0.12}
          emissive="#00d4ff" emissiveIntensity={0.4} depthWrite={false} />
        <Edges color="#00e5ff" lineWidth={1.2} />
      </mesh>
      <mesh position={[3.76, 1.15, 0]} rotation={[0, 0, -0.26]}>
        <boxGeometry args={[0.08, 2.4, 2.5]} />
        <meshStandardMaterial color="#00d4ff" transparent opacity={0.12}
          emissive="#00d4ff" emissiveIntensity={0.4} depthWrite={false} />
        <Edges color="#00e5ff" lineWidth={1.2} />
      </mesh>
    </group>
  );
}

// Interior room (telemetry-driven, now properly positioned within floors)
function RoomMesh({
  roomId, position, args,
}: {
  roomId: RoomId;
  position: [number, number, number];
  args: [number, number, number];
}) {
  const materialRef = useGlassStatusMaterial(selectRoomStatus[roomId], roomId);
  const setHoveredRoom = useStationStore((s) => s.setHoveredRoom);
  return (
    <mesh
      position={position}
      castShadow
      receiveShadow
      onPointerOver={(e) => { e.stopPropagation(); setHoveredRoom(roomId); }}
      onPointerOut={() => setHoveredRoom(null)}
    >
      <boxGeometry args={args} />
      <meshStandardMaterial
        ref={materialRef}
        color="#0d4535"
        emissive="#00ff88"
        emissiveIntensity={0.4}
        transparent={true}
        opacity={0.5}
        roughness={0.5}
        metalness={0.1}
        depthWrite={false}
      />
    </mesh>
  );
}

// Generator (outside station, right side)
function GeneratorMesh() {
  const materialRef = useStatusMaterial(selectGeneratorStatus);
  return (
    <group position={[5.0, 0.5, 0]}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.45, 0.45, 1.0, 16]} />
        <meshStandardMaterial ref={materialRef} color={STATUS_COLORS.normal}
          metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.48, 0.48, 1.02, 16, 1, true]} />
        <meshStandardMaterial color="#00d4ff" transparent opacity={0.25}
          emissive="#00d4ff" emissiveIntensity={0.3} side={2} />
      </mesh>
      <Html position={[0, 1.0, 0]} center zIndexRange={[1, 10]} style={{ pointerEvents: "none" }}>
        <div style={{
          color: "#00d4ff", fontSize: "8px", fontFamily: "monospace",
          background: "rgba(0,10,30,0.8)", padding: "2px 6px",
          border: "1px solid rgba(0,212,255,0.4)", borderRadius: "3px",
          whiteSpace: "nowrap", letterSpacing: "0.5px",
        }}>
          CHP UNIT
        </div>
      </Html>
    </group>
  );
}

// External satellite dish
function SatelliteDish() {
  return (
    <group position={[-4.8, 0.0, -2.0]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.04, 0.04, 1.6, 8]} />
        <meshStandardMaterial color="#00b4d8" transparent opacity={0.8}
          emissive="#0096c7" emissiveIntensity={0.3} metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.85, 0.2]} rotation={[0.5, 0, 0]} castShadow>
        <coneGeometry args={[0.38, 0.1, 16, 1, true]} />
        <meshStandardMaterial color="#00e5ff" transparent opacity={0.5}
          emissive="#00e5ff" emissiveIntensity={0.4} side={2} />
      </mesh>
      <mesh position={[0, 0.82, 0.4]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.9} />
      </mesh>
      <Html position={[0, 2.0, 0]} center zIndexRange={[1, 10]} style={{ pointerEvents: "none" }}>
        <div style={{
          color: "#f59e0b", fontSize: "8px", fontFamily: "monospace",
          background: "rgba(0,10,30,0.8)", padding: "2px 5px",
          border: "1px solid rgba(245,158,11,0.4)", borderRadius: "3px",
          whiteSpace: "nowrap",
        }}>
          SAT LINK
        </div>
      </Html>
    </group>
  );
}

// Antenna mast
function AntennaMast() {
  return (
    <group position={[4.5, 0.0, -2.5]}>
      <mesh castShadow>
        <boxGeometry args={[0.05, 3.8, 0.05]} />
        <meshStandardMaterial color="#00b4d8" transparent opacity={0.7}
          emissive="#0096c7" emissiveIntensity={0.3} metalness={0.8} roughness={0.2} />
      </mesh>
      {[1.6, 1.0].map((y, i) => (
        <mesh key={i} position={[0, y, 0]} castShadow>
          <boxGeometry args={[0.8 - i * 0.2, 0.03, 0.03]} />
          <meshStandardMaterial color="#00b4d8" transparent opacity={0.6}
            emissive="#0096c7" emissiveIntensity={0.3} metalness={0.8} roughness={0.2} />
        </mesh>
      ))}
      <mesh position={[0, 1.98, 0]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1.5} />
      </mesh>
    </group>
  );
}

// Fuel storage tanks
function FuelTanks() {
  return (
    <group position={[-5.5, 0.0, 0.5]}>
      {[0, 1.4].map((z, i) => (
        <group key={i} position={[0, 0.45, z]}>
          <mesh rotation={[0, 0, Math.PI/2]} castShadow>
            <cylinderGeometry args={[0.42, 0.42, 2.2, 16]} />
            <meshStandardMaterial color="#d97706" metalness={0.5} roughness={0.4} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI/2]} castShadow>
            <cylinderGeometry args={[0.44, 0.44, 2.22, 16, 1, true]} />
            <meshStandardMaterial color="#00d4ff" transparent opacity={0.15}
              emissive="#00d4ff" emissiveIntensity={0.2} side={2} />
          </mesh>
        </group>
      ))}
      <Html position={[0, 1.4, 0.7]} center zIndexRange={[1, 10]} style={{ pointerEvents: "none" }}>
        <div style={{
          color: "#d97706", fontSize: "8px", fontFamily: "monospace",
          background: "rgba(0,10,30,0.8)", padding: "2px 5px",
          border: "1px solid rgba(217,119,6,0.4)", borderRadius: "3px",
          whiteSpace: "nowrap",
        }}>
          KEROSENE RESERVE
        </div>
      </Html>
    </group>
  );
}

// // Maitri silhouette (far background)
// function MaitriSilhouette() {
//   return (
//     <group position={[-14, 0, -11]}>
//       <mesh position={[0, 0.5, 0]} castShadow>
//         <boxGeometry args={[4.5, 1.0, 2.0]} />
//         <meshStandardMaterial color="#7f1d1d" roughness={0.9} transparent opacity={0.55} />
//         <Edges color="#dc2626" lineWidth={0.5} />
//       </mesh>
//       <mesh position={[2.8, 0.4, 0.3]} castShadow>
//         <boxGeometry args={[2.0, 0.8, 1.5]} />
//         <meshStandardMaterial color="#6b1414" roughness={0.9} transparent opacity={0.5} />
//         <Edges color="#dc2626" lineWidth={0.4} />
//       </mesh>
//       <mesh position={[-2.5, 0.35, -0.4]} castShadow>
//         <boxGeometry args={[1.5, 0.7, 1.2]} />
//         <meshStandardMaterial color="#6b1414" roughness={0.9} transparent opacity={0.45} />
//         <Edges color="#dc2626" lineWidth={0.4} />
//       </mesh>
//       <mesh position={[1.2, 2.6, 0]} castShadow>
//         <cylinderGeometry args={[0.04, 0.04, 2.5, 8]} />
//         <meshStandardMaterial color="#dc2626" transparent opacity={0.5}
//           emissive="#dc2626" emissiveIntensity={0.2} />
//       </mesh>
//       <Html position={[0, 3.2, 0]} center style={{ pointerEvents: "none" }}>
//         <div style={{
//           color: "rgba(220,38,38,0.65)",
//           fontSize: "7.5px",
//           fontFamily: "monospace",
//           letterSpacing: "1px",
//           textTransform: "uppercase",
//           background: "rgba(0,0,0,0.6)",
//           padding: "2px 6px",
//           borderRadius: "3px",
//           border: "1px solid rgba(220,38,38,0.3)",
//           whiteSpace: "nowrap",
//         }}>
//           MAITRI — 70.77°S
//         </div>
//       </Html>
//     </group>
//   );
// }

export default function StationModel() {
  return (
    <group>
      <HoloPlatform />
      {/* <HoloGrid /> */}

      <BharatiShell />
      <ScanLine />

      {/* 
        Interior rooms repositioned to proper floors:
        Ground floor (Floor 1): Laboratory + Workshop
        Second floor (Floor 2): Habitat (Living quarters)
      */}
      <RoomMesh
        roomId="laboratory"
        position={[-1.6, 0.78, 0.55]}
        args={[3.0, 0.5, 1.15]}
      />
      <Html position={[-1.6, 1.2, 0.55]} center zIndexRange={[1, 10]} style={{ pointerEvents: "none" }}>
        <div style={{
          color: "#22c55e", fontSize: "8px",
          fontFamily: "monospace", letterSpacing: "0.5px",
          background: "rgba(0,10,20,0.7)",
          padding: "1px 5px", borderRadius: "2px",
          border: "1px solid rgba(34,197,94,0.4)",
          whiteSpace: "nowrap",
        }}>
          LABORATORY · SNS-LAB-01/02
        </div>
      </Html>

      <RoomMesh
        roomId="workshop"
        position={[1.6, 0.78, -0.55]}
        args={[3.0, 0.5, 1.15]}
      />
      <Html position={[1.6, 1.2, -0.55]} center zIndexRange={[1, 10]}
        style={{ pointerEvents: "none" }}>
        <div style={{
          color: "#22c55e", fontSize: "8px",
          fontFamily: "monospace", letterSpacing: "0.5px",
          background: "rgba(0,10,20,0.7)",
          padding: "1px 5px", borderRadius: "2px",
          border: "1px solid rgba(34,197,94,0.4)",
          whiteSpace: "nowrap",
        }}>
          WORKSHOP · SNS-WRK-01/02
        </div>
      </Html>

      <RoomMesh
        roomId="habitat"
        position={[0, 1.52, 0]}
        args={[6.5, 0.5, 2.5]}
      />
      <Html position={[0, 2.0, 0]} center zIndexRange={[1, 10]}
        style={{ pointerEvents: "none" }}>
        <div style={{
          color: "#22c55e", fontSize: "8px",
          fontFamily: "monospace", letterSpacing: "0.5px",
          background: "rgba(0,10,20,0.7)",
          padding: "1px 5px", borderRadius: "2px",
          border: "1px solid rgba(34,197,94,0.4)",
          whiteSpace: "nowrap",
        }}>
          LIVING QUARTERS · SNS-HAB-01/02
        </div>
      </Html>

      <Pipelines />
      <GeneratorMesh />
      <SatelliteDish />
      <AntennaMast />
      <FuelTanks />
    </group>
  );
}
