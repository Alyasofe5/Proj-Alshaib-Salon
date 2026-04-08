"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";

interface StatCardProps {
    icon: ReactNode;
    value: string | number;
    label: string;
    sub?: string;
    color: 'lime' | "green" | "blue" | "red" | "purple";
    onClick?: () => void;
}

export default function StatCard({
    icon,
    value,
    label,
    sub,
    color,
    onClick,
}: StatCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClick}
            className={`stat-card ${onClick ? 'cursor-pointer' : ''}`}
        >
            <div className={`stat-icon ${color}`}>{icon}</div>
            <div className="stat-value">{value}</div>
            <div className="stat-label">{label}</div>
            {sub && <div className="stat-sub">{sub}</div>}
        </motion.div>
    );
}
