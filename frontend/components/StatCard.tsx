"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";

interface StatCardProps {
    icon: ReactNode;
    value: string | number;
    label: string;
    sub?: string;
    color: "gold" | "green" | "blue" | "red" | "purple";
}

export default function StatCard({
    icon,
    value,
    label,
    sub,
    color,
}: StatCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="stat-card"
        >
            <div className={`stat-icon ${color}`}>{icon}</div>
            <div className="stat-value">{value}</div>
            <div className="stat-label">{label}</div>
            {sub && <div className="stat-sub">{sub}</div>}
        </motion.div>
    );
}
