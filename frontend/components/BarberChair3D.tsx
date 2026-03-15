"use client";

import { Suspense, useMemo, useRef, useEffect, useState, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

// Preload GLB immediately — starts fetching before component mounts
useGLTF.preload("/barber_chair.glb");

// ─── 3D Chair Model ───────────────────────────────────────────
function ChairModel({ onLoaded }: { onLoaded: () => void }) {
    const { scene } = useGLTF("/barber_chair.glb");
    const clonedScene = useMemo(() => scene.clone(true), [scene]);
    const ref = useRef<THREE.Group>(null!);
    const calledRef = useRef(false);

    useEffect(() => {
        if (clonedScene) {
            const box = new THREE.Box3().setFromObject(clonedScene);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const s = 3 / maxDim;
            clonedScene.scale.setScalar(s);
            clonedScene.position.set(-center.x * s, -center.y * s, -center.z * s);

            if (!calledRef.current) {
                calledRef.current = true;
                onLoaded();
            }
        }
    }, [clonedScene, onLoaded]);

    useFrame((_, delta) => {
        if (ref.current) ref.current.rotation.y += delta * 0.3;
    });

    return <group ref={ref}><primitive object={clonedScene} /></group>;
}

// ─── Sparkle positions — computed once, stable across renders ──
const SPARKLE_POSITIONS = [0, 1, 2].map(i => ({
    top: `${20 + Math.sin(i * 2) * 30}%`,
    left: `${20 + Math.cos(i * 2) * 30}%`,
    animationDuration: `${2.5 + i * 0.8}s`,
    animationDelay: `${i * 0.5}s`,
}));

// ─── Main Component ────────────────────────────────────────────
export default function BarberChair3D() {
    const [canvasReady, setCanvasReady] = useState(false);
    const [modelReady, setModelReady] = useState(false);

    const isLowEnd = useRef<boolean>(false);
    useEffect(() => {
        isLowEnd.current =
            (navigator.hardwareConcurrency ?? 4) <= 2 ||
            window.devicePixelRatio <= 1;
    }, []);

    const handleModelLoaded = useCallback(() => setModelReady(true), []);

    // Show content when both canvas is created AND model is loaded
    const isVisible = canvasReady && modelReady;

    return (
        <div className="relative w-[280px] h-[280px] sm:w-[350px] sm:h-[350px] md:w-[450px] md:h-[450px] flex items-center justify-center">

            {/* ── Gold ambient glow — pure CSS, instant ── */}
            <div
                className="absolute inset-0 blur-[80px] opacity-20"
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
                    style={{ ...pos, opacity: 0.5 }}
                />
            ))}

            {/* ── Beautiful placeholder — visible while model loads ── */}
            <div
                className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none transition-opacity duration-700"
                style={{ opacity: isVisible ? 0 : 1 }}
            >
                <div className="relative">
                    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#E6B31E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-40">
                        <circle cx="6" cy="6" r="3" />
                        <path d="M8.12 8.12 12 12" />
                        <path d="M20 4 8.12 15.88" />
                        <circle cx="6" cy="18" r="3" />
                        <path d="M14.8 14.8 20 20" />
                    </svg>
                    <div
                        className="absolute -inset-4 rounded-full border animate-ping"
                        style={{ borderColor: "rgba(230,179,30,.15)", animationDuration: "2s" }}
                    />
                </div>
                <span className="text-[10px] font-semibold mt-3" style={{ color: "rgba(230,179,30,.35)" }}>
                    جارٍ التحميل...
                </span>
            </div>

            {/* ── Three.js Canvas ── */}
            <div
                className="absolute inset-0 z-10 transition-opacity duration-700 ease-out"
                style={{ opacity: isVisible ? 1 : 0 }}
            >
                <Canvas
                    camera={{ position: [0, 1.5, 5], fov: 40 }}
                    gl={{
                        alpha: true,
                        antialias: !isLowEnd.current,
                        powerPreference: isLowEnd.current ? "low-power" : "high-performance",
                    }}
                    dpr={isLowEnd.current ? 1 : [1, 1.5]}
                    frameloop="always"
                    onCreated={({ gl }) => {
                        gl.setClearColor(0x000000, 0);
                        setCanvasReady(true);
                    }}
                >
                    {/* Simplified lighting — 3 instead of 5 */}
                    <ambientLight intensity={0.8} />
                    <directionalLight position={[5, 5, 5]} intensity={2} color="#E6B31E" />
                    <directionalLight position={[-3, 3, -2]} intensity={0.8} color="#ffffff" />
                    {!isLowEnd.current && (
                        <pointLight position={[0, 4, 0]} intensity={1.5} color="#e8c96a" />
                    )}
                    <Suspense fallback={null}>
                        <ChairModel onLoaded={handleModelLoaded} />
                    </Suspense>
                    <OrbitControls
                        enableZoom={false}
                        enablePan={false}
                        autoRotate={false}
                        enableRotate={!isLowEnd.current}
                    />
                </Canvas>
            </div>
        </div>
    );
}
