"use client";

import { useState, useCallback, useEffect, createContext, useContext, useRef } from "react";
import { FaCheck, FaTimes, FaExclamationTriangle, FaInfoCircle, FaTrash } from "react-icons/fa";

// ─── Toast Types ──────────────────────────────────────────────────────────────
type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
    id: string;
    type: ToastType;
    message: string;
    duration?: number;
}

// ─── Confirm Types ────────────────────────────────────────────────────────────
interface ConfirmOptions {
    title?: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: "danger" | "warning" | "gold";
}

// ─── Context ──────────────────────────────────────────────────────────────────
interface BrandUIContextType {
    toast: (message: string, type?: ToastType, duration?: number) => void;
    confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const BrandUIContext = createContext<BrandUIContextType | null>(null);

// ─── Toast Icon ───────────────────────────────────────────────────────────────
function ToastIcon({ type }: { type: ToastType }) {
    const map = {
        success: <FaCheck size={12} />,
        error: <FaTimes size={12} />,
        warning: <FaExclamationTriangle size={12} />,
        info: <FaInfoCircle size={12} />,
    };
    return map[type];
}

// ─── Toast Colors ─────────────────────────────────────────────────────────────
function toastColors(type: ToastType) {
    return {
        success: { bar: "#10b981", icon: "bg-emerald-500/20 text-emerald-400", border: "border-emerald-500/20" },
        error:   { bar: "#ef4444", icon: "bg-red-500/20 text-red-400",         border: "border-red-500/20" },
        warning: { bar: "#C3D809", icon: "bg-accent-lime/20 text-accent-lime",   border: "border-accent-lime/20" },
        info:    { bar: "var(--color-accent)", icon: "bg-accent-lime/20 text-accent-lime",     border: "border-accent-lime/20" },
    }[type];
}

// ─── Single Toast ─────────────────────────────────────────────────────────────
function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
    const [visible, setVisible] = useState(false);
    const [leaving, setLeaving] = useState(false);
    const colors = toastColors(toast.type);
    const duration = toast.duration ?? 4000;
    const timerRef = useRef<ReturnType<typeof setTimeout>>();

    useEffect(() => {
        // Enter
        const t1 = setTimeout(() => setVisible(true), 20);
        // Auto-leave
        timerRef.current = setTimeout(() => dismiss(), duration);
        return () => { clearTimeout(t1); clearTimeout(timerRef.current); };
    }, []);

    const dismiss = () => {
        setLeaving(true);
        setTimeout(() => onRemove(toast.id), 350);
    };

    return (
        <div
            className="relative overflow-hidden rounded-2xl border backdrop-blur-xl cursor-pointer max-w-sm w-full shadow-2xl"
            style={{
                background: "rgba(15,15,15,0.97)",
                borderColor: "rgba(255,255,255,0.08)",
                transform: visible && !leaving ? "translateX(0) scale(1)" : "translateX(120%) scale(0.92)",
                opacity: visible && !leaving ? 1 : 0,
                transition: "all 0.35s cubic-bezier(0.34,1.56,0.64,1)",
            }}
            onClick={dismiss}
        >
            {/* Progress bar */}
            <div
                className="absolute bottom-0 left-0 h-0.5 rounded-full"
                style={{
                    background: colors.bar,
                    width: "100%",
                    animation: `shrink ${duration}ms linear forwards`,
                }}
            />
            <div className="flex items-start gap-3 p-4">
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${colors.icon}`}>
                    <ToastIcon type={toast.type} />
                </div>
                <p className="text-sm text-white/90 leading-relaxed flex-1 font-medium" dir="rtl">{toast.message}</p>
                <button
                    className="text-gray-600 hover:text-gray-400 transition-colors shrink-0 mt-0.5"
                    onClick={(e) => { e.stopPropagation(); dismiss(); }}
                >
                    <FaTimes size={10} />
                </button>
            </div>
        </div>
    );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
function ConfirmDialog({
    options,
    onResolve,
}: {
    options: ConfirmOptions;
    onResolve: (val: boolean) => void;
}) {
    const [visible, setVisible] = useState(false);
    const variant = options.variant ?? "gold";

    useEffect(() => { setTimeout(() => setVisible(true), 20); }, []);

    const colors = {
        danger:  { btn: "bg-red-500 hover:bg-red-600 text-white", icon: <FaTrash size={14} />, iconBg: "bg-red-500/15 text-red-400" },
        warning: { btn: "bg-accent-lime hover:bg-yellow-600 text-black", icon: <FaExclamationTriangle size={14} />, iconBg: "bg-accent-lime/15 text-accent-lime" },
        gold:    { btn: "bg-accent-lime hover:bg-[#C3D809] text-black", icon: <FaCheck size={14} />, iconBg: "bg-accent-lime/15 text-accent-lime" },
    }[variant];

    const resolve = (val: boolean) => {
        setVisible(false);
        setTimeout(() => onResolve(val), 250);
    };

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            style={{
                background: visible ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0)",
                backdropFilter: visible ? "blur(8px)" : "blur(0px)",
                transition: "all 0.25s ease",
            }}
            onClick={() => resolve(false)}
        >
            <div
                className="relative w-full max-w-sm rounded-2xl border overflow-hidden"
                style={{
                    background: "rgba(13,13,13,0.99)",
                    borderColor: "rgba(255,255,255,0.08)",
                    boxShadow: "0 25px 80px rgba(0,0,0,0.6)",
                    transform: visible ? "scale(1) translateY(0)" : "scale(0.88) translateY(20px)",
                    opacity: visible ? 1 : 0,
                    transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Gold top accent */}
                <div className="h-px w-full" style={{ background: "linear-gradient(90deg,transparent,#C3D809,transparent)" }} />

                <div className="p-6" dir="rtl">
                    {/* Icon + Title */}
                    <div className="flex items-center gap-3 mb-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors.iconBg}`}>
                            {colors.icon}
                        </div>
                        <h3 className="font-bold text-white text-base">
                            {options.title ?? (variant === "danger" ? "تأكيد الحذف" : variant === "warning" ? "تحذير" : "تأكيد")}
                        </h3>
                    </div>

                    {/* Message */}
                    <p className="text-sm text-gray-400 leading-relaxed mb-6">{options.message}</p>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={() => resolve(false)}
                            className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-all text-sm font-medium"
                        >
                            {options.cancelLabel ?? "إلغاء"}
                        </button>
                        <button
                            onClick={() => resolve(true)}
                            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${colors.btn}`}
                        >
                            {options.confirmLabel ?? "تأكيد"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function BrandUIProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [confirmState, setConfirmState] = useState<{ options: ConfirmOptions; resolve: (v: boolean) => void } | null>(null);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const toast = useCallback((message: string, type: ToastType = "info", duration?: number) => {
        const id = Math.random().toString(36).slice(2);
        setToasts(prev => [...prev.slice(-4), { id, type, message, duration }]);
    }, []);

    const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
        return new Promise(resolve => {
            setConfirmState({ options, resolve: (val) => { setConfirmState(null); resolve(val); } });
        });
    }, []);

    return (
        <BrandUIContext.Provider value={{ toast, confirm }}>
            {children}

            {/* Toast Container */}
            <div className="fixed bottom-5 left-5 z-[9998] flex flex-col gap-2.5 pointer-events-none">
                <style>{`@keyframes shrink { from { width:100% } to { width:0% } }`}</style>
                {toasts.map(t => (
                    <div key={t.id} className="pointer-events-auto">
                        <ToastItem toast={t} onRemove={removeToast} />
                    </div>
                ))}
            </div>

            {/* Confirm Dialog */}
            {confirmState && (
                <ConfirmDialog options={confirmState.options} onResolve={confirmState.resolve} />
            )}
        </BrandUIContext.Provider>
    );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useBrandUI() {
    const ctx = useContext(BrandUIContext);
    if (!ctx) throw new Error("useBrandUI must be used inside BrandUIProvider");
    return ctx;
}
