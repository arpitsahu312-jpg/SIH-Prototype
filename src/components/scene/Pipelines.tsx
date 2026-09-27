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
        points={[[-5.5, 0.3, 0.5], [0, 0.3, 0], [5.0, 0.3, 0]]}
        radius={0.156}
        styleKey="fuel"
      />
      <PipelineTube
        points={[[5.0, 0.32, 0.3], [0, 0.32, 0.45], [-1.4, 0.32, 0.45]]}
        radius={0.117}
        styleKey="water"
      />
      <PipelineTube
        points={[[5.0, 0.32, -0.3], [0, 0.32, -0.45], [1.4, 0.32, -0.45]]}
        radius={0.117}
        styleKey="water"
      />
      <PipelineTube
        points={[[5.0, 0.34, 0.2], [0, 0.34, 0], [0, 1.52, 0]]}
        radius={0.104}
        styleKey="power"
      />
      <PipelineTube
        points={[[-5.5, 0.34, 0.2], [-2, 0.34, 0.3], [-1.4, 0.34, 0.45]]}
        radius={0.104}
        styleKey="power"
      />
      <PipelineTube
        points={[[-4.8, 0.36, -2.0], [-2, 0.36, -1.0], [-1.4, 0.36, 0.45]]}
        radius={0.0715}
        styleKey="data"
      />
      <PipelineTube
        points={[[-4.8, 0.36, -2.0], [0, 0.36, -0.5], [1.4, 0.36, -0.45]]}
        radius={0.0715}
        styleKey="data"
      />
    </group>
  );
}
