"use client";

import { useEffect, useRef } from "react";
import type { MeshStandardMaterial } from "three";
import {
  fuelToStatus,
  pressureToStatus,
  STATUS_COLORS,
  useStationStore,
  type RoomId,
  type SensorStatus,
  type StationStore,
} from "@/lib/store";

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

const selectPipelineStatus = (state: StationStore) =>
  pressureToStatus(state.stationState.pipelinePressure);

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

function RoomMesh({
  roomId,
  position,
  args,
}: {
  roomId: RoomId;
  position: [number, number, number];
  args: [number, number, number];
}) {
  const materialRef = useStatusMaterial(selectRoomStatus[roomId]);

  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={args} />
      <meshStandardMaterial
        ref={materialRef}
        color={STATUS_COLORS.normal}
        metalness={0.15}
        roughness={0.5}
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

function PipelineSegment({
  position,
  rotation,
  args,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  args: [number, number, number, number];
}) {
  const materialRef = useStatusMaterial(selectPipelineStatus);

  return (
    <mesh position={position} rotation={rotation} castShadow>
      <cylinderGeometry args={args} />
      <meshStandardMaterial
        ref={materialRef}
        color={STATUS_COLORS.normal}
        metalness={0.55}
        roughness={0.25}
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

      <PipelineSegment
        position={[2.1, 0.18, 0]}
        rotation={[0, 0, Math.PI / 2]}
        args={[0.08, 0.08, 3.2, 16]}
      />
      <PipelineSegment
        position={[3.7, 0.18, 0.9]}
        rotation={[Math.PI / 2, 0, 0]}
        args={[0.08, 0.08, 1.8, 16]}
      />
      <PipelineSegment
        position={[3.7, 0.18, -0.9]}
        rotation={[Math.PI / 2, 0, 0]}
        args={[0.08, 0.08, 1.8, 16]}
      />
    </group>
  );
}
