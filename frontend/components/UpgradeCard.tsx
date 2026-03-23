"use client";

import { motion } from "framer-motion";
import { FaWhatsapp, FaRocket, FaCheck, FaStar, FaShieldAlt, FaBuilding } from "react-icons/fa";

const gold = "var(--color-accent)";

// ─── Plan config ──────────────────────────────────────────
interface PlanFeature {
    text: string;
    included: boolean;
}

interface PlanConfig {
    title: string;
    titleAr: string;
    description: string;
    icon: React.ReactNode;
    gradient: string;
    borderColor: string;
    glowColor: string;
    features: PlanFeature[];
    waMessage: string;
    badge: string;
}

const PLANS: Record<"professional" | "enterprise", PlanConfig> = {
    professional: {
        title: "PROFESSIONAL",
        titleAr: "الباقة الاحترافية",
        description: "الحل المتكامل للنمو المتسارع وزيادة المبيعات",
        icon: <FaRocket size={24} />,
        gradient: "linear-gradient(145deg, rgba(195,216,9,0.1) 0%, rgba(26,26,26,0) 100%)",
        borderColor: "rgba(195,216,9,0.15)",
        glowColor: "rgba(195,216,9,0.1)",
        features: [
            { text: "صفحة حجز حصرية بهوية صالونك", included: true },
            { text: "نظام إشعارات واتساب آلي", included: true },
            { text: "باركود (QR) خاص للطاولات والمحل", included: true },
            { text: "تقارير تحليلية متقدمة للأداء", included: true },
            { text: "دعم فني متخصص", included: true },
        ],
        waMessage: "مرحبا، أريد الترقية إلى الباقة الاحترافية",
        badge: "الأكثر طلباً",
    },
    enterprise: {
        title: "ENTERPRISE",
        titleAr: "باقة المؤسسات",
        description: "إدارة مركزية متطورة لشبكات الصالونات والفروع",
        icon: <FaBuilding size={24} />,
        gradient: "linear-gradient(145deg, var(--border-subtle) 0%, rgba(26,26,26,0) 100%)",
        borderColor: "rgba(195,216,9,0.3)",
        glowColor: "var(--border-subtle)",
        features: [
            { text: "إدارة غير محدودة للفروع", included: true },
            { text: "لوحة تحكم موحدة (Centralized)", included: true },
            { text: "نظام تقارير الفروع المقارن", included: true },
            { text: "واجهة ربط برمجية (API) خاصة", included: true },
            { text: "مدير حساب مخصص 24/7", included: true },
        ],
        waMessage: "مرحبا، أريد الترقية إلى باقة المؤسسات",
        badge: "الأقوى أداءً",
    },
};

// ─── Props ────────────────────────────────────────────────
interface UpgradeCardProps {
    plan: "professional" | "enterprise";
    featureName?: string;
    compact?: boolean;
    className?: string;
}

// ─── Component ────────────────────────────────────────────
export default function UpgradeCard({
    plan,
    featureName,
    compact = false,
    className = "",
}: UpgradeCardProps) {
    const config = PLANS[plan];
    const waLink = `https://wa.me/962781717990?text=${encodeURIComponent(config.waMessage)}`;

    // ─── Compact Variant ──────────────────────────────────
    if (compact) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`group relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 ${className}`}
                style={{
                    background: "rgba(26, 26, 26, 0.8)",
                    borderColor: config.borderColor,
                    boxShadow: `0 10px 30px ${config.glowColor}`,
                    backdropFilter: "blur(10px)",
                }}
            >
                <div className="relative flex flex-col items-center text-center gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-accent-lime/10 text-accent-lime border border-accent-lime/20">
                        {config.icon}
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-white">{config.titleAr}</h4>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{config.title}</p>
                    </div>
                    {featureName && (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 border border-white/5">
                            <FaShieldAlt size={8} className="text-accent-lime/60" />
                            <span className="text-[10px] text-gray-400 font-bold">لفتح {featureName}</span>
                        </div>
                    )}
                    <a 
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-black transition-all bg-accent-lime text-black hover:scale-[1.02]"
                        style={{ boxShadow: "0 4px 15px rgba(195,216,9,0.3)" }}
                    >
                        <FaWhatsapp size={14} /> ترقية الآن
                    </a>
                </div>
            </motion.div>
        );
    }

    // ─── Full Variant ─────────────────────────────────────
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={`relative group overflow-hidden rounded-2xl border transition-all duration-300 ${className}`}
            style={{
                background: "rgba(30, 30, 30, 0.7)",
                borderColor: config.borderColor,
                boxShadow: `0 8px 30px -8px ${config.glowColor}`,
                backdropFilter: "blur(12px)",
            }}
        >
            {/* Hover Glow Effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                    background: `radial-gradient(circle at 50% 0%, ${gold}10, transparent 70%)`
                }}
            />

            {/* Background Accent */}
            <div 
                className="absolute top-0 left-0 w-full h-1/2 opacity-15 pointer-events-none"
                style={{ background: config.gradient }}
            />

            {/* Content Container */}
            <div className="relative p-5 sm:p-6">
                {/* Header Section */}
                <div className="flex items-center gap-4 mb-5">
                    {/* Icon Box */}
                    <div 
                        className="relative w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ 
                            background: "rgba(195,216,9,0.08)",
                            border: "1px solid rgba(195,216,9,0.18)",
                        }}
                    >
                        <div className="text-accent-lime">{config.icon}</div>
                        <motion.div 
                            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 3, repeat: Infinity }}
                            className="absolute -top-1 -right-1"
                        >
                            <FaStar size={10} color={gold} />
                        </motion.div>
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                            <h3 className="text-base font-black text-white">{config.titleAr}</h3>
                            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black bg-accent-lime/10 text-accent-lime border border-accent-lime/25 flex-shrink-0">
                                {config.badge}
                            </span>
                        </div>
                        <p className="text-xs text-gray-400 font-medium">{config.description}</p>
                    </div>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-2 gap-y-2.5 gap-x-6 mb-5">
                    {config.features.map((feature, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-accent-lime/12 border border-accent-lime/25 flex items-center justify-center flex-shrink-0">
                                <FaCheck size={6} color={gold} />
                            </div>
                            <span className="text-xs text-gray-300 font-semibold">{feature.text}</span>
                        </div>
                    ))}
                </div>

                {/* CTA */}
                <a 
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group/btn relative flex items-center justify-center gap-2.5 w-full py-3 rounded-xl text-sm font-black transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
                    style={{ 
                        background: `linear-gradient(135deg, ${gold}, #C3D809)`,
                        color: "var(--color-background)",
                        boxShadow: "0 6px 20px rgba(195,216,9,0.35)",
                    }}
                >
                    <FaWhatsapp size={16} />
                    ترقية اشتراكي الآن
                    <div className="absolute inset-0 w-full h-full bg-white/25 skew-x-[-20deg] opacity-0 group-hover/btn:opacity-100 transition-all duration-700 -translate-x-[200%] group-hover/btn:translate-x-[200%]" />
                </a>
                <p className="text-center text-[10px] text-gray-600 mt-2 font-bold">تواصل معنا عبر واتساب لتفعيل الباقة فوراً</p>
            </div>
        </motion.div>
    );
}
