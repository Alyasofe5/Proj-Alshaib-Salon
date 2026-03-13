"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { authAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { FaSignInAlt, FaUser, FaLock, FaEye, FaEyeSlash, FaWhatsapp } from "react-icons/fa";
import { AlertTriangle, Clock, Phone, RefreshCw } from "lucide-react";

// Expired / Suspended Screen
function SubscriptionBlockedScreen({ message, salonName, onRetry }: {
    message: string;
    salonName: string;
    onRetry: () => void;
}) {
    const isSuspended = message.includes("إيقاف") || message.includes("suspend");
    return (
        <div className="min-h-screen flex items-center justify-center px-4"
            style={{ background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)" }} dir="rtl">
            <div className="w-full max-w-md text-center">
                <div className="w-28 h-28 mx-auto mb-8 rounded-3xl flex items-center justify-center"
                    style={{ background: isSuspended ? "rgba(251,191,36,.1)" : "rgba(231,76,60,.1)", border: `2px solid ${isSuspended ? "rgba(251,191,36,.3)" : "rgba(231,76,60,.3)"}` }}>
                    {isSuspended ? <AlertTriangle size={52} color="#fbbf24" /> : <Clock size={52} color="#e74c3c" />}
                </div>
                <h1 className="text-3xl font-black text-white mb-3">{isSuspended ? "تم إيقاف اشتراكك" : "انتهى اشتراكك"}</h1>
                {salonName && (
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold mb-5"
                        style={{ background: "rgba(201,168,76,.1)", border: "1px solid rgba(201,168,76,.2)", color: "#C9A84C" }}>
                        {salonName}
                    </div>
                )}
                <p className="text-gray-400 text-base leading-relaxed mb-8 max-w-sm mx-auto">
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

export default function LoginPage() {
    const { login } = useAuthStore();

    // Use refs instead of state for input values — avoids re-render interference on mobile
    const usernameRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);

    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [blockedState, setBlockedState] = useState<{ message: string; salonName: string } | null>(null);

    if (blockedState) {
        return <SubscriptionBlockedScreen message={blockedState.message} salonName={blockedState.salonName} onRetry={() => setBlockedState(null)} />;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // Read values directly from DOM inputs — the most reliable on mobile
        const username = (usernameRef.current?.value || "").trim();
        const password = (passwordRef.current?.value || "").trim();

        if (!username || !password) {
            setError("يرجى إدخال اسم المستخدم وكلمة المرور");
            return;
        }

        setError("");
        setLoading(true);

        try {
            const res = await authAPI.login(username, password);
            const { token, user, salon } = res.data.data;

            // Save auth
            login(user, token, salon);

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
            }
            setLoading(false);
        }
    };

    return (
        <div
            className="min-h-[100dvh] flex flex-col items-center justify-center px-4 py-8"
            style={{ background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)" }}
        >
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-md"
            >
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center overflow-hidden"
                        style={{ background: "linear-gradient(135deg, #C9A84C 0%, #a08339 100%)", border: "1.5px solid rgba(201,168,76,.3)", boxShadow: "0 8px 20px rgba(201,168,76,.2)" }}>
                        <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" style={{ width: 44, height: 44 }}>
                            <circle cx="20" cy="48" r="8" fill="none" stroke="#1c1c1c" strokeWidth="3" />
                            <circle cx="44" cy="48" r="8" fill="none" stroke="#1c1c1c" strokeWidth="3" />
                            <line x1="20" y1="40" x2="44" y2="12" stroke="#1c1c1c" strokeWidth="3" strokeLinecap="round" />
                            <line x1="44" y1="40" x2="20" y2="12" stroke="#1c1c1c" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-extrabold"><span className="text-[#C9A84C]">Maqass</span></h1>
                    <p className="text-sm text-gray-500 mt-1 tracking-widest">SALON MANAGEMENT PLATFORM</p>
                </div>

                {/* Login Card */}
                <div className="chart-card">
                    <h2 className="text-lg font-bold text-white mb-6 text-center">
                        <FaSignInAlt className="inline ml-2 text-gold" />
                        تسجيل الدخول
                    </h2>

                    {error && (
                        <div className="mb-4 px-4 py-3 rounded-xl text-sm font-bold text-center"
                            style={{ background: "rgba(239,68,68,.12)", border: "1.5px solid rgba(239,68,68,.5)", color: "#fca5a5" }}>
                            ⚠️ {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} method="post" action="#" noValidate>
                        <div className="mb-4">
                            <label className="form-label">
                                <FaUser className="inline ml-1 text-gold" />
                                اسم المستخدم
                            </label>
                            <input
                                ref={usernameRef}
                                type="text"
                                name="username"
                                className="form-input"
                                placeholder="أدخل اسم المستخدم"
                                autoComplete="username"
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
                                    name="password"
                                    className="form-input"
                                    placeholder="أدخل كلمة المرور"
                                    autoComplete="current-password"
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
                </div>

                <p className="text-center text-gray-600 text-xs mt-6">
                    © {new Date().getFullYear()} <span className="text-[#C9A84C]">Maqass</span> Platform. All rights reserved.
                </p>
            </motion.div>
        </div>
    );
}
