"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, OrthographicCamera } from "@react-three/drei";
import StationModel from "./StationModel";

export default function StationCanvas() {
  return (
    <Canvas className="h-full w-full" gl={{ antialias: true }}>
      <OrthographicCamera makeDefault position={[6, 35, 6]} zoom={120} near={0.1} far={500} />
      <color attach="background" args={["#020917"]} />
      <fog attach="fog" args={["#020917", 30, 58]} />

      <ambientLight intensity={0.5} />
      <directionalLight position={[8, 12, 6]} intensity={1.6} />
      <directionalLight position={[-6, 4, -8]} intensity={0.35} color="#93c5fd" />

      <pointLight position={[-1.4, 0.78, 0.45]} color="#00e5ff" intensity={8} distance={5} decay={2} />
      <pointLight position={[1.4, 0.78, -0.45]} color="#00e5ff" intensity={8} distance={5} decay={2} />
      <pointLight position={[0, 1.52, 0]} color="#00e5ff" intensity={8} distance={5} decay={2} />

      <StationModel />

      <OrbitControls
        enableDamping={true}
        dampingFactor={0.05}
        enableRotate={true}
        enableZoom={true}
        minZoom={30}
        maxZoom={140}
        enablePan={true}
      />
    </Canvas>
  );
}
