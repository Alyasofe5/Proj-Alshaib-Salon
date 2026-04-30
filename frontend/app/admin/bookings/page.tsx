"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";
import {
    CalendarDays, Clock, User, Phone, Check, X as XIcon,
    CheckCheck, Filter, ClipboardList, MessageCircle, Trash2, FileText, UserCheck
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { tData } from "@/lib/i18n";
import CustomSelect from "@/components/CustomSelect";

interface Booking {
    id: number;
    customer_name: string;
    customer_phone: string;
    booking_date: string;
    booking_time: string;
    status: "pending" | "confirmed" | "cancelled" | "completed";
    service_name: string;
    service_names: string;
    service_price: string;
    employee_id: number | null;
    employee_name: string | null;
    salon_name: string;
    notes: string | null;
}

interface Employee {
    id: number;
    name: string;
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

    // Modal state لاختيار الحلاق
    const [assignModal, setAssignModal] = useState<{ booking: Booking } | null>(null);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [selectedEmpId, setSelectedEmpId] = useState<number | null>(null);
    const [empLoading, setEmpLoading] = useState(false);
    const [whatsappMessageTemplate, setWhatsappMessageTemplate] = useState<string>("");

    useEffect(() => { loadBookings(); }, [period, statusFilter]);
    
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await api.get("/salon/settings.php");
                if (res.data?.data?.whatsapp_message) {
                    setWhatsappMessageTemplate(res.data.data.whatsapp_message);
                }
            } catch (err) { console.error("Error loading settings for whatsapp", err); }
        };
        fetchSettings();
    }, []);

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

    const loadEmployees = async () => {
        setEmpLoading(true);
        try {
            const res = await api.get("/employees/index.php");
            setEmployees(res.data.data || []);
        } catch { console.error("Error loading employees"); }
        finally { setEmpLoading(false); }
    };

    const openAssignModal = async (booking: Booking) => {
        setAssignModal({ booking });
        setSelectedEmpId(null);
        await loadEmployees();
    };

    const sendWhatsApp = (b: Booking, type: "confirmed" | "cancelled", empName?: string) => {
        const phone = b.customer_phone.replace(/^0/, "962");
        const time12 = formatTime(b.booking_time);
        
        // استخراج النص العربي لتجنب ظهور علامات || اللغوية
        const salonNameAr = tData(b.salon_name, 'ar');
        const servicesAr = tData(b.service_names || b.service_name, 'ar');
        const rawBarber = empName || b.employee_name;
        const barberAr = rawBarber ? tData(rawBarber, 'ar') : "";
        
        let msg = "";
        if (type === "confirmed") {
            const customFooter = whatsappMessageTemplate ? whatsappMessageTemplate : `🔸 يرجى الحضور قبل الموعد بـ 10 دقائق.\nنتطلع لرؤيتك قريباً! 🖤`;
            msg = `✨ أهلاً بك ${b.customer_name} ✨\n\nيسعدنا تأكيد حجزك في ⚜️ *${salonNameAr}* ⚜️\n\n📅 الموعد: ${dayName(b.booking_date)} ${b.booking_date}\n⏰ الوقت: ${time12}\n✂️ الخدمة: ${servicesAr}${barberAr ? `\n💈 الحلاق: ${barberAr}` : ""}\n\n${customFooter}`;
        } else {
            msg = `✨ أهلاً بك ${b.customer_name} ✨\n\nنعتذر منك، تم *إلغاء* حجزك في ⚜️ *${salonNameAr}* ⚜️\nالمقرر في ${dayName(b.booking_date)} ${b.booking_date} الساعة ${time12}.\n\nنتمنى أن نتشرف بزيارتك في وقت آخر قريب،\nيمكنك حجز موعد جديد في أي وقت! 🖤`;
        }
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
    };

    const handleStatus = async (id: number, status: string, assignedEmpId?: number, empName?: string) => {
        setActionLoading(id);
        try {
            const payload: Record<string, unknown> = { status };
            if (assignedEmpId) payload.assigned_employee_id = assignedEmpId;

            await api.patch(`/bookings/index.php?id=${id}`, payload);

            const booking = bookings.find(b => b.id === id);
            if (booking && (status === "confirmed" || status === "cancelled")) {
                sendWhatsApp(booking, status as "confirmed" | "cancelled", empName);
            }
            setAssignModal(null);
            loadBookings();
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "حدث خطأ";
            alert(msg);
        } finally { setActionLoading(null); }
    };

    // زر "تأكيد" — إذا "أي حلاق" افتح modal، وإلا أكد مباشرة
    const handleConfirmClick = (b: Booking) => {
        if (!b.employee_id) {
            openAssignModal(b);
        } else {
            handleStatus(b.id, "confirmed");
        }
    };

    const handleAssignAndConfirm = () => {
        if (!assignModal || !selectedEmpId) return;
        const emp = employees.find(e => e.id === selectedEmpId);
        handleStatus(assignModal.booking.id, "confirmed", selectedEmpId, emp?.name);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("هل تريد حذف هذا الحجز؟")) return;
        try {
            await api.delete(`/bookings/index.php?id=${id}`);
            loadBookings();
        } catch { alert("حدث خطأ"); }
    };

    const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
        pending: { label: "بانتظار التأكيد", color: "text-accent-lime", bg: "bg-accent-lime/10 border-accent-lime/20" },
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
        <>
            <div className="topbar">
                <div>
                    <div className="topbar-title">
                        <ClipboardList size={18} className="inline-block align-middle ml-2 text-accent-lime" />
                        إدارة <span>الحجوزات</span>
                    </div>
                    <div className="topbar-date">إدارة مواعيد الزبائن</div>
                </div>
            </div>

            <div className="content-area space-y-4 md:space-y-6">

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 md:gap-3">
                    {[
                        { label: "اليوم", value: stats.today, color: "text-accent-lime" },
                        { label: "بانتظار", value: stats.pending, color: "text-accent-lime" },
                        { label: "مؤكد", value: stats.confirmed, color: "text-emerald-400" },
                        { label: "مكتمل", value: stats.completed, color: "text-blue-400" },
                        { label: "ملغي", value: stats.cancelled, color: "text-red-400" },
                    ].map((s, i) => (
                        <div key={i} className="chart-card flex flex-col items-center justify-center text-center py-3 px-2 min-h-[72px]">
                            <p className={`text-xl md:text-2xl font-bold leading-none ${s.color}`} style={{ fontVariantNumeric: 'tabular-nums' }}>{s.value}</p>
                            <p className="text-[11px] md:text-xs text-gray-400 mt-1.5">{s.label}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Filters */}
            {(() => {
                const periodOptions = [
                    { key: "today", label: "اليوم" },
                    { key: "tomorrow", label: "غداً" },
                    { key: "week", label: "هذا الأسبوع" },
                    { key: "month", label: "هذا الشهر" },
                    { key: "all", label: "الكل" },
                ];
                const statusOptions = [
                    { key: "", label: "الكل" },
                    { key: "pending", label: "بانتظار" },
                    { key: "confirmed", label: "مؤكد" },
                    { key: "completed", label: "مكتمل" },
                ];
                return (
                    <>
                        {/* Mobile: themed dropdowns */}
                        <div className="grid grid-cols-2 gap-2 md:hidden min-w-0">
                            <CustomSelect
                                value={period}
                                onChange={setPeriod}
                                options={periodOptions.map((f) => ({ value: f.key, label: f.label }))}
                                leadingIcon={<Filter size={14} />}
                                ariaLabel="الفترة"
                            />
                            <CustomSelect
                                value={statusFilter}
                                onChange={setStatusFilter}
                                options={statusOptions.map((f) => ({ value: f.key, label: f.label }))}
                                ariaLabel="الحالة"
                            />
                        </div>

                        {/* Desktop / tablet: chip row */}
                        <div className="hidden md:flex gap-2 items-center overflow-x-auto hide-scrollbar pb-1 scroll-smooth">
                            <div className="flex-shrink-0">
                                <Filter size={14} className="text-gray-500" />
                            </div>
                            {periodOptions.map((f) => (
                                <button key={f.key} onClick={() => setPeriod(f.key)}
                                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${period === f.key ? "bg-white/10 text-accent-lime border border-accent-lime/20" : "bg-dark text-gray-400 hover:text-white"
                                        }`}
                                >{f.label}</button>
                            ))}
                            <div className="mx-1 h-4 w-px bg-gray-700 flex-shrink-0" />
                            {statusOptions.map((f) => (
                                <button key={f.key} onClick={() => setStatusFilter(f.key)}
                                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${statusFilter === f.key ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"
                                        }`}
                                >{f.label}</button>
                            ))}
                        </div>
                    </>
                );
            })()}

            {/* Bookings List */}
            <div className="space-y-4">
                <AnimatePresence>
                    {bookings.map((b) => {
                        const sc = statusConfig[b.status];
                        const isAnyBarber = !b.employee_id;
                        return (
                            <motion.div
                                key={b.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                                className="group rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-4 md:p-5 hover:border-[#C3D809]/20 hover:shadow-[0_8px_30px_rgba(195,216,9,0.08)] transition-all duration-300"
                            >
                                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                                    {/* Main Info */}
                                    <div className="flex-1 min-w-0 space-y-3">
                                        {/* Header Row: Status + Name + Phone */}
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${sc.bg} ${sc.color}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${sc.color.replace('text-', 'bg-')}`} />
                                                {sc.label}
                                            </span>
                                            {isAnyBarber && b.status === "pending" && (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#C3D809]/15 border border-[#C3D809]/30 text-[#C3D809]">
                                                    <UserCheck size={12} />
                                                    يحتاج تعيين حلاق
                                                </span>
                                            )}
                                        </div>
                                        
                                        {/* Customer Info */}
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C3D809] to-[#8FA807] flex items-center justify-center text-[#0A0A0B] font-bold text-lg">
                                                {b.customer_name.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="text-white font-bold text-base">{b.customer_name}</h3>
                                                <a href={`tel:${b.customer_phone}`} className="text-gray-400 text-sm flex items-center gap-1.5 hover:text-[#C3D809] transition-colors" dir="ltr">
                                                    <Phone size={14} />
                                                    {b.customer_phone}
                                                </a>
                                            </div>
                                        </div>
                                        
                                        {/* Details Grid */}
                                        <div className="flex flex-wrap items-center gap-4 text-sm">
                                            <div className="flex items-center gap-2 text-gray-300 bg-white/5 px-3 py-1.5 rounded-lg">
                                                <CalendarDays size={16} className="text-[#C3D809]" />
                                                <span>{dayName(b.booking_date)}</span>
                                                <span className="text-gray-500">|</span>
                                                <span dir="ltr">{b.booking_date}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-300 bg-white/5 px-3 py-1.5 rounded-lg">
                                                <Clock size={16} className="text-[#C3D809]" />
                                                <span>{formatTime(b.booking_time)}</span>
                                            </div>
                                        </div>
                                        
                                        {/* Services & Barber */}
                                        <div className="flex flex-wrap items-center gap-3">
                                            <div className="flex items-center gap-2 text-[#C3D809] bg-[#C3D809]/10 px-3 py-1.5 rounded-lg text-sm font-medium">
                                                <ClipboardList size={16} />
                                                {b.service_names || b.service_name}
                                            </div>
                                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${b.employee_name ? 'bg-white/5 text-gray-300' : 'bg-[#C3D809]/10 text-[#C3D809]'}`}>
                                                <User size={16} className={b.employee_name ? 'text-gray-400' : 'text-[#C3D809]'} />
                                                {b.employee_name || "أي حلاق متاح"}
                                            </div>
                                        </div>
                                        
                                        {/* Notes */}
                                        {b.notes && (
                                            <div className="flex items-start gap-2 text-gray-400 text-sm bg-white/[0.03] p-3 rounded-xl border border-white/[0.04]">
                                                <FileText size={16} className="text-gray-500 flex-shrink-0 mt-0.5" />
                                                <p>{b.notes}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-col gap-2 lg:min-w-[200px]">
                                        {/* Primary Actions */}
                                        <div className="flex flex-wrap gap-2">
                                            {b.status === "pending" && (
                                                <>
                                                    <button
                                                        onClick={() => handleConfirmClick(b)}
                                                        disabled={actionLoading === b.id}
                                                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 hover:border-emerald-500/40 transition-all disabled:opacity-50"
                                                    >
                                                        <Check size={16} />
                                                        {isAnyBarber ? "تعيين وتأكيد" : "تأكيد"}
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatus(b.id, "cancelled")}
                                                        disabled={actionLoading === b.id}
                                                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 hover:border-red-500/40 transition-all disabled:opacity-50"
                                                    >
                                                        <XIcon size={16} />
                                                        رفض
                                                    </button>
                                                </>
                                            )}
                                            {b.status === "confirmed" && (
                                                <button
                                                    onClick={() => handleStatus(b.id, "completed")}
                                                    disabled={actionLoading === b.id}
                                                    className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-blue-500/15 border border-blue-500/30 text-blue-400 hover:bg-blue-500/25 hover:border-blue-500/40 transition-all disabled:opacity-50"
                                                >
                                                    <CheckCheck size={16} />
                                                    إكمال
                                                </button>
                                            )}
                                        </div>
                                        
                                        {/* Secondary Actions */}
                                        <div className="flex gap-2 pt-2 border-t border-white/5">
                                            <button
                                                onClick={() => {
                                                    const phone = b.customer_phone.replace(/^0/, "962");
                                                    window.open(`https://wa.me/${phone}`, "_blank");
                                                }}
                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 hover:border-green-500/30 transition-all"
                                            >
                                                <FaWhatsapp size={18} />
                                                واتساب
                                            </button>
                                            <button
                                                onClick={() => handleDelete(b.id)}
                                                className="flex items-center justify-center p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {bookings.length === 0 && (
                    <div className="text-center py-16 text-gray-500">
                        <ClipboardList size={36} className="mx-auto mb-3 text-gray-700" />
                        <p>لا توجد حجوزات {period === "today" ? "لليوم" : ""}</p>
                    </div>
                )}
            </div>

            {/* ===== Modal: اختيار الحلاق ===== */}
            <AnimatePresence>
                {assignModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
                        onClick={() => setAssignModal(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="chart-card w-full max-w-sm p-5 space-y-4"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-white font-bold text-base flex items-center gap-2">
                                        <UserCheck size={16} className="text-accent-lime" /> تعيين حلاق
                                    </h2>
                                    <p className="text-gray-500 text-xs mt-0.5">
                                        {assignModal.booking.customer_name} — {formatTime(assignModal.booking.booking_time)}
                                    </p>
                                </div>
                                <button onClick={() => setAssignModal(null)} className="text-gray-500 hover:text-white transition-colors">
                                    <XIcon size={18} />
                                </button>
                            </div>

                            {/* قائمة الموظفين */}
                            {empLoading ? (
                                <div className="flex justify-center py-6"><div className="spinner" /></div>
                            ) : (
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {employees.length === 0 ? (
                                        <p className="text-center text-gray-500 text-sm py-4">لا يوجد موظفون نشطون</p>
                                    ) : employees.map((emp) => (
                                        <button
                                            key={emp.id}
                                            onClick={() => setSelectedEmpId(emp.id)}
                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all text-right ${selectedEmpId === emp.id
                                                    ? "bg-accent-lime/10 border-accent-lime/40 text-accent-lime"
                                                    : "bg-white/5 border-white/10 text-gray-300 hover:border-white/20 hover:text-white"
                                                }`}
                                        >
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${selectedEmpId === emp.id ? "bg-accent-lime/20 text-accent-lime" : "bg-white/10 text-gray-400"}`}>
                                                {tData(emp.name, 'ar').charAt(0)}
                                            </div>
                                            {tData(emp.name, 'ar')}
                                            {selectedEmpId === emp.id && (
                                                <Check size={14} className="mr-auto text-accent-lime" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* زر التأكيد */}
                            <button
                                onClick={handleAssignAndConfirm}
                                disabled={!selectedEmpId || actionLoading === assignModal.booking.id}
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25"
                            >
                                {actionLoading === assignModal.booking.id ? (
                                    <div className="spinner" />
                                ) : (
                                    <>
                                        <Check size={14} /> تأكيد الحجز وإرسال واتساب
                                    </>
                                )}
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            </div>
        </>
    );
}
