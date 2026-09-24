"use client";

import { useMemo } from "react";
import { CatmullRomCurve3, Vector3 } from "three";

const PIPELINE_STYLES = {
  fuel:  { color: "#f59e0b", emissive: "#f59e0b", emissiveIntensity: 0.35 },
  water: { color: "#3b82f6", emissive: "#3b82f6", emissiveIntensity: 0.25 },
  power: { color: "#ef4444", emissive: "#ef4444", emissiveIntensity: 0.30 },
  data:  { color: "#22d3ee", emissive: "#22d3ee", emissiveIntensity: 0.25 },
};

type StyleKey = keyof typeof PIPELINE_STYLES;

function PipelineTube({
  points,
  radius = 0.05,
  styleKey,
}: {
  points: [number, number, number][];
  radius?: number;
  styleKey: StyleKey;
}) {
  const curve = useMemo(
    () => new CatmullRomCurve3(points.map(([x, y, z]) => new Vector3(x, y, z))),
    []
  );
  const style = PIPELINE_STYLES[styleKey];
  return (
    <mesh>
      <tubeGeometry args={[curve, 24, radius, 8, false]} />
      <meshStandardMaterial
        color={style.color}
        emissive={style.emissive}
        emissiveIntensity={style.emissiveIntensity}
        metalness={0.6}
        roughness={0.25}
      />
    </mesh>
  );
}

export default function Pipelines() {
  return (
    <group>
      <PipelineTube
        points={[[-2.4, 0.05, 0], [0.9, 0.05, 0], [4.2, 0.05, 0]]}
        radius={0.07}
        styleKey="fuel"
      />
      <PipelineTube
        points={[[-2.4, 0.07, 0.4], [-0.8, 0.07, 1.0], [0.4, 0.07, 1.6]]}
        radius={0.055}
        styleKey="water"
      />
      <PipelineTube
        points={[[-2.4, 0.07, -0.4], [-0.8, 0.07, -1.0], [0.2, 0.07, -1.8]]}
        radius={0.055}
        styleKey="water"
      />
      <PipelineTube
        points={[[4.2, 0.09, 0.3], [2.5, 0.09, 1.0], [0.4, 0.09, 1.6]]}
        radius={0.045}
        styleKey="power"
      />
      <PipelineTube
        points={[[4.2, 0.09, -0.3], [2.5, 0.09, -1.0], [0.2, 0.09, -1.8]]}
        radius={0.045}
        styleKey="power"
      />
      <PipelineTube
        points={[[-2.4, 0.11, 0.6], [-1.0, 0.11, 1.1], [0.4, 0.11, 1.6]]}
        radius={0.03}
        styleKey="data"
      />
      <PipelineTube
        points={[[-2.4, 0.11, -0.6], [-1.0, 0.11, -1.1], [0.2, 0.11, -1.8]]}
        radius={0.03}
        styleKey="data"
      />
    </group>
  );
}
