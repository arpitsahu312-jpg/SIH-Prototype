"use client";

import { useEffect, useRef } from "react";
import type { MeshStandardMaterial } from "three";
import {
  fuelToStatus,
  STATUS_COLORS,
  useStationStore,
  type RoomId,
  type SensorStatus,
  type StationStore,
} from "@/lib/store";
import Pipelines from "./Pipelines";

const ROOM_META: Record<RoomId, { 
  label: string; 
  equipment: string[] 
}> = {
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

const selectRoomStatus: Record<
  RoomId,
  (state: StationStore) => SensorStatus
> = {
  habitat: (state) => state.stationState.roomStatus.habitat,
  laboratory: (state) => state.stationState.roomStatus.laboratory,
  workshop: (state) => state.stationState.roomStatus.workshop,
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
    return useStationStore.subscribe(
      (state) => apply(selectStatus(state))
    );
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

function RoomMesh({
  roomId,
  position,
  args,
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
        emissiveIntensity={0.55}
        transparent={true}
        opacity={0.68}
        roughness={0.5}
        metalness={0.1}
        depthWrite={false}
      />
    </mesh>
  );
}

function GeneratorMesh() {
  const materialRef = useStatusMaterial(selectGeneratorStatus);

  return (
    <mesh position={[4.2, 0.7, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[0.55, 0.55, 1.4, 24]} />
      <meshStandardMaterial
        ref={materialRef}
        color={STATUS_COLORS.normal}
        metalness={0.35}
        roughness={0.35}
      />
    </mesh>
  );
}

export default function StationModel() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[28, 28]} />
        <meshStandardMaterial color="#09090b" metalness={0.1} roughness={0.9} />
      </mesh>

      <Pipelines />
      <RoomMesh roomId="habitat" position={[-2.4, 0.7, 0]} args={[2.4, 1.4, 2.2]} />
      <RoomMesh
        roomId="laboratory"
        position={[0.4, 0.55, 1.6]}
        args={[2, 1.1, 1.8]}
      />
      <RoomMesh
        roomId="workshop"
        position={[0.2, 0.5, -1.8]}
        args={[1.8, 1, 1.6]}
      />

      <GeneratorMesh />
    </group>
  );
}
