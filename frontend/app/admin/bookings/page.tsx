"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";
import {
    FaCalendarAlt, FaClock, FaUser, FaPhone, FaCheck, FaTimes,
    FaCheckDouble, FaFilter, FaClipboardList, FaWhatsapp, FaTrash
} from "react-icons/fa";

interface Booking {
    id: number;
    customer_name: string;
    customer_phone: string;
    booking_date: string;
    booking_time: string;
    status: "pending" | "confirmed" | "cancelled" | "completed";
    service_name: string;
    service_price: string;
    employee_name: string | null;
    salon_name: string;
    notes: string | null;
}

interface Stats {
    total: number;
    pending: number;
    confirmed: number;
    cancelled: number;
    completed: number;
    today: number;
}

export default function AdminBookings() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState("today");
    const [statusFilter, setStatusFilter] = useState("");
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    useEffect(() => { loadBookings(); }, [period, statusFilter]);

    const loadBookings = async () => {
        try {
            const params: Record<string, string> = { period };
            if (statusFilter) params.status = statusFilter;
            const res = await api.get("/bookings/index.php", { params });
            setBookings(res.data.data.bookings || []);
            setStats(res.data.data.stats || null);
        } catch { console.error("Error loading bookings"); }
        finally { setLoading(false); }
    };

    const sendWhatsApp = (b: Booking, type: "confirmed" | "cancelled") => {
        const phone = b.customer_phone.replace(/^0/, "962");
        const time12 = formatTime(b.booking_time);
        let msg = "";
        if (type === "confirmed") {
            msg = `مرحباً ${b.customer_name} 👋\n\n✅ تم *تأكيد* حجزك في *${b.salon_name}*\n\n📅 ${dayName(b.booking_date)} ${b.booking_date}\n⏰ ${time12}\n✂️ ${b.service_name}${b.employee_name ? `\n💇 الحلاق: ${b.employee_name}` : ""}\n\nنراك قريباً! 🙏`;
        } else {
            msg = `مرحباً ${b.customer_name} 👋\n\nنعتذر منك، تم *إلغاء* حجزك في *${b.salon_name}* ليوم ${b.booking_date} الساعة ${time12}.\n\nيمكنك الحجز مرة أخرى في وقت آخر. شكراً لتفهمك 🙏`;
        }
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
    };

    const handleStatus = async (id: number, status: string) => {
        setActionLoading(id);
        try {
            await api.patch(`/bookings/index.php?id=${id}`, { status });
            // فتح واتساب تلقائياً عند التأكيد أو الرفض
            const booking = bookings.find(b => b.id === id);
            if (booking && (status === "confirmed" || status === "cancelled")) {
                sendWhatsApp(booking, status as "confirmed" | "cancelled");
            }
            loadBookings();
        } catch { alert("حدث خطأ"); }
        finally { setActionLoading(null); }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("هل تريد حذف هذا الحجز؟")) return;
        try {
            await api.delete(`/bookings/index.php?id=${id}`);
            loadBookings();
        } catch { alert("حدث خطأ"); }
    };

    const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
        pending: { label: "بانتظار التأكيد", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
        confirmed: { label: "مؤكد", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
        cancelled: { label: "ملغي", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
        completed: { label: "مكتمل", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
    };

    const dayName = (d: string) => {
        const days = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
        return days[new Date(d).getDay()];
    };

    const formatTime = (t: string) => {
        const [h, m] = t.split(":");
        const hour = parseInt(h);
        const ampm = hour >= 12 ? "م" : "ص";
        const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        return `${h12}:${m} ${ampm}`;
    };

    if (loading) {
        return <div className="flex items-center justify-center py-20"><div className="spinner" /></div>;
    }

    return (
        <div className="space-y-4 md:space-y-6 animate-fadeIn px-4 md:px-0 py-4 md:py-0">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <FaClipboardList className="text-gold" /> إدارة الحجوزات
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">إدارة مواعيد الزبائن</p>
                </div>
            </div>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-3 md:grid-cols-5 gap-2 md:gap-3">
                    {[
                        { label: "اليوم", value: stats.today, color: "text-gold" },
                        { label: "بانتظار", value: stats.pending, color: "text-amber-400" },
                        { label: "مؤكد", value: stats.confirmed, color: "text-emerald-400" },
                        { label: "مكتمل", value: stats.completed, color: "text-blue-400" },
                        { label: "ملغي", value: stats.cancelled, color: "text-red-400" },
                    ].map((s, i) => (
                        <div key={i} className={`chart-card text-center py-2 md:py-3 ${i === 0 || i === 1 ? 'col-span-1' : ''}`}>
                            <p className={`text-lg md:text-2xl font-bold ${s.color}`}>{s.value}</p>
                            <p className="text-[10px] md:text-xs text-gray-400">{s.label}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Filters */}
            <div className="flex gap-2 items-center overflow-x-auto hide-scrollbar pb-1 -mx-4 px-4 md:mx-0 md:px-0 scroll-smooth">
                <div className="flex-shrink-0">
                    <FaFilter className="text-gray-500 text-sm hidden md:block" />
                </div>
                {[
                    { key: "today", label: "اليوم" },
                    { key: "tomorrow", label: "غداً" },
                    { key: "week", label: "هذا الأسبوع" },
                    { key: "month", label: "هذا الشهر" },
                    { key: "all", label: "الكل" },
                ].map((f) => (
                    <button key={f.key} onClick={() => setPeriod(f.key)}
                        className={`flex-shrink-0 px-3 py-1.5 md:py-1.5 rounded-full text-xs font-bold transition-all ${period === f.key ? "bg-gold text-black" : "bg-dark text-gray-400 hover:text-white"
                            }`}
                    >{f.label}</button>
                ))}

                <div className="mx-1 h-4 w-px bg-gray-700 flex-shrink-0" />

                {[
                    { key: "", label: "الكل" },
                    { key: "pending", label: "بانتظار" },
                    { key: "confirmed", label: "مؤكد" },
                    { key: "completed", label: "مكتمل" },
                ].map((f) => (
                    <button key={f.key} onClick={() => setStatusFilter(f.key)}
                        className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${statusFilter === f.key ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"
                            }`}
                    >{f.label}</button>
                ))}
            </div>

            {/* Bookings List */}
            <div className="space-y-3">
                <AnimatePresence>
                    {bookings.map((b) => {
                        const sc = statusConfig[b.status];
                        return (
                            <motion.div
                                key={b.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                                className={`chart-card border ${sc.bg} p-3 md:p-4`}
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                    {/* Info */}
                                    <div className="flex-1 space-y-1.5 md:space-y-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className={`text-[10px] md:text-xs font-bold px-2 py-0.5 rounded-full border ${sc.bg} ${sc.color}`}>
                                                {sc.label}
                                            </span>
                                            <span className="text-white text-sm md:text-base font-bold">{b.customer_name}</span>
                                            <a href={`tel:${b.customer_phone}`} className="text-gray-400 text-xs md:text-sm flex items-center gap-1 hover:text-gold mr-auto md:mr-0">
                                                <FaPhone size={10} /> <span dir="ltr">{b.customer_phone}</span>
                                            </a>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs md:text-sm text-gray-400 flex-wrap">
                                            <span className="flex items-center gap-1">
                                                <FaCalendarAlt size={10} className="text-gold" />
                                                {dayName(b.booking_date)} {b.booking_date}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <FaClock size={10} className="text-gold" />
                                                {formatTime(b.booking_time)}
                                            </span>
                                            <span className="text-gold font-semibold">{b.service_name}</span>
                                            {b.employee_name && (
                                                <span className="flex items-center gap-1">
                                                    <FaUser size={9} /> {b.employee_name}
                                                </span>
                                            )}
                                        </div>
                                        {b.notes && <p className="text-[11px] md:text-xs text-gray-500 mt-1 pl-2 border-r-2 border-gray-700">📝 {b.notes}</p>}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1.5 md:gap-2 flex-wrap mt-2 md:mt-0">
                                        {b.status === "pending" && (
                                            <>
                                                <button
                                                    onClick={() => handleStatus(b.id, "confirmed")}
                                                    disabled={actionLoading === b.id}
                                                    className="flex-1 md:flex-none justify-center flex items-center gap-1 px-3 py-2 md:py-1.5 rounded-lg text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all"
                                                >
                                                    <FaCheck size={10} /> تأكيد
                                                </button>
                                                <button
                                                    onClick={() => handleStatus(b.id, "cancelled")}
                                                    disabled={actionLoading === b.id}
                                                    className="flex-1 md:flex-none justify-center flex items-center gap-1 px-3 py-2 md:py-1.5 rounded-lg text-xs font-bold bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all"
                                                >
                                                    <FaTimes size={10} /> رفض
                                                </button>
                                            </>
                                        )}
                                        {b.status === "confirmed" && (
                                            <button
                                                onClick={() => handleStatus(b.id, "completed")}
                                                disabled={actionLoading === b.id}
                                                className="flex-1 md:flex-none justify-center flex items-center gap-1 px-3 py-2 md:py-1.5 rounded-lg text-xs font-bold bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-all"
                                            >
                                                <FaCheckDouble size={10} /> إكمال
                                            </button>
                                        )}
                                        <div className="flex gap-1.5 items-center justify-end w-full md:w-auto mt-2 md:mt-0">
                                            <button
                                                onClick={() => {
                                                    const phone = b.customer_phone.replace(/^0/, "962");
                                                    window.open(`https://wa.me/${phone}`, "_blank");
                                                }}
                                                className="flex-1 md:flex-none flex items-center justify-center p-2 rounded-lg text-green-500 bg-green-500/10 border border-green-500/20 hover:text-green-400 hover:bg-green-500/20 transition-all"
                                            ><FaWhatsapp size={14} /></button>
                                            <button
                                                onClick={() => handleDelete(b.id)}
                                                className="flex-1 md:flex-none flex items-center justify-center p-2 rounded-lg text-gray-400 bg-gray-500/10 border border-gray-500/20 hover:text-red-400 hover:bg-red-500/20 hover:border-red-500/30 transition-all"
                                            ><FaTrash size={12} /></button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {bookings.length === 0 && (
                    <div className="text-center py-16 text-gray-500">
                        <FaClipboardList className="mx-auto text-4xl mb-3 text-gray-700" />
                        <p>لا توجد حجوزات {period === "today" ? "لليوم" : ""}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
