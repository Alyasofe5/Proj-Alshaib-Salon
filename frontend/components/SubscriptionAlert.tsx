"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Clock, X, RefreshCw, ExternalLink } from "lucide-react";
import { useAuthStore } from "@/lib/store";
import Link from "next/link";

/**
 * SubscriptionAlert
 * ─────────────────
 * Shown to admin / super_admin when subscription expires in ≤ 7 days.
 * Dismissed per-day via localStorage (reappears at midnight every day).
 * Urgency levels:
 *   - warning  : 4–7 days  → amber
 *   - critical : 1–3 days  → red
 *   - expired  : 0 days    → deep red pulse
 */

type Urgency = "warning" | "critical" | "expired";

function getUrgency(daysLeft: number): Urgency {
    if (daysLeft <= 0) return "expired";
    if (daysLeft <= 3) return "critical";
    return "warning";
}

const DISMISS_KEY = "sub_alert_dismissed_date";

export default function SubscriptionAlert() {
    const { user, salon } = useAuthStore();
    const [visible, setVisible] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;

        // Only admin / super_admin
        const role = user?.role;
        if (role !== "admin" && role !== "super_admin") return;

        // Only if days_left is defined and ≤ 7
        const days = salon?.days_left;
        if (days === null || days === undefined || days > 7) return;

        // Check if already dismissed today
        const dismissedDate = localStorage.getItem(DISMISS_KEY);
        const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
        if (dismissedDate === today) return;

        setVisible(true);
    }, [mounted, user, salon]);

    const handleDismiss = () => {
        const today = new Date().toISOString().slice(0, 10);
        localStorage.setItem(DISMISS_KEY, today);
        setVisible(false);
    };

    if (!mounted || !visible) return null;

    const days = salon?.days_left ?? 0;
    const urgency = getUrgency(days);

    const config = {
        warning: {
            bg: "linear-gradient(135deg, rgba(230,179,30,0.12), rgba(230,179,30,0.06))",
            border: "rgba(230,179,30,0.4)",
            iconColor: "#E6B31E",
            titleColor: "#E6B31E",
            title: `تنبيه: اشتراكك ينتهي خلال ${days} ${days === 1 ? "يوم" : "أيام"}`,
            desc: "قم بتجديد اشتراكك قبل الانتهاء لتجنب انقطاع الخدمة وفقدان البيانات.",
            pulse: false,
        },
        critical: {
            bg: "linear-gradient(135deg, rgba(244,67,54,0.14), rgba(244,67,54,0.07))",
            border: "rgba(244,67,54,0.5)",
            iconColor: "#F44336",
            titleColor: "#FF6B6B",
            title: `⚠️ عاجل: اشتراكك ينتهي خلال ${days} ${days === 1 ? "يوم" : "أيام"}!`,
            desc: "سيتوقف النظام عن العمل فور انتهاء الاشتراك. جدِّد الآن للحفاظ على استمرارية العمل.",
            pulse: true,
        },
        expired: {
            bg: "linear-gradient(135deg, rgba(244,67,54,0.2), rgba(200,0,0,0.1))",
            border: "rgba(244,67,54,0.7)",
            iconColor: "#F44336",
            titleColor: "#FF4444",
            title: "🚨 انتهى اشتراكك — النظام في وضع محدود",
            desc: "بعض الميزات قد تكون معطلة. تواصل مع الدعم فوراً لتجديد الاشتراك.",
            pulse: true,
        },
    }[urgency];

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0, y: -16, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -12, scale: 0.97 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="relative mx-4 mb-4 rounded-2xl overflow-hidden"
                    style={{
                        background: config.bg,
                        border: `1px solid ${config.border}`,
                        boxShadow: `0 4px 24px rgba(0,0,0,0.25), 0 0 0 1px ${config.border}`,
                    }}
                >
                    {/* Animated pulse border for critical/expired */}
                    {config.pulse && (
                        <motion.div
                            className="absolute inset-0 rounded-2xl pointer-events-none"
                            animate={{ opacity: [0.3, 0.7, 0.3] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            style={{ border: `2px solid ${config.border}` }}
                        />
                    )}

                    <div className="flex items-start gap-3 p-4 pr-5">
                        {/* Icon */}
                        <div
                            className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center mt-0.5"
                            style={{ background: `${config.iconColor}20`, border: `1px solid ${config.iconColor}40` }}
                        >
                            {urgency === "expired"
                                ? <Clock size={18} style={{ color: config.iconColor }} />
                                : <AlertTriangle size={18} style={{ color: config.iconColor }} />
                            }
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0" dir="rtl">
                            <p className="font-bold text-sm mb-1" style={{ color: config.titleColor }}>
                                {config.title}
                            </p>
                            <p className="text-xs leading-relaxed" style={{ color: "#AAAAAA" }}>
                                {config.desc}
                            </p>

                            {/* Days progress bar */}
                            {urgency !== "expired" && (
                                <div className="mt-2.5 flex items-center gap-2">
                                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.max(5, (days / 7) * 100)}%` }}
                                            transition={{ duration: 0.8, ease: "easeOut" }}
                                            className="h-full rounded-full"
                                            style={{
                                                background: urgency === "critical"
                                                    ? "linear-gradient(90deg, #F44336, #FF6B6B)"
                                                    : "linear-gradient(90deg, #E6B31E, #FFD700)",
                                            }}
                                        />
                                    </div>
                                    <span className="text-[10px] font-bold whitespace-nowrap" style={{ color: config.iconColor }}>
                                        {days} / 7 أيام
                                    </span>
                                </div>
                            )}

                            {/* Action buttons */}
                            <div className="flex items-center gap-3 mt-3">
                                <Link
                                    href="/contact?from=renewal"
                                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all hover:scale-105"
                                    style={{
                                        background: urgency === "warning"
                                            ? "rgba(230,179,30,0.2)"
                                            : "rgba(244,67,54,0.2)",
                                        color: urgency === "warning" ? "#E6B31E" : "#FF6B6B",
                                        border: `1px solid ${config.border}`,
                                    }}
                                >
                                    <RefreshCw size={11} />
                                    تجديد الاشتراك
                                </Link>
                                <a
                                    href="https://wa.me/962781717990"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 text-xs font-semibold transition-colors hover:opacity-80"
                                    style={{ color: "#8A8A8A" }}
                                >
                                    <ExternalLink size={10} />
                                    تواصل معنا
                                </a>
                            </div>
                        </div>

                        {/* Dismiss button */}
                        <button
                            onClick={handleDismiss}
                            className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-white/10 mt-0.5"
                            title="إخفاء حتى غداً"
                            aria-label="إغلاق"
                        >
                            <X size={14} style={{ color: "#6A6A6A" }} />
                        </button>
                    </div>

                    {/* Bottom info strip */}
                    <div
                        className="px-5 py-2 flex items-center justify-between"
                        style={{ background: "rgba(0,0,0,0.15)", borderTop: `1px solid ${config.border}20` }}
                    >
                        <span className="text-[10px]" style={{ color: "#666" }}>
                            سيظهر هذا التنبيه يومياً حتى تجديد الاشتراك
                        </span>
                        <span className="text-[10px] font-bold" style={{ color: config.iconColor }}>
                            {salon?.name}
                        </span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
