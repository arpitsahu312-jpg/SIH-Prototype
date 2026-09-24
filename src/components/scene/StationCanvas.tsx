"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, OrthographicCamera } from "@react-three/drei";
import StationModel from "./StationModel";

export default function StationCanvas() {
  return (
    <Canvas className="h-full w-full" shadows gl={{ antialias: true }}>
      <OrthographicCamera makeDefault position={[14, 14, 14]} zoom={120} near={0.1} far={500} />
      <color attach="background" args={["#020617"]} />
      <fog attach="fog" args={["#020617", 40, 80]} />

      <ambientLight intensity={0.8} />
      <directionalLight
        position={[8, 12, 6]}
        intensity={2.2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-6, 4, -8]} intensity={0.35} color="#93c5fd" />

      {/* Interior room lights */}
      <pointLight position={[-2.4, 0.7, 0]}   color="#00ff88" intensity={12} distance={5} decay={2} />
      <pointLight position={[0.4,  0.55, 1.6]} color="#00ff88" intensity={10} distance={4.5} decay={2} />
      <pointLight position={[0.2,  0.5, -1.8]} color="#00ff88" intensity={9}  distance={4.5} decay={2} />

      <StationModel />

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        enableRotate={true}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.8}
        minZoom={30}
        maxZoom={140}
        enablePan={true}
      />
    </Canvas>
  );
}
