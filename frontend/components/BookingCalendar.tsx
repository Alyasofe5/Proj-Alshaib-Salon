"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { bookingsAPI } from "@/lib/api";
import {
    ChevronRight, ChevronLeft, Calendar, Clock, User, Phone, X,
    Scissors, FileText
} from "lucide-react";

interface CalendarBooking {
    id: number;
    customer_name: string;
    customer_phone: string;
    time: string;
    status: "confirmed" | "completed";
    services: string;
    price: number;
    employee_name: string | null;
    notes: string | null;
}

interface BookingCalendarProps {
    /** "admin" shows all, "employee" shows only their own */
    role?: "admin" | "employee";
}

const dayNames = ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];
const monthNames = [
    "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

export default function BookingCalendar({ role = "admin" }: BookingCalendarProps) {
    const today = new Date();
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth()); // 0-indexed
    const [bookings, setBookings] = useState<Record<string, CalendarBooking[]>>({});
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [total, setTotal] = useState(0);

    const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;

    useEffect(() => {
        setLoading(true);
        bookingsAPI.calendar(monthStr)
            .then((res) => {
                setBookings(res.data.data.bookings || {});
                setTotal(res.data.data.total || 0);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [monthStr]);

    const prevMonth = () => {
        if (month === 0) { setYear(y => y - 1); setMonth(11); }
        else setMonth(m => m - 1);
        setSelectedDate(null);
    };

    const nextMonth = () => {
        if (month === 11) { setYear(y => y + 1); setMonth(0); }
        else setMonth(m => m + 1);
        setSelectedDate(null);
    };

    const goToday = () => {
        setYear(today.getFullYear());
        setMonth(today.getMonth());
        setSelectedDate(null);
    };

    // Calendar grid
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDayOfMonth; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    const formatTime = (t: string) => {
        const [h, m] = t.split(":");
        const hour = parseInt(h);
        const ampm = hour >= 12 ? "م" : "ص";
        const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        return `${h12}:${m} ${ampm}`;
    };

    const selectedBookings = selectedDate ? bookings[selectedDate] || [] : [];
    const dayNameFull = (d: string) => {
        const days = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
        return days[new Date(d).getDay()];
    };

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-[#E6B31E]" />
                    <h3 className="font-bold text-sm" style={{ color: "var(--text-main)" }}>
                        {role === "employee" ? "مواعيدي المحجوزة" : "تقويم الحجوزات"}
                    </h3>
                    {total > 0 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: "rgba(230,179,30,.12)", color: "#E6B31E" }}>
                            {total} حجز
                        </span>
                    )}
                </div>
            </div>

            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-4 px-1">
                <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
                    <ChevronRight size={18} />
                </button>
                <div className="flex items-center gap-3">
                    <button onClick={goToday} className="text-[10px] px-2 py-1 rounded-md font-bold transition-all hover:bg-white/5"
                        style={{ color: "#E6B31E", border: "1px solid rgba(230,179,30,.2)" }}>
                        اليوم
                    </button>
                    <span className="text-sm font-bold text-white">
                        {monthNames[month]} {year}
                    </span>
                </div>
                <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
                    <ChevronLeft size={18} />
                </button>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
                {dayNames.map(d => (
                    <div key={d} className="text-center text-[10px] font-bold text-gray-500 py-1">{d}</div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 relative">
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/30 rounded-xl">
                        <div className="spinner" />
                    </div>
                )}
                {cells.map((day, i) => {
                    if (day === null) return <div key={`empty-${i}`} className="h-10 sm:h-12" />;
                    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const dayBookings = bookings[dateStr] || [];
                    const hasBookings = dayBookings.length > 0;
                    const isToday = dateStr === todayStr;
                    const isSelected = dateStr === selectedDate;
                    const isPast = dateStr < todayStr;

                    return (
                        <button
                            key={dateStr}
                            onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                            className={`relative h-10 sm:h-12 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all ${
                                isSelected
                                    ? "ring-2 ring-[#E6B31E] bg-[#E6B31E]/15 text-white scale-105"
                                    : isToday
                                    ? "bg-[#E6B31E]/10 text-[#E6B31E] border border-[#E6B31E]/20"
                                    : hasBookings
                                    ? "bg-white/5 text-white hover:bg-white/10"
                                    : isPast
                                    ? "text-gray-700"
                                    : "text-gray-400 hover:bg-white/5"
                            }`}
                        >
                            {day}
                            {/* Dots indicator */}
                            {hasBookings && (
                                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                                    {dayBookings.slice(0, 3).map((b, j) => (
                                        <div key={j} className="w-1 h-1 rounded-full" style={{
                                            background: b.status === "confirmed" ? "#4CAF50" : "#2196F3"
                                        }} />
                                    ))}
                                    {dayBookings.length > 3 && (
                                        <div className="w-1 h-1 rounded-full bg-gray-500" />
                                    )}
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 mt-3 text-[10px] text-gray-500">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#4CAF50]" /> مؤكد</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#2196F3]" /> مكتمل</span>
            </div>

            {/* Selected Day Bookings */}
            <AnimatePresence>
                {selectedDate && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 overflow-hidden"
                    >
                        <div className="rounded-xl overflow-hidden" style={{ background: "var(--off-white)", border: "1px solid var(--border)" }}>
                            {/* Day Header */}
                            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                                <div className="flex items-center gap-2">
                                    <Calendar size={13} className="text-[#E6B31E]" />
                                    <span className="text-xs font-bold text-white">
                                        {dayNameFull(selectedDate)} {selectedDate}
                                    </span>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: "rgba(230,179,30,.12)", color: "#E6B31E" }}>
                                        {selectedBookings.length} حجز
                                    </span>
                                </div>
                                <button onClick={() => setSelectedDate(null)} className="text-gray-500 hover:text-white transition-colors">
                                    <X size={14} />
                                </button>
                            </div>

                            {/* Bookings List */}
                            {selectedBookings.length === 0 ? (
                                <div className="py-8 text-center text-gray-500 text-sm">
                                    لا توجد حجوزات مؤكدة لهذا اليوم
                                </div>
                            ) : (
                                <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                                    {selectedBookings.map((b) => (
                                        <div key={b.id} className="px-4 py-3 hover:bg-white/[0.02] transition-colors">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                                            b.status === "confirmed"
                                                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                                                : "bg-blue-500/10 border-blue-500/20 text-blue-400"
                                                        }`}>
                                                            {b.status === "confirmed" ? "مؤكد" : "مكتمل"}
                                                        </span>
                                                        <span className="text-sm font-bold text-white truncate">{b.customer_name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-400 flex-wrap">
                                                        <span className="flex items-center gap-1">
                                                            <Clock size={10} className="text-[#E6B31E]" />
                                                            {formatTime(b.time)}
                                                        </span>
                                                        <span className="flex items-center gap-1 text-[#E6B31E] font-semibold">
                                                            <Scissors size={10} />
                                                            {b.services}
                                                        </span>
                                                        {b.employee_name && role === "admin" && (
                                                            <span className="flex items-center gap-1">
                                                                <User size={9} />
                                                                {b.employee_name}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {b.notes && (
                                                        <p className="text-[10px] text-gray-500 mt-1">
                                                            <FileText size={9} className="inline mr-1" />{b.notes}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="text-left flex-shrink-0">
                                                    <a href={`tel:${b.customer_phone}`} className="text-gray-500 hover:text-[#E6B31E] transition-colors">
                                                        <Phone size={14} />
                                                    </a>
                                                    <p className="text-[#E6B31E] font-bold text-xs mt-1">{b.price.toFixed(2)} د.أ</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
