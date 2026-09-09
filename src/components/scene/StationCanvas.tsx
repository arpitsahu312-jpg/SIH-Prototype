"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import StationModel from "./StationModel";

export default function StationCanvas() {
  return (
    <Canvas
      className="h-full w-full"
      shadows
      camera={{ position: [8, 6, 10], fov: 45 }}
      gl={{ antialias: true }}
    >
      <color attach="background" args={["#020617"]} />
      <fog attach="fog" args={["#020617", 12, 36]} />

      <ambientLight intensity={0.25} />
      <directionalLight
        position={[8, 12, 6]}
        intensity={1.4}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-6, 4, -8]} intensity={0.35} color="#93c5fd" />

      <StationModel />

      <OrbitControls
        enableDamping
        minDistance={4}
        maxDistance={24}
        maxPolarAngle={Math.PI / 2.05}
      />
    </Canvas>
  );
}
