"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface CustomSelectOption {
    value: string;
    label: string;
    icon?: React.ReactNode;
}

interface CustomSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: CustomSelectOption[];
    placeholder?: string;
    leadingIcon?: React.ReactNode;
    ariaLabel?: string;
    className?: string;
}

/**
 * Themed dropdown that replaces the native <select>. Matches the app's
 * charcoal + lime design language (same pattern as BranchSwitcher).
 * - Full-width: fits the grid cell / parent container
 * - Click-outside to close
 * - Keyboard: Escape to close
 */
export default function CustomSelect({
    value,
    onChange,
    options,
    placeholder = "اختر…",
    leadingIcon,
    ariaLabel,
    className = "",
}: CustomSelectProps) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const onClick = (e: MouseEvent) => {
            if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };
        document.addEventListener("mousedown", onClick);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onClick);
            document.removeEventListener("keydown", onKey);
        };
    }, []);

    const current = options.find((o) => o.value === value);
    const currentLabel = current?.label ?? placeholder;

    return (
        <div className={`relative w-full ${className}`} ref={rootRef}>
            {/* Trigger */}
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-label={ariaLabel}
                className="w-full form-input inline-flex items-center gap-2 text-start"
                style={{ paddingInlineStart: "12px", paddingInlineEnd: "10px" }}
            >
                {leadingIcon && (
                    <span className="text-[var(--color-text-muted)] shrink-0 flex items-center">
                        {leadingIcon}
                    </span>
                )}
                <span className={`flex-1 truncate font-bold ${current ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-muted)]"}`}>
                    {currentLabel}
                </span>
                <motion.span
                    animate={{ rotate: open ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="shrink-0 text-[var(--color-text-muted)]"
                >
                    <ChevronDown size={16} />
                </motion.span>
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        role="listbox"
                        className="absolute top-full left-0 right-0 mt-1.5 z-50 overflow-hidden"
                        style={{
                            background: "var(--color-cards)",
                            border: "1px solid rgba(195,216,9,0.18)",
                            borderRadius: "12px",
                            boxShadow: "0 16px 40px rgba(0,0,0,0.55), 0 0 0 1px rgba(195,216,9,0.04)",
                        }}
                    >
                        <div className="p-1 max-h-[280px] overflow-y-auto">
                            {options.map((opt) => {
                                const isActive = opt.value === value;
                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        role="option"
                                        aria-selected={isActive}
                                        onClick={() => {
                                            onChange(opt.value);
                                            setOpen(false);
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors"
                                        style={{
                                            background: isActive ? "var(--border-subtle)" : "transparent",
                                            color: isActive ? "var(--color-accent)" : "var(--color-text-secondary)",
                                            minHeight: "40px",
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isActive) {
                                                (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)";
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isActive) {
                                                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                                            }
                                        }}
                                    >
                                        {opt.icon && <span className="shrink-0 flex items-center">{opt.icon}</span>}
                                        <span className="flex-1 truncate text-start">{opt.label}</span>
                                        {isActive && <Check size={14} className="shrink-0" />}
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
