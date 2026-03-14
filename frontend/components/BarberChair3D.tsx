"use client";

import { Suspense, useMemo, useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

// Preload GLB immediately — starts fetching before component mounts
useGLTF.preload("/barber_chair.glb");

// ─── 3D Chair Model ───────────────────────────────────────────
function ChairModel() {
    const { scene } = useGLTF("/barber_chair.glb");
    const clonedScene = useMemo(() => scene.clone(true), [scene]);
    const ref = useRef<THREE.Group>(null!);

    useEffect(() => {
        if (clonedScene) {
            const box = new THREE.Box3().setFromObject(clonedScene);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const s = 3 / maxDim;
            clonedScene.scale.setScalar(s);
            clonedScene.position.set(-center.x * s, -center.y * s, -center.z * s);
        }
    }, [clonedScene]);

    useFrame((_, delta) => {
        if (ref.current) ref.current.rotation.y += delta * 0.3;
    });

    return <group ref={ref}><primitive object={clonedScene} /></group>;
}

// ─── Sparkle positions — computed once, stable across renders ──
const SPARKLE_POSITIONS = [0, 1, 2, 3, 4].map(i => ({
    top: `${15 + Math.sin(i * 1.4) * 35}%`,
    left: `${15 + Math.cos(i * 1.3) * 35}%`,
    animationDuration: `${2.5 + i * 0.5}s`,
    animationDelay: `${i * 0.6}s`,
}));

// ─── Main Component ────────────────────────────────────────────
export default function BarberChair3D() {
    const [canvasReady, setCanvasReady] = useState(false);

    // Detect low-end devices once on mount (no re-renders)
    const isLowEnd = useRef<boolean>(false);
    useEffect(() => {
        isLowEnd.current =
            (navigator.hardwareConcurrency ?? 4) <= 2 ||
            window.devicePixelRatio <= 1;
    }, []);

    return (
        <div className="relative w-[350px] h-[350px] md:w-[500px] md:h-[500px] flex items-center justify-center">

            {/* ── Gold ambient glow — pure CSS, instant ── */}
            <div
                className="absolute inset-0 blur-[100px] opacity-25"
                style={{ background: "radial-gradient(circle, #E6B31E, transparent 60%)" }}
            />

            {/* ── Ring decorations — pure CSS, instant ── */}
            <div
                className="absolute inset-[10%] rounded-full border opacity-10"
                style={{ borderColor: "#E6B31E" }}
            />
            <div
                className="absolute inset-[5%] rounded-full border opacity-5 animate-spin"
                style={{
                    borderColor: "#e8c96a",
                    animationDuration: "30s",
                    animationTimingFunction: "linear",
                }}
            />

            {/* ── Sparkle dots — pure CSS, instant ── */}
            {SPARKLE_POSITIONS.map((pos, i) => (
                <div
                    key={i}
                    className="absolute w-1.5 h-1.5 rounded-full bg-[#e8c96a] animate-ping"
                    style={{ ...pos, opacity: 0.6 }}
                />
            ))}

            {/* ── Spinner — only visible before canvas is ready ── */}
            {!canvasReady && (
                <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                    <div className="w-10 h-10 rounded-full border-2 border-transparent border-t-[#E6B31E] border-r-[#E6B31E] animate-spin" />
                </div>
            )}

            {/* ── Three.js Canvas — fades in when WebGL context is ready ── */}
            <div
                className="absolute inset-0 z-10 transition-opacity duration-500"
                style={{ opacity: canvasReady ? 1 : 0, willChange: "opacity" }}
            >
                <Canvas
                    camera={{ position: [0, 1.5, 5], fov: 40 }}
                    gl={{
                        alpha: true,
                        // Disable antialias on low-end → ~2x faster rasterization
                        antialias: !isLowEnd.current,
                        powerPreference: isLowEnd.current ? "low-power" : "high-performance",
                    }}
                    // Cap pixel ratio: low-end gets 1.0, high-end caps at 1.5
                    dpr={isLowEnd.current ? 1 : [1, 1.5]}
                    frameloop="always"
                    onCreated={({ gl }) => {
                        gl.setClearColor(0x000000, 0);
                        // Trigger fade-in — canvas is painted and ready
                        setCanvasReady(true);
                    }}
                >
                    <ambientLight intensity={0.8} />
                    <directionalLight position={[5, 5, 5]} intensity={2} color="#E6B31E" />
                    <directionalLight position={[-3, 3, -2]} intensity={0.8} color="#ffffff" />
                    <pointLight position={[0, 4, 0]} intensity={1.5} color="#e8c96a" />
                    {/* Skip spot light on low-end — each light costs GPU per-fragment */}
                    {!isLowEnd.current && (
                        <spotLight position={[0, 5, 3]} angle={0.5} penumbra={1} intensity={1} color="#E6B31E" />
                    )}
                    <Suspense fallback={null}>
                        <ChairModel />
                    </Suspense>
                    <OrbitControls
                        enableZoom={false}
                        enablePan={false}
                        autoRotate={false}
                        // Disable touch drag on low-end to reduce pointer event overhead
                        enableRotate={!isLowEnd.current}
                    />
                </Canvas>
            </div>
        </div>
    );
}
