"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { bookingsAPI, employeesAPI, servicesAPI } from "@/lib/api";
import {
    ChevronRight, ChevronLeft, Calendar, Clock, User, Phone, X,
    Scissors, FileText, Plus, Check, AlertCircle, Loader2,
    Pencil, Trash2
} from "lucide-react";
import { tData } from "@/lib/i18n";

interface CalendarBooking {
    id: number;
    customer_name: string;
    customer_phone: string;
    time: string;
    status: "confirmed" | "completed";
    services: string;
    price: number;
    employee_name: string | null;
    employee_id?: number;
    notes: string | null;
    booking_date?: string;
}

interface Employee { id: number; name: string; is_active: boolean; }
interface Service { id: number; name: string; price: number; is_active: boolean; }

interface BookingCalendarProps {
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
    const [month, setMonth] = useState(today.getMonth());
    const [bookings, setBookings] = useState<Record<string, CalendarBooking[]>>({});
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [total, setTotal] = useState(0);

    // Manual booking modal state
    const [showModal, setShowModal] = useState(false);
    const [modalDate, setModalDate] = useState("");
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [formData, setFormData] = useState({
        customer_name: "",
        customer_phone: "",
        employee_id: "",
        service_ids: [] as number[],
        booking_time: "",
        notes: "",
    });
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState("");
    const [formSuccess, setFormSuccess] = useState("");
    const [bookedSlots, setBookedSlots] = useState<{ booking_time: string; employee_id: number }[]>([]);

    // Edit modal state
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingBooking, setEditingBooking] = useState<CalendarBooking | null>(null);
    const [editForm, setEditForm] = useState({
        customer_name: "",
        customer_phone: "",
        employee_id: "",
        booking_time: "",
        notes: "",
    });
    const [editSaving, setEditSaving] = useState(false);
    const [editError, setEditError] = useState("");
    const [editSuccess, setEditSuccess] = useState("");

    // Delete state
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

    const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;

    const fetchBookings = useCallback(() => {
        setLoading(true);
        bookingsAPI.calendar(monthStr)
            .then((res) => {
                setBookings(res.data.data.bookings || {});
                setTotal(res.data.data.total || 0);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [monthStr]);

    useEffect(() => { fetchBookings(); }, [fetchBookings]);

    // Load employees & services for admin booking
    useEffect(() => {
        if (role !== "admin") return;
        employeesAPI.getAll().then(res => {
            const list = res.data.data?.employees || res.data.data || [];
            setEmployees(Array.isArray(list) ? list.filter((e: Employee) => e.is_active) : []);
        }).catch(() => {});
        servicesAPI.getAll(true).then(res => {
            const list = res.data.data?.services || res.data.data || [];
            setServices(Array.isArray(list) ? list.filter((s: Service) => s.is_active) : []);
        }).catch(() => {});
    }, [role]);

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
    const firstDayOfMonth = new Date(year, month, 1).getDay();
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

    // Generate time slots (30-min intervals from 8:00 to 22:00)
    const generateTimeSlots = () => {
        const slots = [];
        for (let h = 8; h < 22; h++) {
            slots.push(`${String(h).padStart(2, "0")}:00`);
            slots.push(`${String(h).padStart(2, "0")}:30`);
        }
        return slots;
    };

    const isSlotBooked = (time: string, empId: number) => {
        return bookedSlots.some(s =>
            s.booking_time === time + ":00" && s.employee_id === empId
        ) || bookedSlots.some(s =>
            s.booking_time === time && s.employee_id === empId
        );
    };

    const getAvailableTimesForEmployee = (empId: number) => {
        if (!empId) return generateTimeSlots();
        return generateTimeSlots().filter(t => !isSlotBooked(t, empId));
    };

    // Handle clicking on a date → open modal for admin, select for employee
    const handleDateClick = (dateStr: string) => {
        if (selectedDate === dateStr) {
            setSelectedDate(null);
            return;
        }
        setSelectedDate(dateStr);
    };

    // Open manual booking modal
    const openBookingModal = (dateStr: string) => {
        setModalDate(dateStr);
        setFormData({
            customer_name: "",
            customer_phone: "",
            employee_id: "",
            service_ids: [],
            booking_time: "",
            notes: "",
        });
        setFormError("");
        setFormSuccess("");
        setBookedSlots([]);
        setShowModal(true);

        // Load booked slots for this date
        const existingBookings = bookings[dateStr] || [];
        const slots = existingBookings.map(b => ({
            booking_time: b.time,
            employee_id: b.employee_id || 0,
        }));
        setBookedSlots(slots);
    };

    // Submit manual booking
    const handleSubmitBooking = async () => {
        setFormError("");
        setFormSuccess("");

        if (!formData.customer_name.trim()) { setFormError("اسم العميل مطلوب"); return; }
        if (!formData.customer_phone.trim()) { setFormError("رقم الهاتف مطلوب"); return; }
        if (!/^07\d{8}$/.test(formData.customer_phone)) { setFormError("رقم الهاتف يجب أن يكون 10 أرقام ويبدأ بـ 07"); return; }
        if (!formData.employee_id) { setFormError("يجب اختيار موظف"); return; }
        if (formData.service_ids.length === 0) { setFormError("يجب اختيار خدمة واحدة على الأقل"); return; }
        if (!formData.booking_time) { setFormError("يجب اختيار الوقت"); return; }

        setSaving(true);
        try {
            await bookingsAPI.createBooking({
                customer_name: formData.customer_name,
                customer_phone: formData.customer_phone,
                employee_id: parseInt(formData.employee_id),
                service_ids: formData.service_ids,
                booking_date: modalDate,
                booking_time: formData.booking_time,
                notes: formData.notes,
            });
            setFormSuccess("تم إنشاء الحجز بنجاح ✓");
            setTimeout(() => {
                setShowModal(false);
                fetchBookings();
            }, 1200);
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string }; status?: number } };
            if (error.response?.status === 405) {
                setFormError("خطأ في الاتصال بالسيرفر — يرجى التأكد من رفع التحديثات");
            } else {
                setFormError(error.response?.data?.message || "حدث خطأ أثناء إنشاء الحجز");
            }
        } finally {
            setSaving(false);
        }
    };

    const toggleService = (id: number) => {
        setFormData(prev => ({
            ...prev,
            service_ids: prev.service_ids.includes(id)
                ? prev.service_ids.filter(s => s !== id)
                : [...prev.service_ids, id]
        }));
    };

    // ── Open Edit Modal ──
    const openEditModal = (booking: CalendarBooking) => {
        setEditingBooking(booking);
        setEditForm({
            customer_name: booking.customer_name,
            customer_phone: booking.customer_phone,
            employee_id: booking.employee_id ? String(booking.employee_id) : "",
            booking_time: booking.time?.replace(/:00$/, "") || booking.time || "",
            notes: booking.notes || "",
        });
        setEditError("");
        setEditSuccess("");
        setShowEditModal(true);
    };

    // ── Submit Edit ──
    const handleEditSubmit = async () => {
        if (!editingBooking) return;
        setEditError("");
        setEditSuccess("");

        if (!editForm.customer_name.trim()) { setEditError("اسم العميل مطلوب"); return; }
        if (!editForm.customer_phone.trim()) { setEditError("رقم الهاتف مطلوب"); return; }

        setEditSaving(true);
        try {
            const bookingDate = editingBooking.booking_date || selectedDate || "";
            await bookingsAPI.updateBooking(editingBooking.id, {
                customer_name: editForm.customer_name,
                customer_phone: editForm.customer_phone,
                employee_id: editForm.employee_id ? parseInt(editForm.employee_id) : undefined,
                booking_time: editForm.booking_time,
                booking_date: bookingDate,
                notes: editForm.notes,
            });
            setEditSuccess("تم تعديل الحجز بنجاح ✓");
            setTimeout(() => {
                setShowEditModal(false);
                setEditingBooking(null);
                fetchBookings();
            }, 1000);
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            setEditError(error.response?.data?.message || "حدث خطأ أثناء التعديل");
        } finally {
            setEditSaving(false);
        }
    };

    // ── Delete Booking ──
    const handleDeleteBooking = async (id: number) => {
        setDeletingId(id);
        try {
            await bookingsAPI.delete(id);
            setDeleteConfirm(null);
            fetchBookings();
        } catch (err) {
            console.error(err);
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-accent-lime" />
                    <h3 className="font-bold text-sm" style={{ color: "var(--text-main)" }}>
                        {role === "employee" ? "مواعيدي المحجوزة" : "تقويم الحجوزات"}
                    </h3>
                    {total > 0 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: "var(--border-subtle)", color: "var(--color-accent)" }}>
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
                        style={{ color: "var(--color-accent)", border: "1px solid rgba(195,216,9,.2)" }}>
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
            <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-2">
                {dayNames.map(d => (
                    <div key={d} className="text-center text-[9px] sm:text-[10px] font-bold text-gray-500 py-1">{d}</div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-0.5 sm:gap-1 relative">
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/30 rounded-xl">
                        <div className="spinner" />
                    </div>
                )}
                {cells.map((day, i) => {
                    if (day === null) return <div key={`empty-${i}`} className="h-9 sm:h-12" />;
                    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const dayBookings = bookings[dateStr] || [];
                    const hasBookings = dayBookings.length > 0;
                    const isToday = dateStr === todayStr;
                    const isSelected = dateStr === selectedDate;
                    const isPast = dateStr < todayStr;

                    return (
                        <button
                            key={dateStr}
                            onClick={() => handleDateClick(dateStr)}
                            className={`relative h-9 sm:h-12 rounded-lg sm:rounded-xl text-[11px] sm:text-sm font-bold transition-all ${
                                isSelected
                                    ? "ring-2 ring-accent-lime bg-accent-lime/15 text-white scale-[1.03]"
                                    : isToday
                                    ? "bg-accent-lime/10 text-accent-lime border border-accent-lime/20"
                                    : hasBookings
                                    ? "bg-white/5 text-white hover:bg-white/10"
                                    : isPast
                                    ? "text-gray-700"
                                    : "text-gray-400 hover:bg-white/5"
                            }`}
                        >
                            {day}
                            {hasBookings && (
                                <div className="absolute bottom-0.5 sm:bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                                    {dayBookings.slice(0, 3).map((b, j) => (
                                        <div key={j} className="w-1 h-1 rounded-full" style={{
                                            background: b.status === "confirmed" ? "#C3D809" : "#2196F3"
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
            <div className="flex items-center justify-center gap-3 sm:gap-4 mt-3 text-[9px] sm:text-[10px] text-gray-500">
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#C3D809]" /> مؤكد</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#2196F3]" /> مكتمل</span>
            </div>

            {/* Selected Day Details */}
            <AnimatePresence>
                {selectedDate && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ type: "spring", damping: 22, stiffness: 280 }}
                        className="mt-5 overflow-hidden"
                    >
                        {/* Day Header Card */}
                        <div className="rounded-2xl overflow-hidden" style={{
                            background: "linear-gradient(135deg, var(--border-subtle) 0%, rgba(195,216,9,.02) 100%)",
                            border: "1px solid var(--border-subtle)",
                        }}>
                            <div className="flex items-center justify-between px-4 sm:px-5 py-3.5">
                                <div className="flex items-center gap-3">
                                    {/* Date badge */}
                                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0" style={{
                                        background: "rgba(195,216,9,.1)",
                                        border: "1px solid rgba(195,216,9,.15)",
                                    }}>
                                        <span className="text-[10px] text-accent-lime/60 font-bold leading-none">{dayNameFull(selectedDate).slice(0, 3)}</span>
                                        <span className="text-lg sm:text-xl font-black text-accent-lime leading-none mt-0.5">{selectedDate.split("-")[2]}</span>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-white">{dayNameFull(selectedDate)}</h4>
                                        <p className="text-[10px] sm:text-[11px] text-gray-500 mt-0.5">
                                            {monthNames[parseInt(selectedDate.split("-")[1]) - 1]} {selectedDate.split("-")[0]}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] sm:text-[11px] px-2.5 py-1 rounded-lg font-bold" style={{
                                        background: "rgba(195,216,9,.1)",
                                        color: "var(--color-accent)",
                                        border: "1px solid var(--border-subtle)",
                                    }}>
                                        {selectedBookings.length} حجز
                                    </span>
                                    {role === "admin" && selectedDate >= todayStr && (
                                        <button
                                            onClick={() => openBookingModal(selectedDate)}
                                            className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold px-3 py-2 rounded-xl transition-all hover:scale-105 active:scale-95"
                                            style={{
                                                background: "linear-gradient(135deg, #C3D809, #C3D809)",
                                                color: "#000",
                                            }}
                                        >
                                            <Plus size={13} strokeWidth={2.5} />
                                            <span className="hidden sm:inline">إضافة حجز</span>
                                        </button>
                                    )}
                                    <button onClick={() => setSelectedDate(null)} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all">
                                        <X size={15} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Bookings Cards */}
                        <div className="mt-3 space-y-2.5">
                            {selectedBookings.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="py-8 sm:py-10 text-center rounded-2xl"
                                    style={{ background: "rgba(255,255,255,.02)", border: "1px dashed rgba(255,255,255,.08)" }}
                                >
                                    <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: "rgba(195,216,9,.06)" }}>
                                        <Calendar size={20} className="text-accent-lime/40" />
                                    </div>
                                    <p className="text-gray-500 text-sm">لا توجد حجوزات لهذا اليوم</p>
                                    {role === "admin" && selectedDate >= todayStr && (
                                        <button
                                            onClick={() => openBookingModal(selectedDate)}
                                            className="mt-4 text-xs font-bold px-5 py-2.5 rounded-xl transition-all hover:scale-105"
                                            style={{
                                                background: "linear-gradient(135deg, rgba(195,216,9,.15), rgba(195,216,9,.07))",
                                                color: "var(--color-accent)",
                                                border: "1px solid rgba(195,216,9,.15)",
                                            }}
                                        >
                                            <Plus size={13} className="inline ml-1.5" strokeWidth={2.5} />
                                            إضافة حجز جديد
                                        </button>
                                    )}
                                </motion.div>
                            ) : (
                                selectedBookings.map((b, idx) => (
                                    <motion.div
                                        key={b.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="group relative rounded-2xl overflow-hidden transition-all hover:scale-[1.005]"
                                        style={{
                                            background: "rgba(255,255,255,.025)",
                                            border: "1px solid rgba(255,255,255,.06)",
                                        }}
                                    >
                                        {/* Gold accent strip */}
                                        <div className="absolute top-0 right-0 w-1 h-full rounded-l-full" style={{
                                            background: b.status === "confirmed"
                                                ? "linear-gradient(to bottom, #C3D809, #2E7D32)"
                                                : "linear-gradient(to bottom, #2196F3, #1565C0)",
                                        }} />

                                        <div className="p-3.5 sm:p-4 pr-5 sm:pr-6">
                                            <div className="flex items-start gap-3">
                                                {/* Time badge */}
                                                <div className="flex-shrink-0 w-14 sm:w-16 text-center">
                                                    <div className="px-2 py-1.5 rounded-lg" style={{
                                                        background: "var(--border-subtle)",
                                                        border: "1px solid rgba(195,216,9,.1)",
                                                    }}>
                                                        <Clock size={10} className="text-accent-lime/60 mx-auto mb-0.5" />
                                                        <span className="text-[11px] sm:text-xs font-bold text-accent-lime">{formatTime(b.time)}</span>
                                                    </div>
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <span className="text-sm font-bold text-white truncate">{b.customer_name}</span>
                                                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                                                            b.status === "confirmed"
                                                                ? "bg-emerald-500/10 text-emerald-400"
                                                                : "bg-blue-500/10 text-blue-400"
                                                        }`}>
                                                            {b.status === "confirmed" ? "مؤكد" : "مكتمل"}
                                                        </span>
                                                    </div>

                                                    {/* Services */}
                                                    <div className="flex items-center gap-1.5 mb-1.5">
                                                        <Scissors size={10} className="text-accent-lime/50 flex-shrink-0" />
                                                        <span className="text-[10px] sm:text-[11px] text-accent-lime/80 font-semibold truncate">{tData(b.services, "ar")}</span>
                                                    </div>

                                                    {/* Employee + Phone row */}
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        {b.employee_name && role === "admin" && (
                                                            <span className="flex items-center gap-1.5 text-[10px] text-gray-400">
                                                                <span className="w-5 h-5 rounded-md flex items-center justify-center text-[8px] font-bold" style={{
                                                                    background: "var(--border-subtle)",
                                                                    color: "var(--color-accent)",
                                                                    border: "1px solid rgba(195,216,9,.1)",
                                                                }}>
                                                                    {tData(b.employee_name, "ar").charAt(0).toUpperCase()}
                                                                </span>
                                                                {tData(b.employee_name, "ar")}
                                                            </span>
                                                        )}
                                                        <a href={`tel:${b.customer_phone}`} className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-accent-lime transition-colors">
                                                            <Phone size={9} />
                                                            <span dir="ltr">{b.customer_phone}</span>
                                                        </a>
                                                    </div>

                                                    {b.notes && (
                                                        <p className="text-[10px] text-gray-600 mt-1.5 flex items-start gap-1">
                                                            <FileText size={9} className="flex-shrink-0 mt-0.5" />
                                                            <span className="truncate">{b.notes}</span>
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Price + Actions */}
                                                <div className="flex-shrink-0 flex flex-col items-end gap-2">
                                                    <div className="px-2.5 py-1.5 rounded-lg" style={{
                                                        background: "rgba(195,216,9,.06)",
                                                    }}>
                                                        <p className="text-accent-lime font-black text-xs sm:text-sm">{b.price.toFixed(2)}</p>
                                                        <p className="text-[8px] text-accent-lime/50 text-center font-bold">د.أ</p>
                                                    </div>
                                                    {role === "admin" && (
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); openEditModal(b); }}
                                                                title="تعديل الحجز"
                                                                className="p-1.5 rounded-lg transition-all hover:scale-110"
                                                                style={{ background: "rgba(195,216,9,.1)", color: "var(--color-accent)", border: "1px solid rgba(195,216,9,.15)" }}
                                                            >
                                                                <Pencil size={11} />
                                                            </button>
                                                            {deleteConfirm === b.id ? (
                                                                <div className="flex items-center gap-1">
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); handleDeleteBooking(b.id); }}
                                                                        disabled={deletingId === b.id}
                                                                        className="px-2 py-1.5 rounded-lg text-[9px] font-bold transition-all"
                                                                        style={{ background: "rgba(231,76,60,.2)", color: "#e74c3c", border: "1px solid rgba(231,76,60,.3)" }}
                                                                    >
                                                                        {deletingId === b.id ? <Loader2 size={10} className="animate-spin" /> : "تأكيد"}
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); setDeleteConfirm(null); }}
                                                                        className="px-2 py-1.5 rounded-lg text-[9px] font-bold text-gray-500 hover:text-white transition-all"
                                                                        style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)" }}
                                                                    >
                                                                        إلغاء
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setDeleteConfirm(b.id); }}
                                                                    title="حذف الحجز"
                                                                    className="p-1.5 rounded-lg transition-all hover:scale-110"
                                                                    style={{ background: "rgba(231,76,60,.1)", color: "#e74c3c", border: "1px solid rgba(231,76,60,.15)" }}
                                                                >
                                                                    <Trash2 size={11} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══════ Manual Booking Modal ═══════ */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
                        onClick={() => !saving && setShowModal(false)}
                    >
                        {/* Backdrop */}
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, y: 50, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 50, scale: 0.95 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative w-full sm:w-[480px] sm:max-w-[90vw] max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl"
                            style={{ background: "#1E1E1E", border: "1px solid rgba(195,216,9,.15)" }}
                        >
                            {/* Modal Header */}
                            <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 rounded-t-3xl sm:rounded-t-2xl"
                                style={{ background: "#1E1E1E", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--border-subtle)" }}>
                                        <Plus size={16} color="var(--color-accent)" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sm text-white">إضافة حجز يدوي</h3>
                                        <p className="text-[10px] text-gray-500">{dayNameFull(modalDate)} — {modalDate}</p>
                                    </div>
                                </div>
                                <button onClick={() => !saving && setShowModal(false)} className="text-gray-500 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors">
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="px-5 py-4 space-y-4">
                                {/* Customer Name */}
                                <div>
                                    <label className="text-[11px] font-bold text-gray-400 mb-1.5 block">اسم العميل *</label>
                                    <input
                                        type="text"
                                        value={formData.customer_name}
                                        onChange={e => setFormData(p => ({ ...p, customer_name: e.target.value }))}
                                        placeholder="أدخل اسم العميل"
                                        className="w-full h-11 px-4 rounded-xl text-sm text-white placeholder:text-gray-600 outline-none transition-all focus:ring-1 focus:ring-accent-lime/40"
                                        style={{ background: "var(--color-surface)", border: "1px solid rgba(255,255,255,.08)" }}
                                        dir="rtl"
                                    />
                                </div>

                                {/* Customer Phone */}
                                <div>
                                    <label className="text-[11px] font-bold text-gray-400 mb-1.5 block">رقم الهاتف *</label>
                                    <input
                                        type="tel"
                                        inputMode="numeric"
                                        maxLength={10}
                                        value={formData.customer_phone}
                                        onChange={e => {
                                            const val = e.target.value.replace(/[^0-9]/g, "").slice(0, 10);
                                            setFormData(p => ({ ...p, customer_phone: val }));
                                        }}
                                        placeholder="07XXXXXXXX"
                                        className="w-full h-11 px-4 rounded-xl text-sm text-white placeholder:text-gray-600 outline-none transition-all focus:ring-1 focus:ring-accent-lime/40 text-right"
                                        style={{ background: "var(--color-surface)", border: "1px solid rgba(255,255,255,.08)", direction: "ltr", textAlign: "right" }}
                                    />
                                    <p className="text-[9px] text-gray-600 mt-1">يجب أن يبدأ بـ 07 ويتكون من 10 أرقام</p>
                                </div>

                                {/* Employee Selection */}
                                <div>
                                    <label className="text-[11px] font-bold text-gray-400 mb-1.5 block">الموظف *</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {employees.map(emp => (
                                            <button
                                                key={emp.id}
                                                onClick={() => {
                                                    setFormData(p => ({ ...p, employee_id: String(emp.id), booking_time: "" }));
                                                }}
                                                className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                                                    formData.employee_id === String(emp.id)
                                                        ? "ring-2 ring-accent-lime text-accent-lime scale-[1.02]"
                                                        : "text-gray-400 hover:text-white hover:bg-white/5"
                                                }`}
                                                style={{
                                                    background: formData.employee_id === String(emp.id) ? "var(--border-subtle)" : "var(--color-surface)",
                                                    border: `1px solid ${formData.employee_id === String(emp.id) ? "rgba(195,216,9,.3)" : "rgba(255,255,255,.06)"}`,
                                                }}
                                            >
                                                <User size={12} className="inline ml-1" />
                                                {tData(emp.name, "ar")}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Services Selection */}
                                <div>
                                    <label className="text-[11px] font-bold text-gray-400 mb-1.5 block">الخدمات * <span className="text-gray-600 font-normal">(اختر واحدة أو أكثر)</span></label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                                        {services.map(svc => (
                                            <button
                                                key={svc.id}
                                                onClick={() => toggleService(svc.id)}
                                                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                                                    formData.service_ids.includes(svc.id)
                                                        ? "text-accent-lime"
                                                        : "text-gray-400 hover:text-white"
                                                }`}
                                                style={{
                                                    background: formData.service_ids.includes(svc.id) ? "var(--border-subtle)" : "var(--color-surface)",
                                                    border: `1px solid ${formData.service_ids.includes(svc.id) ? "rgba(195,216,9,.3)" : "rgba(255,255,255,.06)"}`,
                                                }}
                                            >
                                                <span className="flex items-center gap-1.5">
                                                    {formData.service_ids.includes(svc.id) && <Check size={12} />}
                                                    <Scissors size={10} className="opacity-50" />
                                                    {tData(svc.name, "ar")}
                                                </span>
                                                <span className="text-[10px] text-gray-500">{Number(svc.price).toFixed(2)} د.أ</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Time Selection */}
                                <div>
                                    <label className="text-[11px] font-bold text-gray-400 mb-1.5 block">الوقت *</label>
                                    {!formData.employee_id ? (
                                        <p className="text-xs text-gray-600 py-2">اختر موظف أولاً لعرض الأوقات المتاحة</p>
                                    ) : (
                                        <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 max-h-36 overflow-y-auto">
                                            {generateTimeSlots().map(time => {
                                                const empId = parseInt(formData.employee_id);
                                                const booked = isSlotBooked(time, empId);
                                                const selected = formData.booking_time === time;

                                                return (
                                                    <button
                                                        key={time}
                                                        disabled={booked}
                                                        onClick={() => setFormData(p => ({ ...p, booking_time: time }))}
                                                        className={`py-2 rounded-lg text-[11px] sm:text-xs font-bold transition-all ${
                                                            booked
                                                                ? "opacity-30 cursor-not-allowed line-through text-gray-600"
                                                                : selected
                                                                ? "ring-2 ring-accent-lime text-accent-lime scale-[1.03]"
                                                                : "text-gray-400 hover:text-white hover:bg-white/5"
                                                        }`}
                                                        style={{
                                                            background: selected ? "var(--border-subtle)" : booked ? "var(--color-background)" : "var(--color-surface)",
                                                            border: `1px solid ${selected ? "rgba(195,216,9,.3)" : "rgba(255,255,255,.04)"}`,
                                                        }}
                                                    >
                                                        {formatTime(time)}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="text-[11px] font-bold text-gray-400 mb-1.5 block">ملاحظات <span className="text-gray-600 font-normal">(اختياري)</span></label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
                                        rows={2}
                                        placeholder="أي ملاحظات إضافية..."
                                        className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-gray-600 outline-none resize-none transition-all focus:ring-1 focus:ring-accent-lime/40"
                                        style={{ background: "var(--color-surface)", border: "1px solid rgba(255,255,255,.08)" }}
                                        dir="rtl"
                                    />
                                </div>

                                {/* Total Price */}
                                {formData.service_ids.length > 0 && (
                                    <div className="flex items-center justify-between px-3 py-2 rounded-xl" style={{ background: "rgba(195,216,9,.06)", border: "1px solid rgba(195,216,9,.1)" }}>
                                        <span className="text-xs text-gray-400">المبلغ الإجمالي</span>
                                        <span className="text-sm font-bold text-accent-lime">
                                            {services.filter(s => formData.service_ids.includes(s.id)).reduce((sum, s) => sum + Number(s.price), 0).toFixed(2)} د.أ
                                        </span>
                                    </div>
                                )}

                                {/* Error / Success */}
                                {formError && (
                                    <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 px-3 py-2.5 rounded-xl border border-red-500/20">
                                        <AlertCircle size={14} />
                                        {formError}
                                    </div>
                                )}
                                {formSuccess && (
                                    <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-2.5 rounded-xl border border-emerald-500/20">
                                        <Check size={14} />
                                        {formSuccess}
                                    </div>
                                )}

                                {/* Submit Button */}
                                <button
                                    onClick={handleSubmitBooking}
                                    disabled={saving}
                                    className="w-full h-12 rounded-xl font-bold text-sm transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    style={{
                                        background: "linear-gradient(135deg, #C3D809, #C3D809)",
                                        color: "#000",
                                    }}
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            جاري الحفظ...
                                        </>
                                    ) : (
                                        <>
                                            <Check size={16} />
                                            تأكيد الحجز
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══════ Edit Booking Modal ═══════ */}
            <AnimatePresence>
                {showEditModal && editingBooking && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
                        onClick={() => !editSaving && setShowEditModal(false)}
                    >
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

                        <motion.div
                            initial={{ opacity: 0, y: 50, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 50, scale: 0.95 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative w-full sm:w-[480px] sm:max-w-[90vw] max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl"
                            style={{ background: "#1E1E1E", border: "1px solid rgba(195,216,9,.15)" }}
                        >
                            {/* Header */}
                            <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 rounded-t-3xl sm:rounded-t-2xl"
                                style={{ background: "#1E1E1E", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--border-subtle)" }}>
                                        <Pencil size={14} color="var(--color-accent)" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sm text-white">تعديل الحجز</h3>
                                        <p className="text-[10px] text-gray-500">{editingBooking.customer_name} — {formatTime(editingBooking.time)}</p>
                                    </div>
                                </div>
                                <button onClick={() => !editSaving && setShowEditModal(false)} className="text-gray-500 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors">
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="px-5 py-4 space-y-4">
                                {/* Customer Name */}
                                <div>
                                    <label className="text-[11px] font-bold text-gray-400 mb-1.5 block">اسم العميل *</label>
                                    <input
                                        type="text"
                                        value={editForm.customer_name}
                                        onChange={e => setEditForm(p => ({ ...p, customer_name: e.target.value }))}
                                        className="w-full h-11 px-4 rounded-xl text-sm text-white placeholder:text-gray-600 outline-none transition-all focus:ring-1 focus:ring-accent-lime/40"
                                        style={{ background: "var(--color-surface)", border: "1px solid rgba(255,255,255,.08)" }}
                                        dir="rtl"
                                    />
                                </div>

                                {/* Customer Phone */}
                                <div>
                                    <label className="text-[11px] font-bold text-gray-400 mb-1.5 block">رقم الهاتف *</label>
                                    <input
                                        type="tel"
                                        inputMode="numeric"
                                        maxLength={10}
                                        value={editForm.customer_phone}
                                        onChange={e => {
                                            const val = e.target.value.replace(/[^0-9]/g, "").slice(0, 10);
                                            setEditForm(p => ({ ...p, customer_phone: val }));
                                        }}
                                        className="w-full h-11 px-4 rounded-xl text-sm text-white placeholder:text-gray-600 outline-none transition-all focus:ring-1 focus:ring-accent-lime/40"
                                        style={{ background: "var(--color-surface)", border: "1px solid rgba(255,255,255,.08)", direction: "rtl" }}
                                    />
                                </div>

                                {/* Employee Selection */}
                                <div>
                                    <label className="text-[11px] font-bold text-gray-400 mb-1.5 block">الموظف</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {employees.map(emp => (
                                            <button
                                                key={emp.id}
                                                onClick={() => setEditForm(p => ({ ...p, employee_id: String(emp.id) }))}
                                                className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                                                    editForm.employee_id === String(emp.id)
                                                        ? "ring-2 ring-accent-lime text-accent-lime scale-[1.02]"
                                                        : "text-gray-400 hover:text-white hover:bg-white/5"
                                                }`}
                                                style={{
                                                    background: editForm.employee_id === String(emp.id) ? "var(--border-subtle)" : "var(--color-surface)",
                                                    border: `1px solid ${editForm.employee_id === String(emp.id) ? "rgba(195,216,9,.3)" : "rgba(255,255,255,.06)"}`,
                                                }}
                                            >
                                                <User size={12} className="inline ml-1" />
                                                {emp.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Time Selection */}
                                <div>
                                    <label className="text-[11px] font-bold text-gray-400 mb-1.5 block">الوقت</label>
                                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 max-h-36 overflow-y-auto">
                                        {generateTimeSlots().map(time => {
                                            const selected = editForm.booking_time === time;
                                            return (
                                                <button
                                                    key={time}
                                                    onClick={() => setEditForm(p => ({ ...p, booking_time: time }))}
                                                    className={`py-2 rounded-lg text-[11px] sm:text-xs font-bold transition-all ${
                                                        selected
                                                            ? "ring-2 ring-accent-lime text-accent-lime scale-[1.03]"
                                                            : "text-gray-400 hover:text-white hover:bg-white/5"
                                                    }`}
                                                    style={{
                                                        background: selected ? "var(--border-subtle)" : "var(--color-surface)",
                                                        border: `1px solid ${selected ? "rgba(195,216,9,.3)" : "rgba(255,255,255,.04)"}`,
                                                    }}
                                                >
                                                    {formatTime(time)}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="text-[11px] font-bold text-gray-400 mb-1.5 block">ملاحظات</label>
                                    <textarea
                                        value={editForm.notes}
                                        onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))}
                                        rows={2}
                                        className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-gray-600 outline-none resize-none transition-all focus:ring-1 focus:ring-accent-lime/40"
                                        style={{ background: "var(--color-surface)", border: "1px solid rgba(255,255,255,.08)" }}
                                        dir="rtl"
                                    />
                                </div>

                                {/* Error / Success */}
                                {editError && (
                                    <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 px-3 py-2.5 rounded-xl border border-red-500/20">
                                        <AlertCircle size={14} />
                                        {editError}
                                    </div>
                                )}
                                {editSuccess && (
                                    <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-2.5 rounded-xl border border-emerald-500/20">
                                        <Check size={14} />
                                        {editSuccess}
                                    </div>
                                )}

                                {/* Submit */}
                                <button
                                    onClick={handleEditSubmit}
                                    disabled={editSaving}
                                    className="w-full h-12 rounded-xl font-bold text-sm transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    style={{
                                        background: "linear-gradient(135deg, #C3D809, #C3D809)",
                                        color: "#000",
                                    }}
                                >
                                    {editSaving ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            جاري الحفظ...
                                        </>
                                    ) : (
                                        <>
                                            <Check size={16} />
                                            حفظ التعديلات
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
