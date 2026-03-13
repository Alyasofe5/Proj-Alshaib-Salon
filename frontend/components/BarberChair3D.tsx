"use client";

import { Suspense, useMemo, useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

useGLTF.preload("/barber_chair.glb");

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

export default function BarberChair3D() {
    const [loaded, setLoaded] = useState(false);

    return (
        <div className="relative w-[350px] h-[350px] md:w-[500px] md:h-[500px] flex items-center justify-center">
            {/* Gold glow behind */}
            <div className="absolute inset-0 blur-[100px] opacity-25"
                style={{ background: "radial-gradient(circle, #c8a96e, transparent 60%)" }} />

            {/* Spinner while loading */}
            {!loaded && (
                <div className="absolute inset-0 flex items-center justify-center z-20">
                    <div className="w-12 h-12 rounded-full border-2 border-transparent border-t-[#c8a96e] border-r-[#c8a96e] animate-spin" />
                </div>
            )}

            {/* Three.js Canvas */}
            <div className={`relative z-10 w-full h-full transition-opacity duration-700 ${loaded ? "opacity-100" : "opacity-0"}`}
                style={{ willChange: "opacity" }}>
                <Canvas
                    camera={{ position: [0, 1.5, 5], fov: 40 }}
                    gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
                    dpr={[1, 1.5]}
                    onCreated={({ gl, scene }) => {
                        gl.setClearColor(0x000000, 0);
                        scene.background = null;
                        setLoaded(true);
                    }}
                >
                    <ambientLight intensity={0.8} />
                    <directionalLight position={[5, 5, 5]} intensity={2} color="#c8a96e" />
                    <directionalLight position={[-3, 3, -2]} intensity={0.8} color="#ffffff" />
                    <pointLight position={[0, 4, 0]} intensity={1.5} color="#e8c96a" />
                    <spotLight position={[0, 5, 3]} angle={0.5} penumbra={1} intensity={1} color="#c8a96e" />
                    <Suspense fallback={null}>
                        <ChairModel />
                    </Suspense>
                    <OrbitControls enableZoom={false} enablePan={false} autoRotate={false} />
                </Canvas>
            </div>

            {/* Circular glow ring */}
            <div className="absolute inset-[10%] rounded-full border opacity-10" style={{ borderColor: "#c8a96e" }} />
            <div className="absolute inset-[5%] rounded-full border opacity-5 animate-spin"
                style={{ borderColor: "#e8c96a", animationDuration: "30s", animationTimingFunction: "linear" }} />

            {/* Sparkle dots */}
            {[...Array(5)].map((_, i) => (
                <div
                    key={i}
                    className="absolute w-1.5 h-1.5 rounded-full bg-[#e8c96a] animate-ping"
                    style={{
                        top: `${15 + Math.sin(i * 1.4) * 35}%`,
                        left: `${15 + Math.cos(i * 1.3) * 35}%`,
                        animationDuration: `${2.5 + i * 0.5}s`,
                        animationDelay: `${i * 0.6}s`,
                        opacity: 0.6,
                    }}
                />
            ))}
        </div>
    );
}
