"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment, ContactShadows, PresentationControls, Sparkles } from "@react-three/drei";
import * as THREE from "three";

const NUM_CANDLES = 40;
const SPACING = 0.4;
const SPEED = 1.5;

function ScrollingCandlesticks() {
  const groupRef = useRef<THREE.Group>(null);
  const candleRefs = useRef<THREE.Group[]>([]);
  const dataRef = useRef<{ x: number, y: number, height: number, wickHeight: number, isUp: boolean }[]>([]);

  // Initialize data
  useMemo(() => {
    let currentY = 0;
    for (let i = 0; i < NUM_CANDLES; i++) {
      const isUp = Math.random() > 0.48; // slight upward bias
      const height = Math.random() * 1.5 + 0.3;
      const wickHeight = height + Math.random() * 1.0;
      currentY += (isUp ? 1 : -1) * (height / 2 + Math.random() * 0.3);
      
      dataRef.current.push({
        x: (NUM_CANDLES / 2) * SPACING - i * SPACING,
        y: currentY,
        height,
        wickHeight,
        isUp,
      });
    }
  }, []);

  useFrame((state, delta) => {
    const data = dataRef.current;
    
    // Move all data to the left
    for (let i = 0; i < NUM_CANDLES; i++) {
      data[i].x -= SPEED * delta;
    }

    // Find the leftmost and rightmost candles
    let minXIndex = 0;
    let maxXIndex = 0;
    for (let i = 1; i < NUM_CANDLES; i++) {
      if (data[i].x < data[minXIndex].x) minXIndex = i;
      if (data[i].x > data[maxXIndex].x) maxXIndex = i;
    }

    // If the leftmost candle goes off screen, recycle it to the right
    if (data[minXIndex].x < -8) {
      const lastCandle = data[maxXIndex];
      const recycledCandle = data[minXIndex];
      
      recycledCandle.x = lastCandle.x + SPACING;
      recycledCandle.isUp = Math.random() > 0.48;
      recycledCandle.height = Math.random() * 1.5 + 0.3;
      recycledCandle.wickHeight = recycledCandle.height + Math.random() * 1.0;
      
      // Calculate new Y to connect visually
      const yDelta = (recycledCandle.isUp ? 1 : -1) * (recycledCandle.height / 2 + Math.random() * 0.3);
      recycledCandle.y = lastCandle.y + yDelta;
    }

    // Calculate average Y to keep the chart centered vertically
    let avgY = 0;
    for (let i = 0; i < NUM_CANDLES; i++) {
      avgY += data[i].y;
    }
    avgY /= NUM_CANDLES;

    if (groupRef.current) {
       // Smoothly center the group
       groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, -avgY, delta * 2);
    }

    // Update meshes
    const colorGreen = new THREE.Color("#22c55e");
    const colorRed = new THREE.Color("#ef4444");

    for (let i = 0; i < NUM_CANDLES; i++) {
      const mesh = candleRefs.current[i];
      if (mesh) {
        mesh.position.x = data[i].x;
        mesh.position.y = data[i].y;
        
        const body = mesh.children[0] as THREE.Mesh;
        const wick = mesh.children[1] as THREE.Mesh;
        
        body.scale.y = THREE.MathUtils.lerp(body.scale.y, data[i].height, delta * 5);
        wick.scale.y = THREE.MathUtils.lerp(wick.scale.y, data[i].wickHeight, delta * 5);
        
        const targetColor = data[i].isUp ? colorGreen : colorRed;
        
        const material = body.material as THREE.MeshStandardMaterial;
        material.color.lerp(targetColor, delta * 5);
        material.emissive.lerp(targetColor, delta * 5);
        
        const wickMat = wick.material as THREE.MeshStandardMaterial;
        wickMat.color.lerp(targetColor, delta * 5);
      }
    }
  });

  return (
    <group ref={groupRef}>
      {dataRef.current.map((_, i) => (
        <group key={i} ref={(el) => { if(el) candleRefs.current[i] = el; }}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.25, 1, 0.25]} />
            <meshStandardMaterial roughness={0.2} metalness={0.8} emissiveIntensity={0.6} />
          </mesh>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[0.03, 0.03, 1, 8]} />
            <meshStandardMaterial roughness={0.3} metalness={0.5} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow />
      <spotLight position={[-10, 20, 10]} angle={0.15} penumbra={1} intensity={2} castShadow />
      
      <PresentationControls 
        global 
        config={{ mass: 2, tension: 500 }} 
        snap={{ mass: 4, tension: 1500 }} 
        rotation={[0, 0.2, 0]} 
        polar={[-Math.PI / 4, Math.PI / 4]} 
        azimuth={[-Math.PI / 2, Math.PI / 2]}
      >
        <Float rotationIntensity={0.2} floatIntensity={0.5} speed={1}>
          <ScrollingCandlesticks />
        </Float>
      </PresentationControls>

      <Sparkles count={50} scale={12} size={2} speed={0.4} opacity={0.3} color="#60a5fa" />
      
      <ContactShadows position={[0, -3.5, 0]} opacity={0.4} scale={25} blur={2.5} far={6} />
      <Environment preset="city" />
    </>
  );
}

export default function Hero3DScene() {
  return (
    <div className="w-full h-full min-h-[400px] touch-none">
      <Canvas shadows camera={{ position: [0, 0, 9], fov: 45 }} style={{ touchAction: 'none' }}>
        <Scene />
      </Canvas>
    </div>
  );
}

