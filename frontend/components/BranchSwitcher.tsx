"use client";

import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "@/lib/store";
import api from "@/lib/api";
import { Building2, ChevronDown, Check, Loader2, ArrowLeftRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { assetUrl } from "@/lib/assets";
import { tData } from "@/lib/i18n";

/**
 * BranchSwitcher — Enterprise plan branch selector
 * Premium redesign with animations and professional UI.
 */
export default function BranchSwitcher() {
    const { salon, branches, switchSalon } = useAuthStore();
    const [open, setOpen] = useState(false);
    const [switching, setSwitching] = useState<number | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    if (!branches || branches.length <= 1) return null;

    const handleSwitch = async (branchId: number) => {
        if (branchId === salon?.id || switching) return;
        setSwitching(branchId);
        try {
            const res = await api.post("/auth/switch-salon.php", { salon_id: branchId });
            const { token, salon: newSalon, branches: newBranches } = res.data.data;
            switchSalon(newSalon, token, newBranches || branches);
            setOpen(false);
            window.location.reload();
        } catch {
            setSwitching(null);
        }
    };

    const currentInitial = tData(salon?.name || "S", "ar").charAt(0).toUpperCase();

    return (
        <div className="relative w-full" ref={dropdownRef}>
            {/* Trigger Button */}
            <button
                onClick={() => setOpen(!open)}
                className="w-full group flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-200"
                style={{
                    background: open
                        ? "linear-gradient(135deg, var(--border-subtle), rgba(195,216,9,0.06))"
                        : "rgba(255,255,255,0.03)",
                    border: open
                        ? "1px solid rgba(195,216,9,0.35)"
                        : "1px solid rgba(255,255,255,0.07)",
                }}
            >
                {/* Current salon avatar */}
                <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 overflow-hidden transition-all"
                    style={{
                        background: "linear-gradient(135deg, rgba(195,216,9,0.25), rgba(195,216,9,0.1))",
                        color: "var(--color-accent)",
                        border: "1px solid rgba(195,216,9,0.15)",
                    }}
                >
                    {assetUrl(salon?.logo) ? (
                        <img
                            src={assetUrl(salon?.logo)!}
                            alt={tData(salon?.name || "", "ar")}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                                const fallback = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = "flex";
                            }}
                        />
                    ) : null}
                    <span style={{ display: assetUrl(salon?.logo) ? "none" : "inline" }}>{currentInitial}</span>
                </div>

                {/* Name + label */}
                <div className="flex-1 text-right min-w-0">
                    <p className="text-[11px] text-accent-lime/60 font-medium leading-none mb-1">الفرع الحالي</p>
                    <p className="text-xs font-bold text-white truncate leading-none">{tData(salon?.name || "اختر الفرع", "ar")}</p>
                </div>

                {/* Chevron */}
                <motion.div
                    animate={{ rotate: open ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex-shrink-0 text-accent-lime/50 group-hover:text-accent-lime transition-colors"
                >
                    <ChevronDown size={13} />
                </motion.div>
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.97 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute top-full left-0 right-0 mt-2 z-50 overflow-hidden"
                        style={{
                            background: "#1E1E1E",
                            border: "1px solid rgba(195,216,9,0.15)",
                            borderRadius: "14px",
                            boxShadow: "0 20px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(195,216,9,0.05)",
                            minWidth: "220px",
                        }}
                    >
                        {/* Header */}
                        <div className="px-3 pt-3 pb-2 flex items-center gap-2">
                            <ArrowLeftRight size={11} className="text-accent-lime" />
                            <span className="text-[10px] font-bold text-accent-lime/70 uppercase tracking-wider">
                                التبديل بين الفروع
                            </span>
                        </div>

                        {/* Divider */}
                        <div style={{ height: "1px", background: "linear-gradient(90deg, transparent, var(--border-subtle), transparent)", margin: "0 12px 8px" }} />

                        {/* Branch list */}
                        <div className="px-1.5 pb-1.5 space-y-0.5 max-h-[260px] overflow-y-auto">
                            {branches.map((branch) => {
                                const isActive = branch.id === salon?.id;
                                const isLoading = switching === branch.id;
                                const initial = tData(branch.name, "ar").charAt(0).toUpperCase();

                                return (
                                    <button
                                        key={branch.id}
                                        onClick={() => handleSwitch(branch.id)}
                                        disabled={isActive || !!switching}
                                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-all duration-150 disabled:cursor-not-allowed group"
                                        style={{
                                            background: isActive
                                                ? "linear-gradient(135deg, var(--border-subtle), rgba(195,216,9,0.06))"
                                                : "transparent",
                                            border: isActive
                                                ? "1px solid rgba(195,216,9,0.15)"
                                                : "1px solid transparent",
                                            opacity: switching && !isActive ? 0.5 : 1,
                                        }}
                                        onMouseEnter={e => {
                                            if (!isActive && !switching) {
                                                (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)";
                                                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.07)";
                                            }
                                        }}
                                        onMouseLeave={e => {
                                            if (!isActive) {
                                                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                                                (e.currentTarget as HTMLButtonElement).style.borderColor = "transparent";
                                            }
                                        }}
                                    >
                                        {/* Avatar */}
                                        <div
                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 overflow-hidden"
                                            style={{
                                                background: isActive
                                                    ? "linear-gradient(135deg, rgba(195,216,9,0.3), var(--border-subtle))"
                                                    : "rgba(255,255,255,0.05)",
                                                color: isActive ? "var(--color-accent)" : "var(--color-text-muted)",
                                                border: isActive ? "1px solid rgba(195,216,9,0.3)" : "1px solid rgba(255,255,255,0.06)",
                                            }}
                                        >
                                            {assetUrl(branch.logo_path) ? (
                                                <img
                                                    src={assetUrl(branch.logo_path)!}
                                                    alt={tData(branch.name, "ar")}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).style.display = "none";
                                                        const fallback = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
                                                        if (fallback) fallback.style.display = "flex";
                                                    }}
                                                />
                                            ) : null}
                                            <span style={{ display: assetUrl(branch.logo_path) ? "none" : "inline" }}>{initial}</span>
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 text-right min-w-0">
                                            <p className={`text-xs font-bold truncate ${isActive ? "text-accent-lime" : "text-[var(--color-text-secondary)]"}`}>
                                                {tData(branch.name, "ar")}
                                            </p>
                                            <p className="text-[10px] text-[var(--color-text-muted)] truncate">/{branch.slug}</p>
                                        </div>

                                        {/* Status indicator */}
                                        {isActive && (
                                            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                                                style={{ background: "var(--border-subtle)" }}>
                                                <Check size={10} className="text-accent-lime" />
                                            </div>
                                        )}
                                        {isLoading && (
                                            <Loader2 size={13} className="animate-spin text-accent-lime flex-shrink-0" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
