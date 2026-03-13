"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL || "";

interface Service { id: number; name: string; price: string; duration_minutes: number | null; image: string | null; }
interface Employee { id: number; name: string; }
interface SalonInfo {
    name: string; slug: string; logo: string | null; phone: string | null;
    description: string; address: string; instagram: string; booking_message: string;
    hero_image: string | null;
}

/* ======= HELPERS ======= */
const dayNames = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
const fmt12 = (t: string) => { const [h, m] = t.split(":").map(Number); return `${h > 12 ? h - 12 : h === 0 ? 12 : h}:${String(m).padStart(2, "0")} ${h >= 12 ? "م" : "ص"}`; };

/* ======= ICONS (SVG components) ======= */
const IconScissors = () => (<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><line x1="20" y1="4" x2="8.12" y2="15.88" /><line x1="14.47" y1="14.48" x2="20" y2="20" /><line x1="8.12" y1="8.12" x2="12" y2="12" /></svg>);
const IconUser = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>);
const IconCalendar = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>);
const IconCheck = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m9 12 2 2 4-4" /><circle cx="12" cy="12" r="10" /></svg>);
const IconPhone = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>);
const IconInstagram = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect width="20" height="20" x="2" y="2" rx="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>);
const IconMap = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>);

function BookingContent() {
    const searchParams = useSearchParams();
    const slug = searchParams.get("s") || searchParams.get("salon") || "";

    const [salon, setSalon] = useState<SalonInfo | null>(null);
    const [services, setServices] = useState<Service[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [workHours, setWorkHours] = useState({ start: "09:00", end: "22:00", interval: 30 });
    const [offDays, setOffDays] = useState<number[]>([]);
    const [step, setStep] = useState(0);
    const [sel, setSel] = useState({ service_id: 0, employee_id: 0, booking_date: "", booking_time: "", customer_name: "", customer_phone: "", notes: "" });
    const [bookedSlots, setBookedSlots] = useState<{ booking_time: string; employee_id: number }[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [notFound, setNotFound] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        if (!slug) { setNotFound(true); return; }
        (async () => {
            try {
                const res = await axios.get(`${API}/booking/salon.php?slug=${slug}`);
                const d = res.data.data;
                setSalon(d.salon); setServices(d.services || []); setEmployees(d.employees || []);
                setWorkHours(d.work_hours || { start: "09:00", end: "22:00", interval: 30 });
                setOffDays(d.off_days || []); setStep(1);
            } catch { setNotFound(true); }
        })();
    }, [slug]);

    useEffect(() => {
        const h = () => setScrolled(window.scrollY > 60);
        window.addEventListener("scroll", h, { passive: true }); return () => window.removeEventListener("scroll", h);
    }, []);

    const loadBooked = async (date: string) => {
        try { const r = await axios.get(`${API}/booking/book.php?slug=${slug}&date=${date}`); setBookedSlots(r.data.data.booked_slots || []); } catch { }
    };

    const handleSubmit = async () => {
        setError(""); setSubmitting(true);
        try { await axios.post(`${API}/booking/book.php`, { ...sel, salon_slug: slug }); setStep(6); }
        catch (e: unknown) { setError((e as { response?: { data?: { message?: string } } }).response?.data?.message || "حدث خطأ"); }
        finally { setSubmitting(false); }
    };

    const timeSlots: string[] = [];
    const [sH, sM] = workHours.start.split(":").map(Number);
    const [eH, eM] = workHours.end.split(":").map(Number);
    for (let m = sH * 60 + (sM || 0); m < eH * 60 + (eM || 0); m += workHours.interval)
        timeSlots.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);

    const isBooked = (t: string) => bookedSlots.some(s => s.booking_time.startsWith(t) && (!sel.employee_id || s.employee_id === sel.employee_id));
    const selService = services.find(s => s.id === sel.service_id);
    const selEmployee = employees.find(e => e.id === sel.employee_id);

    const dates: string[] = [];
    for (let i = 0; i < 21 && dates.length < 14; i++) {
        const d = new Date(); d.setDate(d.getDate() + i);
        if (!offDays.includes(d.getDay())) dates.push(d.toISOString().split("T")[0]);
    }

    /* ---- STYLES ---- */
    const gold = "#c8a96e";

    if (notFound) return (
        <div className="min-h-screen flex items-center justify-center" dir="rtl" style={{ background: "#000", fontFamily: "'Tajawal',sans-serif" }}>
            <div className="text-center"><p className="text-8xl mb-6" style={{ fontFamily: "'Playfair Display',serif" }}>404</p><p className="text-gray-500 text-lg">الصالون غير موجود</p></div>
        </div>
    );

    if (step === 0) return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: "#000" }}>
            <div className="w-12 h-12 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${gold} transparent ${gold} ${gold}` }} />
        </div>
    );

    return (
        <>
            {/* Google Fonts */}
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Tajawal:wght@300;400;500;700;800;900&display=swap');
                * { box-sizing: border-box; }
                body { margin: 0; overflow-x: hidden; }
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: #000; }
                ::-webkit-scrollbar-thumb { background: ${gold}40; border-radius: 3px; }
                ::selection { background: ${gold}30; }
            `}</style>

            <div className="min-h-screen" dir="rtl" style={{ background: "#000", fontFamily: "'Tajawal',sans-serif", color: "#fff" }}>

                {/* ═══════════ STICKY HEADER ═══════════ */}
                <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-500" style={{
                    background: scrolled ? "rgba(0,0,0,.85)" : "transparent",
                    backdropFilter: scrolled ? "blur(20px) saturate(180%)" : "none",
                }}>
                    {/* Separator — opacity avoids color interpolation flash */}
                    <div className="absolute bottom-0 inset-x-0 h-px pointer-events-none transition-opacity duration-500"
                        style={{ background: "rgba(255,255,255,0.06)", opacity: scrolled ? 1 : 0 }} />
                    <div className="max-w-6xl mx-auto px-6 md:px-10 h-16 md:h-20 flex items-center justify-between">
                        <button onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); if (step > 1) setStep(1); }} className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden" style={{ background: `${gold}15`, border: `1px solid ${gold}20` }}>
                                {salon?.logo ? (
                                    <img src={salon.logo} alt={salon.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; e.currentTarget.parentElement!.innerHTML = `<span style="color:${gold};font-family:'Playfair Display',serif;font-weight:900">${salon?.name?.charAt(0) || ""}</span>`; }} />
                                ) : (
                                    <span className="text-base font-black" style={{ color: gold, fontFamily: "'Playfair Display',serif" }}>{salon?.name?.charAt(0)}</span>
                                )}
                            </div>
                            <span className="text-xs font-bold tracking-[.2em] uppercase text-white/80">{salon?.name}</span>
                        </button>
                        <div className="flex items-center gap-3">
                            {salon?.instagram && (
                                <a href={`https://instagram.com/${salon.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer"
                                    className="w-9 h-9 rounded-full flex items-center justify-center text-white/40 hover:text-white transition-colors"><IconInstagram /></a>
                            )}
                            {salon?.phone && (
                                <a href={`tel:${salon.phone}`}
                                    className="w-9 h-9 rounded-full flex items-center justify-center text-white/40 hover:text-white transition-colors"><IconPhone /></a>
                            )}
                            <button onClick={() => { setStep(2); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                                className="hidden sm:flex h-9 px-5 rounded-full items-center text-xs font-bold tracking-wider uppercase transition-all hover:scale-105"
                                style={{ background: gold, color: "#000" }}>احجز الآن</button>
                        </div>
                    </div>
                </header>

                {/* ═══════════ HERO — FULL VIEWPORT ═══════════ */}
                <AnimatePresence>
                    {step === 1 && (
                        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }}
                            className="relative min-h-[85vh] md:min-h-screen flex items-center justify-center overflow-hidden pt-16 md:pt-20">

                            {/* Background — Image or Gradient */}
                            {salon?.hero_image ? (
                                <>
                                    <div className="absolute inset-0">
                                        <img src={salon.hero_image} alt="" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="absolute inset-0" style={{
                                        background: `linear-gradient(180deg, rgba(0,0,0,.7) 0%, rgba(0,0,0,.4) 40%, rgba(0,0,0,.8) 100%)`
                                    }} />
                                </>
                            ) : (
                                <>
                                    <div className="absolute inset-0" style={{
                                        background: `
                                            radial-gradient(ellipse 100% 80% at 50% 20%, ${gold}08 0%, transparent 50%),
                                            radial-gradient(ellipse 60% 50% at 80% 60%, ${gold}05 0%, transparent 50%),
                                            radial-gradient(ellipse 50% 40% at 20% 80%, ${gold}04 0%, transparent 50%),
                                            linear-gradient(180deg, #000 0%, #080604 50%, #000 100%)
                                        `
                                    }} />
                                    <div className="absolute inset-0 opacity-[.03]" style={{
                                        backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 80px, rgba(255,255,255,.5) 80px, rgba(255,255,255,.5) 81px)`,
                                    }} />
                                </>
                            )}

                            {/* Content */}
                            <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
                                <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2, duration: 0.8 }}>
                                    <p className="text-xs md:text-sm tracking-[.35em] uppercase mb-6 md:mb-8" style={{ color: gold }}>
                                        — مرحباً بك في —
                                    </p>
                                </motion.div>

                                <motion.h1 initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4, duration: 0.8 }}
                                    className="text-5xl sm:text-6xl md:text-8xl lg:text-9xl font-black leading-[0.9] mb-6 md:mb-8"
                                    style={{ fontFamily: "'Playfair Display', serif", letterSpacing: "-0.02em" }}>
                                    {salon?.name}
                                </motion.h1>

                                {salon?.description && (
                                    <motion.p initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6, duration: 0.8 }}
                                        className="text-base md:text-lg text-white/40 max-w-lg mx-auto leading-relaxed mb-8 md:mb-12">
                                        {salon.description}
                                    </motion.p>
                                )}

                                <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.8, duration: 0.8 }}
                                    className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                    <button onClick={() => { setStep(2); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                                        className="h-14 px-10 rounded-full text-sm font-bold tracking-[.15em] uppercase transition-all hover:scale-105 hover:shadow-lg"
                                        style={{ background: gold, color: "#000", boxShadow: `0 20px 60px ${gold}20` }}>
                                        احجز موعدك الآن
                                    </button>
                                    {salon?.phone && (
                                        <a href={`https://wa.me/${salon.phone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer"
                                            className="h-14 px-8 rounded-full text-sm font-bold tracking-wider flex items-center gap-2 transition-all hover:scale-105"
                                            style={{ border: `1px solid rgba(255,255,255,.15)`, color: "#fff" }}>
                                            <span>تواصل معنا</span>
                                        </a>
                                    )}
                                </motion.div>

                                {/* Info badges */}
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 0.8 }}
                                    className="mt-12 md:mt-16 flex items-center justify-center gap-6 md:gap-10 text-xs text-white/30">
                                    {salon?.address && <span className="flex items-center gap-1.5"><IconMap /> {salon.address}</span>}
                                    <span className="flex items-center gap-1.5">🕐 {fmt12(workHours.start)} — {fmt12(workHours.end)}</span>
                                </motion.div>
                            </div>

                            {/* Scroll indicator */}
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
                                className="absolute bottom-8 left-1/2 -translate-x-1/2">
                                <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2 }}
                                    className="w-5 h-8 rounded-full border border-white/10 flex items-start justify-center pt-1.5">
                                    <div className="w-1 h-1.5 rounded-full bg-white/30" />
                                </motion.div>
                            </motion.div>
                        </motion.section>
                    )}
                </AnimatePresence>

                {/* ═══════════ ABOUT SALON SECTION ═══════════ */}
                {step === 1 && (
                    <section style={{ background: "linear-gradient(180deg, #000 0%, #060606 50%, #000 100%)" }}>
                        <div className="text-center py-16 md:py-20" style={{ borderTop: "1px solid rgba(255,255,255,.04)" }}>
                            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
                                <div className="flex items-center justify-center gap-4 mb-5">
                                    <div className="h-px w-16" style={{ background: `linear-gradient(90deg, transparent, ${gold}40)` }} />
                                    <p className="text-xs tracking-[.4em] uppercase font-semibold" style={{ color: gold }}>من نحن</p>
                                    <div className="h-px w-16" style={{ background: `linear-gradient(270deg, transparent, ${gold}40)` }} />
                                </div>
                                <h2 className="text-4xl md:text-6xl font-black" style={{ fontFamily: "'Playfair Display',serif" }}>تعرّف علينا</h2>
                            </motion.div>
                        </div>

                        <div className="max-w-6xl mx-auto px-6 md:px-10 pb-16 md:pb-24">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                                {/* ─── About Card ─── */}
                                <motion.div
                                    initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }} transition={{ duration: 0.7 }}
                                    className="relative rounded-3xl overflow-hidden"
                                    style={{ background: "linear-gradient(145deg, #111, #0a0a0a)", border: "1px solid rgba(255,255,255,.06)" }}
                                >
                                    {/* Decorative gold glow top-right */}
                                    <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full pointer-events-none"
                                        style={{ background: `radial-gradient(circle, ${gold}18 0%, transparent 70%)` }} />

                                    <div className="relative p-8 md:p-10">
                                        {/* Salon Header */}
                                        <div className="flex items-center gap-3 mb-8">
                                            {/* Salon logo or fallback icon */}
                                            {salon?.logo ? (
                                                <img
                                                    src={salon.logo.startsWith("http") ? salon.logo : `/${salon.logo}`}
                                                    alt={salon.name}
                                                    className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                                                    style={{ border: "1.5px solid rgba(200,169,110,.3)" }}
                                                />
                                            ) : (
                                                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-xl font-black"
                                                    style={{ background: "linear-gradient(135deg, #c8a96e, #e8c96a)", color: "#0a0a0a", boxShadow: "0 6px 24px rgba(200,169,110,.35)" }}>
                                                    {salon?.name?.charAt(0) || "S"}
                                                </div>
                                            )}
                                            <div className="flex flex-col">
                                                <span className="text-xl font-black leading-tight text-white">
                                                    {salon?.name || "الصالون"}
                                                </span>
                                                <span className="text-[10px] font-semibold tracking-[.2em] mt-0.5" style={{ color: "rgba(255,255,255,.3)" }}>BARBER SHOP</span>
                                            </div>
                                        </div>

                                        {/* Description */}
                                        {salon?.description && (
                                            <p className="text-sm leading-[2] text-white/50 mb-8">{salon.description}</p>
                                        )}

                                        {/* Divider */}
                                        <div className="h-px mb-8" style={{ background: "linear-gradient(90deg, transparent, rgba(200,169,110,.2), transparent)" }} />

                                        {/* Info Grid */}
                                        <div className="grid grid-cols-2 gap-5">
                                            {/* Working Hours */}
                                            <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,.025)", border: "1px solid rgba(255,255,255,.05)" }}>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={gold} strokeWidth="2">
                                                        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                                                    </svg>
                                                    <p className="text-[9px] text-white/25 uppercase tracking-[.2em]">ساعات العمل</p>
                                                </div>
                                                <p className="text-sm font-bold text-white/80">{fmt12(workHours.start)} — {fmt12(workHours.end)}</p>
                                            </div>

                                            {/* Location */}
                                            {salon?.address && (
                                                <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,.025)", border: "1px solid rgba(255,255,255,.05)" }}>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={gold} strokeWidth="1.8">
                                                            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" />
                                                        </svg>
                                                        <p className="text-[9px] text-white/25 uppercase tracking-[.2em]">الموقع</p>
                                                    </div>
                                                    <p className="text-sm font-bold text-white/80">{salon.address}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>

                                {/* ─── Stats Column ─── */}
                                <motion.div
                                    initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.15 }}
                                    className="flex flex-col gap-4"
                                >
                                    {/* Stat — Services */}
                                    <div className="relative rounded-3xl p-6 overflow-hidden flex-1"
                                        style={{ background: "linear-gradient(145deg, #111, #0a0a0a)", border: "1px solid rgba(255,255,255,.06)" }}>
                                        <div className="absolute -bottom-8 -right-8 w-36 h-36 rounded-full pointer-events-none"
                                            style={{ background: `radial-gradient(circle, ${gold}15 0%, transparent 70%)` }} />
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-[10px] text-white/25 uppercase tracking-[.25em] mb-2">الخدمات المتاحة</p>
                                                <p className="text-5xl font-black leading-none" style={{ color: gold, fontFamily: "'Playfair Display',serif" }}>
                                                    {services.length}
                                                </p>
                                                <p className="text-xs text-white/30 mt-2">خدمة احترافية</p>
                                            </div>
                                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                                                style={{ background: `${gold}12`, border: `1px solid ${gold}20` }}>
                                                <IconScissors />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stat — Barbers */}
                                    <div className="relative rounded-3xl p-6 overflow-hidden flex-1"
                                        style={{ background: "linear-gradient(145deg, #111, #0a0a0a)", border: "1px solid rgba(255,255,255,.06)" }}>
                                        <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full pointer-events-none"
                                            style={{ background: `radial-gradient(circle, ${gold}15 0%, transparent 70%)` }} />
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-[10px] text-white/25 uppercase tracking-[.25em] mb-2">الحلاقون</p>
                                                <p className="text-5xl font-black leading-none" style={{ color: gold, fontFamily: "'Playfair Display',serif" }}>
                                                    {employees.length}
                                                </p>
                                                <p className="text-xs text-white/30 mt-2">حلاق محترف</p>
                                            </div>
                                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                                                style={{ background: `${gold}12`, border: `1px solid ${gold}20` }}>
                                                <IconUser />
                                            </div>
                                        </div>
                                    </div>

                                    {/* WhatsApp CTA */}
                                    {salon?.phone && (
                                        <a href={`https://wa.me/${salon.phone.replace(/[^0-9]/g, "")}`}
                                            target="_blank" rel="noopener noreferrer"
                                            className="group relative rounded-3xl p-6 flex items-center gap-4 overflow-hidden transition-all duration-300 hover:scale-[1.02]"
                                            style={{ background: "linear-gradient(145deg, rgba(37,211,102,.08), rgba(37,211,102,.04))", border: "1px solid rgba(37,211,102,.2)" }}>
                                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                                style={{ background: "linear-gradient(135deg, rgba(37,211,102,.12), transparent)" }} />
                                            <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                                                style={{ background: "rgba(37,211,102,.15)", border: "1px solid rgba(37,211,102,.3)" }}>
                                                <svg width="22" height="22" viewBox="0 0 24 24" fill="#25D366">
                                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                                                    <path d="M11.992 0C5.374 0 0 5.373 0 11.99c0 2.117.554 4.099 1.522 5.819L.057 24l6.304-1.654A11.945 11.945 0 0011.992 24c6.618 0 11.992-5.373 11.992-11.99C23.984 5.373 18.61 0 11.992 0z" />
                                                </svg>
                                            </div>
                                            <div className="relative flex-1">
                                                <p className="text-[10px] text-white/25 uppercase tracking-[.2em] mb-0.5">تواصل معنا عبر</p>
                                                <p className="text-lg font-black" style={{ color: "#25D366" }}>واتساب</p>
                                                <p className="text-sm font-bold text-white/40" dir="ltr">{salon.phone}</p>
                                            </div>
                                            <svg className="relative opacity-30 group-hover:opacity-60 transition-opacity flex-shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                                <path d="M19 12H5M12 19l-7-7 7-7" />
                                            </svg>
                                        </a>
                                    )}
                                </motion.div>

                            </div>
                        </div>
                    </section>
                )}

                {/* ═══════════ SERVICES SHOWCASE (Display Only) ═══════════ */}
                {step === 1 && (
                    <section style={{ background: "linear-gradient(180deg, #000 0%, #050505 50%, #000 100%)" }}>
                        <div className="text-center py-16 md:py-20" style={{ borderTop: "1px solid rgba(255,255,255,.04)" }}>
                            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
                                <div className="flex items-center justify-center gap-4 mb-5">
                                    <div className="h-px w-16" style={{ background: `linear-gradient(90deg, transparent, ${gold}40)` }} />
                                    <p className="text-xs tracking-[.4em] uppercase font-semibold" style={{ color: gold }}>خدماتنا</p>
                                    <div className="h-px w-16" style={{ background: `linear-gradient(270deg, transparent, ${gold}40)` }} />
                                </div>
                                <h2 className="text-4xl md:text-6xl font-black" style={{ fontFamily: "'Playfair Display',serif" }}>ما نقدمه لك</h2>
                                <p className="text-sm text-white/25 mt-4 max-w-md mx-auto">مجموعة من الخدمات المميزة لتجربة حلاقة لا تُنسى</p>
                            </motion.div>
                        </div>

                        {/* Services Grid — Premium Showcase */}
                        <div className="max-w-6xl mx-auto px-6 md:px-10 pb-20 md:pb-32">
                            {(() => {
                                const fallbackImages: Record<string, string> = {
                                    'حلاقة': '/services/haircut.png',
                                    'قص شعر فاشن': '/services/haircut.png',
                                    'حلاقة أطفال': '/services/haircut.png',
                                    'تشذيب لحية': '/services/beard.png',
                                    'حلاقة + لحية': '/services/beard.png',
                                    'تنظيف بشرة': '/services/facial.png',
                                    'صبغة شعر': '/services/coloring.png',
                                };
                                const defaultImg = '/services/haircut.png';
                                return (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {services.map((s, i) => (
                                            <motion.div key={s.id}
                                                initial={{ opacity: 0, y: 50 }}
                                                whileInView={{ opacity: 1, y: 0 }}
                                                viewport={{ once: true, margin: "-50px" }}
                                                transition={{ delay: i * 0.1, duration: 0.6, ease: "easeOut" }}
                                                className="group relative rounded-3xl overflow-hidden cursor-default"
                                                style={{ background: "#0a0a0a" }}>
                                                {/* Image */}
                                                <div className="relative h-52 md:h-60 overflow-hidden">
                                                    <img
                                                        src={s.image || fallbackImages[s.name] || defaultImg}
                                                        alt={s.name}
                                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
                                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                                        style={{ background: `linear-gradient(135deg, ${gold}15, transparent)` }} />
                                                    {/* Price badge */}
                                                    <div className="absolute top-4 left-4 px-4 py-2 rounded-full backdrop-blur-md text-sm font-black"
                                                        style={{ background: "rgba(0,0,0,.6)", color: gold, border: `1px solid ${gold}20` }}>
                                                        {Number(s.price).toFixed(2)} <span className="text-[9px] text-white/30">د.أ</span>
                                                    </div>
                                                </div>
                                                {/* Content */}
                                                <div className="p-6 relative">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                                                            style={{ background: `${gold}10`, color: gold }}>
                                                            <IconScissors />
                                                        </div>
                                                        <h3 className="text-lg font-bold text-white group-hover:text-[#c8a96e] transition-colors duration-300">
                                                            {s.name}
                                                        </h3>
                                                    </div>
                                                    {s.duration_minutes && (
                                                        <p className="text-xs text-white/20 flex items-center gap-1.5 mr-12">
                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                                            {s.duration_minutes} دقيقة
                                                        </p>
                                                    )}
                                                    {/* Bottom accent */}
                                                    <div className="absolute bottom-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                                        style={{ background: `linear-gradient(90deg, transparent, ${gold}, transparent)` }} />
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                );
                            })()}

                            {/* CTA after showcase */}
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6 }}
                                className="text-center mt-16 md:mt-20">
                                <button onClick={() => { setStep(2); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                                    className="h-16 px-12 rounded-full text-base font-bold tracking-[.15em] uppercase transition-all hover:scale-105 hover:shadow-lg group"
                                    style={{ background: gold, color: "#000", boxShadow: `0 20px 60px ${gold}25` }}>
                                    <span className="flex items-center gap-3">
                                        احجز موعدك الآن
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="group-hover:-translate-x-1 transition-transform"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                                    </span>
                                </button>
                                <p className="text-xs text-white/15 mt-4">اختر خدمتك وحدد موعدك في دقائق</p>
                            </motion.div>
                        </div>
                    </section>
                )}

                {/* ═══════════ BOOKING SECTION ═══════════ */}
                <section id="booking-section" style={{ background: "transparent" }}>

                    {/* Progress bar (steps 2-5) */}
                    {step > 1 && step < 6 && (
                        <div className="pt-24 pb-6" style={{ borderBottom: "1px solid rgba(255,255,255,.04)" }}>
                            <div className="max-w-3xl mx-auto px-6">
                                <div className="flex items-center">
                                    {["الخدمة", "الحلاق", "الموعد", "البيانات"].map((l, i) => {
                                        const stepNum = i + 2;
                                        return (
                                            <div key={i} className="flex items-center flex-1">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold transition-all duration-500"
                                                        style={{ background: step >= stepNum ? gold : "transparent", color: step >= stepNum ? "#000" : "#444", border: step < stepNum ? "1px solid #222" : "none", boxShadow: step === stepNum ? `0 0 25px ${gold}30` : "none" }}>
                                                        {step > stepNum ? "✓" : i + 1}
                                                    </div>
                                                    <span className={`text-xs font-semibold hidden sm:block ${step >= stepNum ? "text-white" : "text-gray-700"}`}>{l}</span>
                                                </div>
                                                {i < 3 && <div className="flex-1 h-px mx-3" style={{ background: step > stepNum ? gold : "#1a1a1a" }} />}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Content area */}
                    <div className={`max-w-5xl mx-auto px-6 md:px-10 py-12 md:py-20`}>
                        <AnimatePresence mode="wait">

                            {/* S2: Services (first booking step) */}
                            {step === 2 && (
                                <motion.div key="s2" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }}>
                                    <div className="text-center mb-10 md:mb-14">
                                        <div className="flex items-center justify-center gap-4 mb-4">
                                            <div className="h-px w-10" style={{ background: `linear-gradient(90deg, transparent, ${gold}40)` }} />
                                            <p className="text-xs tracking-[.35em] uppercase font-semibold" style={{ color: gold }}>الخطوة الأولى</p>
                                            <div className="h-px w-10" style={{ background: `linear-gradient(270deg, transparent, ${gold}40)` }} />
                                        </div>
                                        <h2 className="text-3xl md:text-5xl font-black" style={{ fontFamily: "'Playfair Display',serif" }}>اختر خدمتك</h2>
                                        <p className="text-sm text-white/25 mt-3">اختر من قائمة خدماتنا لبدء الحجز</p>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                        {services.map((s, i) => (
                                            <motion.button key={s.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                                                onClick={() => { setSel({ ...sel, service_id: s.id }); setStep(3); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                                                className="group relative text-right rounded-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden"
                                                style={{ background: "linear-gradient(135deg, #0d0d0d 0%, #0a0a0a 100%)", border: "1px solid rgba(255,255,255,.06)" }}
                                                onMouseEnter={e => { e.currentTarget.style.borderColor = `${gold}30`; e.currentTarget.style.boxShadow = `0 25px 60px ${gold}08, inset 0 1px 0 ${gold}10`; }}
                                                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,.06)"; e.currentTarget.style.boxShadow = "none"; }}>
                                                <div className="h-[2px] w-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `linear-gradient(90deg, transparent, ${gold}, transparent)` }} />
                                                <div className="p-6 md:p-7">
                                                    <div className="flex justify-between items-start mb-5">
                                                        <div className="w-11 h-11 rounded-xl flex items-center justify-center opacity-40 group-hover:opacity-100 transition-all duration-500" style={{ background: `${gold}08`, color: gold }}>
                                                            <IconScissors />
                                                        </div>
                                                        <div className="w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 -translate-x-2 group-hover:translate-x-0" style={{ background: `${gold}15`, color: gold }}>
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                                                        </div>
                                                    </div>
                                                    <h3 className="text-lg font-bold text-white group-hover:text-[#c8a96e] transition-colors mb-1">{s.name}</h3>
                                                    {s.duration_minutes && <p className="text-xs text-white/20 mb-5">{s.duration_minutes} دقيقة</p>}
                                                    {!s.duration_minutes && <div className="mb-5" />}
                                                    <div className="flex items-end justify-between pt-4" style={{ borderTop: "1px solid rgba(255,255,255,.04)" }}>
                                                        <div>
                                                            <span className="text-3xl font-black" style={{ color: gold }}>{Number(s.price).toFixed(2)}</span>
                                                            <span className="text-[10px] text-white/20 mr-1">د.أ</span>
                                                        </div>
                                                        <span className="text-[10px] tracking-[.2em] uppercase text-white/15 group-hover:text-white/40 transition-colors">اختيار</span>
                                                    </div>
                                                </div>
                                            </motion.button>
                                        ))}
                                    </div>
                                    <button onClick={() => { setStep(1); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="flex items-center gap-2 mx-auto mt-12 text-sm text-white/25 hover:text-white/60 transition-colors tracking-wider group">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="group-hover:-translate-x-1 transition-transform"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                                        رجوع
                                    </button>
                                </motion.div>
                            )}

                            {/* S3: Employees */}
                            {step === 3 && (
                                <motion.div key="s3" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }}>
                                    <div className="text-center mb-10 md:mb-14">
                                        <div className="flex items-center justify-center gap-4 mb-4">
                                            <div className="h-px w-10" style={{ background: `linear-gradient(90deg, transparent, ${gold}40)` }} />
                                            <p className="text-xs tracking-[.35em] uppercase font-semibold" style={{ color: gold }}>الخطوة الثانية</p>
                                            <div className="h-px w-10" style={{ background: `linear-gradient(270deg, transparent, ${gold}40)` }} />
                                        </div>
                                        <h2 className="text-3xl md:text-5xl font-black" style={{ fontFamily: "'Playfair Display',serif" }}>اختر الحلاق</h2>
                                        <p className="text-sm text-white/25 mt-3">اختر الحلاق المفضل لديك أو اترك الاختيار لنا</p>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-3xl mx-auto">
                                        <motion.button initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                            onClick={() => { setSel({ ...sel, employee_id: 0 }); setStep(4); }}
                                            className="group relative p-7 rounded-2xl text-center transition-all duration-500 hover:-translate-y-2 overflow-hidden"
                                            style={{ background: `linear-gradient(135deg, ${gold}08, transparent)`, border: `1px solid ${gold}15` }}
                                            onMouseEnter={e => { e.currentTarget.style.borderColor = `${gold}40`; e.currentTarget.style.boxShadow = `0 20px 50px ${gold}10`; }}
                                            onMouseLeave={e => { e.currentTarget.style.borderColor = `${gold}15`; e.currentTarget.style.boxShadow = "none"; }}>
                                            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: `${gold}10`, border: `1px solid ${gold}20` }}>
                                                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: gold }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                                            </div>
                                            <span className="font-bold text-base group-hover:text-white transition-colors" style={{ color: gold }}>أي حلاق متاح</span>
                                            <p className="text-[11px] text-white/20 mt-1">سيتم اختيار حلاق تلقائياً</p>
                                        </motion.button>
                                        {employees.map((emp, i) => (
                                            <motion.button key={emp.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (i + 1) * 0.08 }}
                                                onClick={() => { setSel({ ...sel, employee_id: emp.id }); setStep(4); }}
                                                className="group relative p-7 rounded-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden"
                                                style={{ background: "linear-gradient(135deg, #0d0d0d, #0a0a0a)", border: "1px solid rgba(255,255,255,.06)" }}
                                                onMouseEnter={e => { e.currentTarget.style.borderColor = `${gold}30`; e.currentTarget.style.boxShadow = `0 20px 50px ${gold}08`; }}
                                                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,.06)"; e.currentTarget.style.boxShadow = "none"; }}>
                                                <div className="h-[2px] w-full absolute top-0 left-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `linear-gradient(90deg, transparent, ${gold}, transparent)` }} />
                                                <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-2xl font-black"
                                                    style={{ background: `${gold}08`, color: gold, border: `1px solid ${gold}15` }}>{emp.name.charAt(0).toUpperCase()}</div>
                                                <span className="font-bold text-base text-white group-hover:text-[#c8a96e] transition-colors">{emp.name}</span>
                                            </motion.button>
                                        ))}
                                    </div>
                                    <button onClick={() => setStep(2)} className="flex items-center gap-2 mx-auto mt-12 text-sm text-white/25 hover:text-white/60 transition-colors tracking-wider group">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="group-hover:-translate-x-1 transition-transform"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                                        رجوع للخدمات
                                    </button>
                                </motion.div>
                            )}

                            {/* S4: Date & Time */}
                            {step === 4 && (
                                <motion.div key="s4" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }}>
                                    <div className="text-center mb-10 md:mb-14">
                                        <p className="text-xs tracking-[.3em] uppercase mb-3" style={{ color: gold }}>الخطوة الثالثة</p>
                                        <h2 className="text-3xl md:text-4xl font-black" style={{ fontFamily: "'Playfair Display',serif" }}>اختر الموعد</h2>
                                    </div>

                                    <div className="max-w-2xl mx-auto">
                                        <div className="flex gap-2.5 overflow-x-auto pb-6" style={{ scrollbarWidth: "none" }}>
                                            {dates.map(d => (
                                                <button key={d} onClick={() => { setSel({ ...sel, booking_date: d, booking_time: "" }); loadBooked(d); }}
                                                    className="flex-shrink-0 w-[76px] py-4 rounded-2xl text-center transition-all duration-300"
                                                    style={{
                                                        background: sel.booking_date === d ? gold : "#0a0a0a",
                                                        color: sel.booking_date === d ? "#000" : "#666",
                                                        border: `1px solid ${sel.booking_date === d ? gold : "rgba(255,255,255,.05)"}`,
                                                        boxShadow: sel.booking_date === d ? `0 10px 40px ${gold}30` : "none",
                                                        fontWeight: sel.booking_date === d ? 900 : 500,
                                                    }}>
                                                    <p className="text-[10px]">{dayNames[new Date(d).getDay()]}</p>
                                                    <p className="text-2xl font-black my-1">{new Date(d).getDate()}</p>
                                                    <p className="text-[10px]">{monthNames[new Date(d).getMonth()]}</p>
                                                </button>
                                            ))}
                                        </div>

                                        {sel.booking_date && (
                                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
                                                <p className="text-xs text-white/30 mb-4 tracking-wider uppercase">الأوقات المتاحة</p>
                                                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                                                    {timeSlots.map(t => {
                                                        const bk = isBooked(t); const s = sel.booking_time === t;
                                                        return (<button key={t} onClick={() => !bk && setSel({ ...sel, booking_time: t })} disabled={bk}
                                                            className="py-3 rounded-xl text-xs font-bold transition-all duration-300"
                                                            style={{
                                                                background: s ? gold : "#0a0a0a", color: s ? "#000" : bk ? "#222" : "#888",
                                                                border: `1px solid ${s ? gold : "rgba(255,255,255,.04)"}`, opacity: bk ? 0.25 : 1,
                                                                cursor: bk ? "not-allowed" : "pointer", boxShadow: s ? `0 6px 20px ${gold}25` : "none"
                                                            }}>{fmt12(t)}</button>);
                                                    })}
                                                </div>
                                            </motion.div>
                                        )}

                                        <div className="flex gap-3 mt-10">
                                            <button onClick={() => setStep(3)} className="flex-1 py-4 rounded-full text-sm font-bold text-white/40 hover:text-white transition-all"
                                                style={{ border: "1px solid rgba(255,255,255,.08)" }}>رجوع</button>
                                            <button onClick={() => sel.booking_date && sel.booking_time && setStep(5)}
                                                disabled={!sel.booking_date || !sel.booking_time}
                                                className="flex-1 py-4 rounded-full text-sm font-bold tracking-wider transition-all duration-300 disabled:opacity-20 hover:scale-[1.02]"
                                                style={{ background: gold, color: "#000" }}>التالي</button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* S5: Customer Info */}
                            {step === 5 && (
                                <motion.div key="s5" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }}>
                                    <div className="text-center mb-10 md:mb-14">
                                        <p className="text-xs tracking-[.3em] uppercase mb-3" style={{ color: gold }}>الخطوة الأخيرة</p>
                                        <h2 className="text-3xl md:text-4xl font-black" style={{ fontFamily: "'Playfair Display',serif" }}>تأكيد الحجز</h2>
                                    </div>

                                    <div className="max-w-lg mx-auto">
                                        {/* Summary */}
                                        <div className="p-6 rounded-2xl mb-8" style={{ background: `${gold}05`, border: `1px solid ${gold}10` }}>
                                            <div className="space-y-3 text-sm">
                                                <div className="flex justify-between"><span className="text-white/40">الخدمة</span><span className="font-bold">{selService?.name}</span></div>
                                                {selEmployee && <div className="flex justify-between"><span className="text-white/40">الحلاق</span><span className="font-bold">{selEmployee.name}</span></div>}
                                                <div className="flex justify-between"><span className="text-white/40">الموعد</span><span className="font-bold" style={{ color: gold }}>{sel.booking_date} — {fmt12(sel.booking_time)}</span></div>
                                                <div className="flex justify-between pt-3" style={{ borderTop: `1px solid ${gold}10` }}>
                                                    <span className="text-white/40">المبلغ</span><span className="text-xl font-black" style={{ color: gold }}>{Number(selService?.price || 0).toFixed(2)} د.أ</span>
                                                </div>
                                            </div>
                                        </div>

                                        {error && <div className="p-4 rounded-xl mb-5 text-sm text-red-400" style={{ background: "rgba(239,68,68,.05)", border: "1px solid rgba(239,68,68,.1)" }}>⚠️ {error}</div>}

                                        <div className="space-y-5">
                                            {[{ l: "الاسم الكامل", k: "customer_name", p: "أدخل اسمك الكامل", d: "rtl" },
                                            { l: "رقم الهاتف", k: "customer_phone", p: "07XXXXXXXX", d: "ltr" }].map(f => (
                                                <div key={f.k}>
                                                    <label className="text-xs font-bold text-white/30 mb-2 block tracking-wider uppercase">{f.l}</label>
                                                    <input value={sel[f.k as keyof typeof sel]} onChange={e => setSel({ ...sel, [f.k]: e.target.value })}
                                                        className="w-full py-4 px-5 rounded-xl text-white outline-none transition-all text-sm"
                                                        style={{ background: "#0a0a0a", border: "1.5px solid rgba(255,255,255,.06)", fontFamily: "'Tajawal',sans-serif" }}
                                                        onFocus={e => { e.currentTarget.style.borderColor = gold; e.currentTarget.style.boxShadow = `0 0 0 4px ${gold}08`; }}
                                                        onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,.06)"; e.currentTarget.style.boxShadow = "none"; }}
                                                        placeholder={f.p} dir={f.d} />
                                                </div>
                                            ))}
                                            <div>
                                                <label className="text-xs font-bold text-white/30 mb-2 block tracking-wider uppercase">ملاحظات (اختياري)</label>
                                                <textarea value={sel.notes} onChange={e => setSel({ ...sel, notes: e.target.value })} rows={2}
                                                    className="w-full py-4 px-5 rounded-xl text-white outline-none resize-none transition-all text-sm"
                                                    style={{ background: "#0a0a0a", border: "1.5px solid rgba(255,255,255,.06)", fontFamily: "'Tajawal',sans-serif" }}
                                                    onFocus={e => { e.currentTarget.style.borderColor = gold; e.currentTarget.style.boxShadow = `0 0 0 4px ${gold}08`; }}
                                                    onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,.06)"; e.currentTarget.style.boxShadow = "none"; }} />
                                            </div>
                                        </div>

                                        <div className="flex gap-3 mt-10">
                                            <button onClick={() => setStep(4)} className="flex-1 py-4 rounded-full text-sm font-bold text-white/40 hover:text-white transition-all"
                                                style={{ border: "1px solid rgba(255,255,255,.08)" }}>رجوع</button>
                                            <button onClick={handleSubmit} disabled={submitting || !sel.customer_name || !sel.customer_phone}
                                                className="flex-1 py-4 rounded-full text-sm font-bold tracking-wider transition-all duration-300 disabled:opacity-20 hover:scale-[1.02]"
                                                style={{ background: gold, color: "#000", boxShadow: `0 15px 50px ${gold}25` }}>
                                                {submitting ? "جاري الحجز..." : "تأكيد الحجز"}
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* S6: Success */}
                            {step === 6 && (
                                <motion.div key="s6" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16 max-w-lg mx-auto">
                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}
                                        className="w-28 h-28 mx-auto mb-10 rounded-full flex items-center justify-center"
                                        style={{ background: `${gold}08`, border: `2px solid ${gold}20`, boxShadow: `0 0 60px ${gold}10`, color: gold }}>
                                        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m9 12 2 2 4-4" /><circle cx="12" cy="12" r="10" /></svg>
                                    </motion.div>
                                    <h2 className="text-4xl md:text-5xl font-black mb-4" style={{ fontFamily: "'Playfair Display',serif" }}>تم الحجز</h2>
                                    <p className="text-white/40 mb-10 text-lg">سيتم تأكيد موعدك قريباً</p>

                                    {salon?.booking_message && (
                                        <div className="p-6 rounded-2xl mb-8 text-sm text-white/40" style={{ background: `${gold}04`, border: `1px solid ${gold}08` }}>{salon.booking_message}</div>
                                    )}

                                    <div className="p-6 rounded-2xl mb-10" style={{ background: "#0a0a0a", border: "1px solid rgba(255,255,255,.05)" }}>
                                        <div className="space-y-3 text-sm text-right">
                                            <div className="flex justify-between"><span className="text-white/30">الخدمة</span><span className="font-bold">{selService?.name}</span></div>
                                            {selEmployee && <div className="flex justify-between"><span className="text-white/30">الحلاق</span><span className="font-bold">{selEmployee.name}</span></div>}
                                            <div className="flex justify-between"><span className="text-white/30">الموعد</span><span className="font-bold" style={{ color: gold }}>{sel.booking_date} — {fmt12(sel.booking_time)}</span></div>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 justify-center">
                                        {salon?.phone && (
                                            <a href={`https://wa.me/${salon.phone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer"
                                                className="h-12 px-8 rounded-full text-sm font-bold flex items-center gap-2 transition-all hover:scale-105" style={{ background: "#25D366", color: "#fff" }}>واتساب</a>
                                        )}
                                        <button onClick={() => { setStep(1); setSel({ service_id: 0, employee_id: 0, booking_date: "", booking_time: "", customer_name: "", customer_phone: "", notes: "" }); }}
                                            className="h-12 px-8 rounded-full text-sm font-bold transition-all hover:scale-105"
                                            style={{ border: "1px solid rgba(255,255,255,.1)", color: "#fff" }}>حجز جديد</button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </section>

                {/* ═══════════ FOOTER ═══════════ */}
                <footer style={{ borderTop: "1px solid rgba(255,255,255,.04)" }}>
                    <div className="max-w-6xl mx-auto px-6 md:px-10 py-16 md:py-20">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-8 mb-14">
                            {/* Brand */}
                            <div className="md:col-span-2">
                                <h3 className="text-2xl md:text-3xl font-black mb-4" style={{ fontFamily: "'Playfair Display',serif" }}>{salon?.name}</h3>
                                {salon?.description && <p className="text-sm text-white/25 leading-relaxed max-w-sm">{salon.description}</p>}
                                <div className="flex items-center gap-3 mt-6">
                                    {salon?.instagram && (
                                        <a href={`https://instagram.com/${salon.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer"
                                            className="w-10 h-10 rounded-full flex items-center justify-center text-white/25 hover:text-white transition-all" style={{ border: "1px solid rgba(255,255,255,.08)" }}><IconInstagram /></a>
                                    )}
                                    {salon?.phone && (
                                        <a href={`tel:${salon.phone}`}
                                            className="w-10 h-10 rounded-full flex items-center justify-center text-white/25 hover:text-white transition-all" style={{ border: "1px solid rgba(255,255,255,.08)" }}><IconPhone /></a>
                                    )}
                                </div>
                            </div>
                            {/* Contact */}
                            <div>
                                <p className="text-[10px] font-bold tracking-[.3em] uppercase mb-4" style={{ color: gold }}>تواصل</p>
                                <div className="space-y-3 text-sm text-white/30">
                                    {salon?.phone && <p dir="ltr" className="text-right">{salon.phone}</p>}
                                    {salon?.address && <p>{salon.address}</p>}
                                    {salon?.instagram && <p>{salon.instagram}</p>}
                                </div>
                            </div>
                            {/* Hours */}
                            <div>
                                <p className="text-[10px] font-bold tracking-[.3em] uppercase mb-4" style={{ color: gold }}>أوقات العمل</p>
                                <p className="text-sm text-white/30 mb-2">{fmt12(workHours.start)} — {fmt12(workHours.end)}</p>
                                {offDays.length > 0 && <p className="text-xs text-white/15">إجازة: {offDays.map(d => dayNames[d]).join("، ")}</p>}
                            </div>
                        </div>
                        <div className="flex items-center justify-between pt-8" style={{ borderTop: "1px solid rgba(255,255,255,.04)" }}>
                            <p className="text-[10px] text-white/15">&copy; {new Date().getFullYear()} {salon?.name}</p>
                            <div className="flex items-center gap-3">
                                <a href="https://wr-technologies.net/" target="_blank" rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[10px] opacity-30 hover:opacity-60 transition-opacity"
                                    style={{ color: "#c8a96e" }}>
                                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                                    WR Technologies
                                </a>
                                <span className="text-white/10 text-[10px]">|</span>
                                <span className="text-xs font-black" style={{ color: gold }}>MAQASS</span>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}

export default function BookPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ background: "#000" }}><div className="w-12 h-12 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#c8a96e transparent #c8a96e #c8a96e" }} /></div>}>
            <BookingContent />
        </Suspense>
    );
}
