"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, OrbitControls } from "@react-three/drei";
import type { Group, Mesh } from "three";
import { ZONES } from "@/lib/zones";

const SEED_COLORS = ["#8ecb98", "#facc15", "#fb923c", "#f472b6", "#38bdf8", "#f59e0b", "#a3e635"];

function Globe() {
  const wire = useRef<Mesh>(null);
  useFrame((_, delta) => {
    if (wire.current) wire.current.rotation.y += delta * 0.08;
  });
  return (
    <group>
      <mesh castShadow>
        <icosahedronGeometry args={[1.35, 3]} />
        <meshStandardMaterial color="#2a733c" roughness={0.85} metalness={0.05} flatShading />
      </mesh>
      <mesh ref={wire} scale={1.012}>
        <icosahedronGeometry args={[1.35, 2]} />
        <meshBasicMaterial color="#bbe1c0" wireframe transparent opacity={0.35} />
      </mesh>
      {ZONES.map((z, i) => {
        const phi = Math.acos(-1 + (2 * (i + 1)) / ZONES.length);
        const theta = Math.sqrt(ZONES.length * Math.PI) * phi;
        const r = 1.37;
        return (
          <mesh
            key={z.id}
            position={[
              r * Math.cos(theta) * Math.sin(phi),
              r * Math.cos(phi),
              r * Math.sin(theta) * Math.sin(phi),
            ]}
          >
            <sphereGeometry args={[0.07, 16, 16]} />
            <meshStandardMaterial color={z.color} emissive={z.color} emissiveIntensity={0.45} />
          </mesh>
        );
      })}
    </group>
  );
}

function OrbitingSeeds() {
  const group = useRef<Group>(null);
  useFrame((state) => {
    if (!group.current) return;
    group.current.rotation.y = state.clock.elapsedTime * 0.22;
    group.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.12;
  });
  return (
    <group ref={group}>
      {SEED_COLORS.map((color, i) => {
        const angle = (i / SEED_COLORS.length) * Math.PI * 2;
        const radius = 2.15 + (i % 3) * 0.22;
        const y = Math.sin(angle * 2.4) * 0.75;
        return (
          <Float key={color} speed={2.2} rotationIntensity={1.4} floatIntensity={0.7}>
            <mesh position={[Math.cos(angle) * radius, y, Math.sin(angle) * radius]}>
              <dodecahedronGeometry args={[0.14 + (i % 3) * 0.035, 0]} />
              <meshStandardMaterial color={color} roughness={0.45} metalness={0.15} flatShading />
            </mesh>
          </Float>
        );
      })}
    </group>
  );
}

export default function FieldScene() {
  return (
    <Canvas
      dpr={[1, 1.8]}
      camera={{ position: [0, 0.6, 5.1], fov: 42 }}
      gl={{ antialias: true, alpha: true }}
      style={{ width: "100%", height: "100%" }}
    >
      <ambientLight intensity={1.15} />
      <directionalLight position={[4, 6, 5]} intensity={1.7} />
      <directionalLight position={[-5, -2, -4]} intensity={0.45} color="#bbe1c0" />
      <Globe />
      <OrbitingSeeds />
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.55}
        rotateSpeed={0.55}
      />
    </Canvas>
  );
}
