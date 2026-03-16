"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { authAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { FaSignInAlt, FaUser, FaLock, FaEye, FaEyeSlash, FaWhatsapp } from "react-icons/fa";
import { AlertTriangle, Clock, Phone, RefreshCw, ShieldAlert } from "lucide-react";
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
            style={{ background: "var(--off-white)" }} dir="rtl">
            <div className="w-full max-w-md text-center">
                <div className="w-28 h-28 mx-auto mb-8 rounded-3xl flex items-center justify-center"
                    style={{ background: isSuspended ? "rgba(251,191,36,.08)" : "rgba(231,76,60,.08)", border: `2px solid ${isSuspended ? "rgba(251,191,36,.3)" : "rgba(231,76,60,.3)"}` }}>
                    {isSuspended ? <AlertTriangle size={52} color="#fbbf24" /> : <Clock size={52} color="#e74c3c" />}
                </div>
                <h1 className="text-3xl font-black mb-3" style={{ color: "var(--text-main)" }}>{isSuspended ? "تم إيقاف اشتراكك" : "انتهى اشتراكك"}</h1>
                {salonName && (
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold mb-5"
                        style={{ background: "rgba(230,179,30,.1)", border: "1px solid rgba(230,179,30,.2)", color: "#E6B31E" }}>
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
                        style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", color: "#888" }}>
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
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [shake, setShake] = useState(false);
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
            className="min-h-[100dvh] flex flex-col items-center justify-center px-4 py-8"
            style={{ background: "var(--off-white)" }}
        >
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-md"
            >
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-3 transition-transform hover:scale-105">
                        <MaqassLogoIcon size={80} />
                    </div>
                    <h1 className="text-2xl font-extrabold" style={{ color: "var(--text-main)" }}><span style={{ color: "var(--gold)" }}>Maqass</span></h1>
                    <p className="text-sm mt-1 tracking-widest" style={{ color: "var(--text-muted)" }}>SALON MANAGEMENT PLATFORM</p>
                </div>

                {/* Login Card */}
                <motion.div
                    className="chart-card"
                    animate={shake ? { x: [0, -12, 12, -8, 8, -4, 4, 0] } : {}}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                >
                    <h2 className="text-lg font-bold text-white mb-6 text-center">
                        <FaSignInAlt className="inline ml-2 text-gold" />
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
                    >
                        <div className="mb-4">
                            <label className="form-label">
                                <FaUser className="inline ml-1 text-gold" />
                                اسم المستخدم
                            </label>
                            <input
                                ref={usernameRef}
                                type="text"
                                name="mq_user"
                                className="form-input"
                                placeholder="أدخل اسم المستخدم"
                                autoComplete="off"
                                autoCapitalize="none"
                                autoCorrect="off"
                                spellCheck={false}
                                dir="ltr"
                                required
                            />
                        </div>

                        <div className="mb-6">
                            <label className="form-label">
                                <FaLock className="inline ml-1 text-gold" />
                                كلمة المرور
                            </label>
                            <div className="relative">
                                <input
                                    ref={passwordRef}
                                    type={showPassword ? "text" : "password"}
                                    name="mq_pass"
                                    className="form-input"
                                    placeholder="أدخل كلمة المرور"
                                    autoComplete="new-password"
                                    autoCapitalize="none"
                                    autoCorrect="off"
                                    spellCheck={false}
                                    dir="ltr"
                                    required
                                />
                                <button
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gold transition-colors"
                                    tabIndex={-1}
                                    aria-label="إظهار/إخفاء كلمة المرور"
                                >
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn-gold w-full py-4 text-base flex items-center justify-center gap-2"
                            disabled={loading}
                            style={{ touchAction: "manipulation" }}
                        >
                            {loading ? (
                                <div className="spinner" style={{ width: 22, height: 22, borderWidth: 2 }} />
                            ) : (
                                <>
                                    <FaSignInAlt />
                                    دخول
                                </>
                            )}
                        </button>
                    </form>
                </motion.div>

                <p className="text-center text-xs mt-6" style={{ color: "var(--text-muted)" }}>
                    © {new Date().getFullYear()} <span style={{ color: "var(--gold)" }}>Maqass</span> Platform. All rights reserved.
                </p>
            </motion.div>
        </div>
    );
}
