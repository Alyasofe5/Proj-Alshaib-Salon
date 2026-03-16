"use client";

import { motion } from "framer-motion";
import BookingCalendar from "@/components/BookingCalendar";
import { CalendarDays } from "lucide-react";
import { useAuthStore } from "@/lib/store";

export default function CalendarPage() {
    const { user } = useAuthStore();
    const role = user?.role === "employee" ? "employee" : "admin";

    return (
        <>
            <div className="topbar">
                <div>
                    <div className="topbar-title">
                        تقويم <span>الحجوزات</span>
                    </div>
                    <div className="topbar-date">
                        <CalendarDays size={12} style={{ display: "inline", marginLeft: "5px", verticalAlign: "middle" }} />
                        {new Date().toLocaleDateString("ar-JO", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                        })}
                    </div>
                </div>
            </div>

            <div className="content-area">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="chart-card"
                >
                    <BookingCalendar role={role} />
                </motion.div>
            </div>
        </>
    );
}
