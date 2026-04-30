"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { authAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import Image from "next/image";
import { FaWhatsapp } from "react-icons/fa";
import { AlertTriangle, Clock, Phone, RefreshCw, ShieldAlert, LogIn, User, Lock, Eye, EyeOff, MessageSquare } from "lucide-react";
import MaqassLogoIcon from "@/components/ui/MaqassLogoIcon";

// ─── Expired / Suspended Screen ──────────────────────────
function SubscriptionBlockedScreen({ message, salonName, onRetry }: {
    message: string;
    salonName: string;
    onRetry: () => void;
}) {
    const isSuspended = message.includes("إيقاف") || message.includes("suspend");
    return (
        <div className="min-h-screen flex items-center justify-center px-4"
            style={{ background: "#0A0A0B" }} dir="rtl">
            <div className="w-full max-w-md text-center">
                <div className="w-28 h-28 mx-auto mb-8 rounded-3xl flex items-center justify-center"
                    style={{ background: isSuspended ? "rgba(195,216,9,.05)" : "rgba(220,38,38,.05)", border: `2px solid ${isSuspended ? "rgba(195,216,9,.2)" : "rgba(220,38,38,.2)"}` }}>
                    {isSuspended ? <AlertTriangle size={52} color="#C3D809" /> : <Clock size={52} color="#DC2626" />}
                </div>
                <h1 className="text-3xl font-black mb-3" style={{ color: "var(--color-text-primary)" }}>{isSuspended ? "تم إيقاف اشتراكك" : "انتهى اشتراكك"}</h1>
                {salonName && (
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold mb-5"
                        style={{ background: "rgba(195,216,9,.1)", border: "1px solid rgba(195,216,9,.2)", color: "var(--color-accent)" }}>
                        {salonName}
                    </div>
                )}
                <p className="text-base leading-relaxed mb-8 max-w-sm mx-auto" style={{ color: "var(--text-muted)" }}>
                    {isSuspended ? "تم إيقاف هذا الحساب مؤقتاً. تواصل مع الدعم لتفعيل حسابك." : "انتهت مدة اشتراكك. جدد اشتراكك للاستمرار."}
                </p>
                <div className="space-y-3">
                    <a href={`https://wa.me/962781717990?text=${encodeURIComponent(`مرحبا، أريد تجديد اشتراك صالون ${salonName}`)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl font-bold text-sm"
                        style={{ background: "rgba(37,211,102,.15)", border: "1px solid rgba(37,211,102,.3)", color: "#25D366" }}>
                        <FaWhatsapp size={20} />
                        {isSuspended ? "تواصل مع الدعم" : "جدد اشتراكك عبر واتساب"}
                    </a>
                    <a href="tel:+962781717990"
                        className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-sm"
                        style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", color: "var(--color-text-muted)" }}>
                        <Phone size={15} />
                        <span dir="ltr">+962 78 171 7990</span>
                    </a>
                    <button onClick={onRetry} className="flex items-center justify-center gap-2 w-full py-2.5 text-xs text-gray-600 hover:text-gray-400 transition-colors">
                        <RefreshCw size={12} /> رجوع لتسجيل الدخول
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Login Page ──────────────────────────────────────────
export default function LoginPage() {
    const { login } = useAuthStore();

    // Use refs for input values — avoids re-render interference on mobile
    const usernameRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);

    const [showPassword, setShowPassword] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [shake, setShake] = useState(false);
    const gold = "var(--color-accent)";
    const [blockedState, setBlockedState] = useState<{ message: string; salonName: string } | null>(null);

    if (blockedState) {
        return <SubscriptionBlockedScreen message={blockedState.message} salonName={blockedState.salonName} onRetry={() => setBlockedState(null)} />;
    }

    const triggerShake = () => {
        setShake(true);
        setTimeout(() => setShake(false), 600);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        // Prevent ALL default behavior — no reload, no navigation
        e.preventDefault();
        e.stopPropagation();

        // Read values directly from DOM inputs — the most reliable on mobile
        const username = (usernameRef.current?.value || "").trim();
        const password = (passwordRef.current?.value || "").trim();

        if (!username || !password) {
            setError("يرجى إدخال اسم المستخدم وكلمة المرور");
            triggerShake();
            return false;
        }

        setError("");
        setLoading(true);

        try {
            const res = await authAPI.login(username, password);
            const { token, user, salon, branches } = res.data.data;

            // Save auth (including branches for enterprise plan)
            login(user, token, salon, branches || []);

            // Navigate using full page redirect — most reliable on all mobile browsers
            if (user.role === "super_admin") {
                window.location.replace("/superadmin/dashboard");
            } else if (user.role === "admin") {
                window.location.replace("/admin/dashboard");
            } else {
                window.location.replace("/employee/dashboard");
            }
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            const msg = e.response?.data?.message || "اسم المستخدم أو كلمة المرور غير صحيحة";
            const isSubBlock = msg.includes("اشتراك") || msg.includes("إيقاف") || msg.includes("انتهى") || msg.includes("انتهي");
            if (isSubBlock) {
                setBlockedState({ message: msg, salonName: usernameRef.current?.value || username });
            } else {
                setError(msg);
                triggerShake();

                // Focus and select the password field so the user can re-type
                setTimeout(() => {
                    if (passwordRef.current) {
                        passwordRef.current.value = "";
                        passwordRef.current.focus();
                    }
                }, 100);
            }
            setLoading(false);
        }

        return false;
    };

    return (
        <div
            className="min-h-[100dvh] flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden"
            style={{ background: "#0d0d0d" }}
            dir="rtl"
        >
            {/* Background Decor */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-10 pointer-events-none"
                style={{ background: "radial-gradient(ellipse at center, var(--color-accent) 0%, transparent 60%)" }} />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-sm relative z-10"
            >
                {/* Logo Area */}
                <div className="text-center mb-10 group">
                    <div className="flex justify-center mb-4 relative">
                        <div className="relative flex-shrink-0 transition-all duration-700 group-hover:scale-110 group-hover:rotate-[5deg]">
                            <div className="absolute inset-0 rounded-full blur-xl opacity-20 bg-[var(--color-accent)] animate-pulse" />
                            <div className="relative w-24 h-24 rounded-full flex items-center justify-center p-[2px] overflow-hidden" 
                                 style={{ background: "linear-gradient(135deg, #C3D809 0%, rgba(195,216,9,0.1) 100%)" }}>
                                <div className="w-full h-full rounded-full bg-black flex items-center justify-center p-0 shadow-inner overflow-hidden">
                                    <Image
                                        src="/images/logo_black_bg_hd.png"
                                        alt="Maqass Logo"
                                        width={256}
                                        height={256}
                                        quality={100}
                                        priority
                                        className="w-full h-full object-cover rounded-full scale-[1.15] relative right-[3px]"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col items-center mt-1">
                        <span className="text-3xl font-black tracking-tight leading-none maqass-brand drop-shadow-[0_0_10px_rgba(195,216,9,0.2)] text-white">MAQASS</span>
                        <span className="text-[10px] font-bold tracking-[.3em] mt-1.5 uppercase opacity-60" style={{ color: "var(--color-accent)" }}>Salon Platform</span>
                    </div>
                </div>

                {/* Login Card (Glassmorphism) */}
                <motion.div
                    animate={shake ? { x: [0, -8, 8, -6, 6, -4, 4, 0] } : {}}
                    transition={{ duration: 0.5 }}
                    className="p-8 rounded-[28px] border relative overflow-hidden group/card"
                    style={{
                        background: "rgba(20, 20, 20, 0.8)",
                        borderColor: "rgba(255, 255, 255, 0.04)",
                        backdropFilter: "blur(20px)",
                        boxShadow: "0 20px 50px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.05)"
                    }}
                >
                    {/* Inner Accent Line */}
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[var(--color-accent)]/30 to-transparent" />

                    <h2 className="text-lg font-medium text-white mb-8 text-center" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                        تسجيل الدخول
                    </h2>

                    {/* Error Message with Animation */}
                    <AnimatePresence mode="wait">
                        {error && (
                            <motion.div
                                key="error-msg"
                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                transition={{ duration: 0.3 }}
                                className="mb-5 px-4 py-3.5 rounded-2xl text-sm font-bold flex items-center gap-3"
                                style={{
                                    background: "rgba(239,68,68,.1)",
                                    border: "1.5px solid rgba(239,68,68,.35)",
                                    color: "#fca5a5",
                                }}
                            >
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                    style={{ background: "rgba(239,68,68,.15)" }}>
                                    <ShieldAlert size={18} className="text-red-400" />
                                </div>
                                <span>{error}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Form — no action, no method, prevents browser from intercepting submit */}
                    <form
                        onSubmit={handleSubmit}
                        noValidate
                        autoComplete="off"
                        className="space-y-6"
                    >
                        <div className="relative group/input">
                            <label className="text-[12px] font-bold text-[var(--color-accent)] mb-2 block opacity-80 flex items-center gap-2" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                                <User size={12} className="text-accent-lime" />
                                اسم المستخدم
                            </label>
                            <input
                                ref={usernameRef}
                                type="text"
                                name="mq_user"
                                placeholder="أدخل اسم المستخدم"
                                className="w-full px-5 py-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-white outline-none focus:outline-none focus-visible:outline-none transition-all focus:bg-white/[0.06] focus:border-[var(--color-accent)] placeholder:text-white/20 text-sm"
                                autoComplete="off"
                                dir="rtl"
                                required
                            />
                        </div>

                        <div className="relative group/input">
                            <label className="text-[12px] font-bold text-[var(--color-accent)] mb-2 block opacity-80 flex items-center gap-2" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                                <Lock size={12} className="text-accent-lime" />
                                كلمة المرور
                            </label>
                            <div className="relative">
                                <input
                                    ref={passwordRef}
                                    type={showPassword ? "text" : "password"}
                                    name="mq_pass"
                                    placeholder="أدخل كلمة المرور"
                                    className="w-full px-5 py-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-white outline-none focus:outline-none focus-visible:outline-none transition-all focus:bg-white/[0.06] focus:border-[var(--color-accent)] placeholder:text-white/20 text-sm"
                                    autoComplete="new-password"
                                    dir="rtl"
                                    required
                                />
                                <button
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-accent-lime transition-colors"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-14 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all relative overflow-hidden group/btn disabled:opacity-50 flex items-center justify-center gap-3"
                            style={{
                                background: "#C3D809",
                                color: "#000",
                                fontFamily: "'Noto Sans Arabic', sans-serif"
                            }}
                        >
                            {loading ? (
                                <RefreshCw size={20} className="animate-spin" />
                            ) : (
                                <>
                                    <span>دخول</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover/btn:-translate-x-1"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M13.8 12H3" /></svg>
                                </>
                            )}
                        </button>
                    </form>
                </motion.div>

                <p className="text-center text-xs mt-6" style={{ color: "var(--text-muted)" }}>
                    © {new Date().getFullYear()} <span style={{ color: "#C3D809" }}>Maqass</span> Platform. All rights reserved.
                </p>
            </motion.div>
        </div>
    );
}
