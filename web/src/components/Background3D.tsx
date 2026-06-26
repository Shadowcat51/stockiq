"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Helper to create a texture for the coin faces
function createCoinTexture(text: string, bgColor: string, textColor: string) {
  if (typeof window === "undefined") return new THREE.Texture(); // SSR safety

  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    // Fill background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, 512, 512);

    // Draw outer ring
    ctx.strokeStyle = textColor;
    ctx.lineWidth = 15;
    ctx.beginPath();
    ctx.arc(256, 256, 230, 0, Math.PI * 2);
    ctx.stroke();

    // Draw inner dashed ring for detail
    ctx.strokeStyle = textColor;
    ctx.lineWidth = 4;
    ctx.setLineDash([10, 15]);
    ctx.beginPath();
    ctx.arc(256, 256, 210, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Text
    ctx.fillStyle = textColor;
    ctx.font = "bold 160px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 256, 256);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 16;
  return texture;
}

function CoinGroup({ materials, count = 25 }: { materials: THREE.Material[], count?: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Initialize random data for each coin instance
  const data = useMemo(() => {
    return Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * 25,
      y: (Math.random() - 0.5) * 30, // spread vertically
      z: (Math.random() - 0.5) * 15 - 5,
      rotX: Math.random() * Math.PI,
      rotY: Math.random() * Math.PI,
      rotZ: Math.random() * Math.PI,
      speedY: Math.random() * 3 + 1.5, // falling speed
      rotSpeedX: (Math.random() - 0.5) * 3,
      rotSpeedY: (Math.random() - 0.5) * 3,
      scale: Math.random() * 0.4 + 0.4,
    }));
  }, [count]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    data.forEach((d, i) => {
      // Update physics
      d.y -= d.speedY * delta;
      d.rotX += d.rotSpeedX * delta;
      d.rotY += d.rotSpeedY * delta;

      // Reset at top when falling past bottom threshold
      if (d.y < -15) {
        d.y = 15;
        d.x = (Math.random() - 0.5) * 20;
        d.speedY = Math.random() * 3 + 1.5;
        d.rotSpeedX = (Math.random() - 0.5) * 3;
        d.rotSpeedY = (Math.random() - 0.5) * 3;
      }

      // Apply transformation to dummy object
      dummy.position.set(d.x, d.y, d.z);
      dummy.rotation.set(d.rotX, d.rotY, d.rotZ);
      dummy.scale.set(d.scale, d.scale, d.scale);
      dummy.updateMatrix();

      // Update instance matrix
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, materials, count]}>
      <cylinderGeometry args={[1, 1, 0.15, 32]} />
    </instancedMesh>
  );
}

function FallingCoinsScene() {
  // Generate Textures & Materials
  const materials = useMemo(() => {
    const gold = "#eab308";
    const darkGold = "#854d0e";
    const silver = "#94a3b8";
    const darkSilver = "#334155";

    const commonParams = { roughness: 0.3, metalness: 0.8 };

    // Gold Materials
    const goldSideMat = new THREE.MeshStandardMaterial({ color: gold, ...commonParams });
    const texDollar = createCoinTexture("$", gold, darkGold);
    const texOne = createCoinTexture("1", gold, darkGold);
    const texTen = createCoinTexture("10", gold, darkGold);

    const matDollarTop = new THREE.MeshStandardMaterial({ map: texDollar, ...commonParams });
    const matOneBottom = new THREE.MeshStandardMaterial({ map: texOne, ...commonParams });
    const matTenBottom = new THREE.MeshStandardMaterial({ map: texTen, ...commonParams });

    // Silver Materials
    const silverSideMat = new THREE.MeshStandardMaterial({ color: silver, ...commonParams });
    const texRupiah = createCoinTexture("Rp", silver, darkSilver);
    const texFiveHundred = createCoinTexture("500", silver, darkSilver);
    const texOneThousand = createCoinTexture("1000", silver, darkSilver);

    const matRupiahTop = new THREE.MeshStandardMaterial({ map: texRupiah, ...commonParams });
    const matFiveHundredBottom = new THREE.MeshStandardMaterial({ map: texFiveHundred, ...commonParams });
    const matOneThousandBottom = new THREE.MeshStandardMaterial({ map: texOneThousand, ...commonParams });

    return {
      dollar1: [goldSideMat, matDollarTop, matOneBottom],
      dollar10: [goldSideMat, matDollarTop, matTenBottom],
      rupiah500: [silverSideMat, matRupiahTop, matFiveHundredBottom],
      rupiah1000: [silverSideMat, matRupiahTop, matOneThousandBottom],
    };
  }, []);

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 15, 10]} intensity={1.5} />
      <directionalLight position={[-10, -10, -10]} intensity={0.5} color="#3b82f6" />

      {/* 4 Variants of Coins */}
      <CoinGroup materials={materials.dollar1} count={25} />
      <CoinGroup materials={materials.dollar10} count={25} />
      <CoinGroup materials={materials.rupiah500} count={25} />
      <CoinGroup materials={materials.rupiah1000} count={25} />
    </>
  );
}

export default function Background3D() {
  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none bg-background">
      <Canvas camera={{ position: [0, 0, 8], fov: 60 }}>
        <fog attach="fog" args={["#000000", 5, 20]} />
        <FallingCoinsScene />
      </Canvas>
      {/* Overlay gradient to blend the 3D coins with the page content */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/70 to-background pointer-events-none"></div>
    </div>
  );
}
