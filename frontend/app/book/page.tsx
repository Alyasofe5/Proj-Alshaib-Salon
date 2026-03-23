"use client";

import { useEffect, useState, useCallback, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence, useInView } from "framer-motion";
import axios from "axios";
import { assetUrl } from "@/lib/assets";
import {
    Scissors, Calendar, Clock, UserCircle, X, ArrowRight, Plus, Sparkles,
    ChevronDown, MapPin, Phone, Instagram, AlertCircle, Check, CheckCircle2,
} from "lucide-react";
import { Service, Employee, SalonInfo, BookingSel, dayNames, monthNames, fmt12, API } from "./types";
import BookingModal from "./BookingModal";

/* ═══════════════════════════════════════
   ANIMATION VARIANTS
   ═══════════════════════════════════════ */
const spring = { type: "spring" as const, stiffness: 100, damping: 20 };
const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } };
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

/* Counter Component */
function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
    const ref = useRef<HTMLSpanElement>(null);
    const isInView = useInView(ref, { once: true });
    const [count, setCount] = useState(0);
    useEffect(() => {
        if (!isInView) return;
        let start = 0;
        const dur = 2000;
        const step = (ts: number) => {
            start = start || ts;
            const p = Math.min((ts - start) / dur, 1);
            setCount(Math.floor(p * target));
            if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }, [isInView, target]);
    return <span ref={ref}>+{count}{suffix}</span>;
}

function BookingContent() {
    const searchParams = useSearchParams();
    const slug = searchParams.get("s") || searchParams.get("salon") || "";

    const [salon, setSalon] = useState<SalonInfo | null>(null);
    const [services, setServices] = useState<Service[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [workHours, setWorkHours] = useState({ start: "09:00", end: "22:00", interval: 30 });
    const [offDays, setOffDays] = useState<number[]>([]);
    const [bookingDays, setBookingDays] = useState(7);

    const [isBookingOpen, setIsBookingOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const [notFound, setNotFound] = useState(false);
    const [noBookingPage, setNoBookingPage] = useState(false);

    const [step, setStep] = useState(1);
    const [sel, setSel] = useState<BookingSel>({ service_ids: [], employee_id: 0, booking_date: "", booking_time: "", customer_name: "", customer_phone: "", notes: "" });
    const [bookedSlots, setBookedSlots] = useState<{ booking_time: string; employee_id: number }[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!slug) { setNotFound(true); return; }
        (async () => {
            try {
                const res = await axios.get(`${API}/booking/salon.php?slug=${slug}`);
                const d = res.data.data;
                setSalon(d.salon); setServices(d.services || []); setEmployees(d.employees || []);
                if (d.settings) {
                    setWorkHours({ start: d.settings.work_start || "09:00", end: d.settings.work_end || "22:00", interval: parseInt(d.settings.slot_interval) || 30 });
                    setOffDays(JSON.parse(d.settings.off_days || "[]").map(Number));
                    setBookingDays(parseInt(d.settings.booking_days_ahead) || 7);
                    if (d.settings.is_booking_active === 0 || d.settings.is_booking_active === "0") setNoBookingPage(true);
                }
            } catch (err: unknown) {
                const axiosErr = err as { response?: { status?: number } };
                if (axiosErr.response?.status === 404) setNotFound(true);
            }
        })();
    }, [slug]);

    useEffect(() => {
        const h = () => setScrolled(window.scrollY > 50);
        window.addEventListener("scroll", h);
        return () => window.removeEventListener("scroll", h);
    }, []);

    const fetchBooked = useCallback(async (empId: number, date: string) => {
        try {
            const res = await axios.get(`${API}/booking/book.php?salon_slug=${slug}&employee_id=${empId}&date=${date}`);
            setBookedSlots(res.data.data.booked_slots || []);
        } catch { /* silent */ }
    }, [slug]);

    const selSrvs = services.filter(s => sel.service_ids.includes(s.id));
    const totalPrice = selSrvs.reduce((sum, s) => sum + parseFloat(s.price || "0"), 0);
    const totalDur = selSrvs.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);

    const submitBooking = useCallback(async () => {
        setError(""); setSubmitting(true);
        try {
            if (!sel.customer_name || !sel.customer_phone || !sel.booking_date || !sel.booking_time || sel.service_ids.length === 0)
                throw new Error("يرجى إكمال جميع البيانات المطلوبة");
            if (sel.customer_name.length < 3) throw new Error("الاسم يجب أن يكون 3 أحرف على الأقل");
            if (!/^05\d{8}$/.test(sel.customer_phone)) throw new Error("رقم الهاتف يجب أن يبدأ بـ 05 ويتكون من 10 أرقام");
            await axios.post(`${API}/booking/book.php`, { salon_slug: slug, ...sel, total_price: totalPrice, total_duration: totalDur });
            setStep(5);
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
            setError(axiosErr.response?.data?.message || axiosErr.message || "حدث خطأ");
        }
        setSubmitting(false);
    }, [sel, slug, totalPrice, totalDur]);

    const dates: string[] = [];
    for (let i = 0; i < bookingDays; i++) {
        const d = new Date(); d.setDate(d.getDate() + i);
        if (!offDays.includes(d.getDay())) dates.push(d.toISOString().split("T")[0]);
    }

    const genTimes = useCallback(() => {
        const tr: string[] = [];
        let [ch, cm] = workHours.start.split(":").map(Number);
        const [eh, em] = workHours.end.split(":").map(Number);
        const no = new Date(); const isToday = sel.booking_date === no.toISOString().split("T")[0];
        while (ch < eh || (ch === eh && cm < em)) {
            const t = `${String(ch).padStart(2, "0")}:${String(cm).padStart(2, "0")}`;
            let passed = false;
            if (isToday) { if (ch < no.getHours() || (ch === no.getHours() && cm <= no.getMinutes() + 30)) passed = true; }
            if (!passed) tr.push(t);
            cm += workHours.interval; if (cm >= 60) { ch++; cm -= 60; }
        }
        return tr;
    }, [workHours, sel.booking_date]);

    const toggleSrv = useCallback((id: number) => {
        setSel(p => ({ ...p, service_ids: p.service_ids.includes(id) ? p.service_ids.filter(x => x !== id) : [...p.service_ids, id] }));
    }, []);

    /* ─── Error States ─── */
    if (notFound) return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A0A0A", color: "#F5F2EC", direction: "rtl" }}>
            <div className="text-center">
                <p style={{ fontSize: "6rem", fontFamily: "'Playfair Display', serif", fontWeight: 900, color: "#C3D809" }}>404</p>
                <p style={{ fontFamily: "'Noto Sans Arabic', sans-serif", fontWeight: 800, fontSize: "1.25rem" }}>الصالون غير موجود</p>
            </div>
        </div>
    );

    if (noBookingPage) return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A0A0A", color: "#F5F2EC", direction: "rtl" }}>
            <div className="text-center px-6 max-w-md">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ background: "rgba(195,216,9,0.1)" }}>
                    <Calendar size={36} color="#C3D809" />
                </div>
                <h1 style={{ fontFamily: "'Noto Sans Arabic', sans-serif", fontWeight: 900, fontSize: "1.75rem", marginBottom: 12 }}>الحجز غير متاح</h1>
                <p style={{ color: "rgba(245,242,236,0.5)", lineHeight: 1.8 }}>نظام الحجز الإلكتروني غير مفعل لهذا الصالون حالياً.</p>
            </div>
        </div>
    );

    if (!salon) return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A0A0A" }}>
            <div className="w-10 h-10 rounded-full animate-spin" style={{ border: "3px solid rgba(195,216,9,0.15)", borderTopColor: "#C3D809" }} />
        </div>
    );

    const mockGallery = salon.gallery?.length ? salon.gallery : [
        "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?q=80&w=1200",
        "https://images.unsplash.com/photo-1621605815971-fbc98d665033?q=80&w=1200",
        "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=1200",
        "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=1200",
    ];
    const mockReviews = salon.reviews?.length ? salon.reviews : [
        { id: 1, customer_name: "أحمد العبدالله", rating: 5, comment: "خدمة احترافية جداً، الحلاق فهم قصة الشعر اللي أريدها بالضبط." },
        { id: 2, customer_name: "محمد خالد", rating: 5, comment: "المكان راقي جداً والتعامل ممتاز. أنصح بتجربة قسم العناية بالبشرة." },
        { id: 3, customer_name: "سالم المري", rating: 5, comment: "تجربة رائعة وتطبيق الحجز سهل جداً. السعر مناسب مقابل الجودة." },
    ];
    const mockFaqs = salon.faqs?.length ? salon.faqs : [
        { id: 1, question: "هل يتوفر مواقف سيارات؟", answer: "نعم، نوفر مواقف مجانية لعملائنا أمام الصالون مباشرة." },
        { id: 2, question: "هل يمكن إلغاء أو تعديل الموعد؟", answer: "بالطبع، تواصل معنا قبل ساعتين على الأقل من موعدك." },
        { id: 3, question: "ما هي طرق الدفع المتاحة؟", answer: "نوفر الدفع نقداً وعبر البطاقات الائتمانية وبطاقات مدى." },
    ];

    const serviceCards = [
        { name: "حلاقة الشعر", en: "HAIR", img: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?q=80&w=600" },
        { name: "تلوين الشعر", en: "COLOR", img: "https://images.unsplash.com/photo-1560869713-7d0a29430803?q=80&w=600" },
        { name: "العناية الكيميائية", en: "CHEMICAL", img: "https://images.unsplash.com/photo-1622288432450-277d0fef5ed6?q=80&w=600" },
        { name: "علاجات الشعر", en: "TREATMENT", img: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=600" },
        { name: "خدمات التجميل", en: "AESTHETICS", img: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=600" },
    ];

    return (
        <div className="min-h-screen overflow-x-hidden" style={{ fontFamily: "'Noto Sans Arabic', sans-serif", background: "#0A0A0A", color: "#F5F2EC", direction: "rtl" }}>

            {/* GOOGLE FONTS */}
            {/* eslint-disable-next-line @next/next/no-page-custom-font */}
            <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700;1,900&family=Tajawal:wght@400;500;700;800;900&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />

            {/* ═══ HEADER ═══ */}
            <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-500" style={{
                padding: scrolled ? "10px 16px" : "18px 16px",
                background: scrolled ? "rgba(10,10,10,0.96)" : "transparent",
                backdropFilter: scrolled ? "blur(20px)" : "none",
                borderBottom: "none",
                boxShadow: scrolled ? "0 4px 30px rgba(0,0,0,0.15)" : "none",
            }}>
                <div className="max-w-[1400px] mx-auto flex justify-between items-center">
                    <a href="/" className="transition-opacity hover:opacity-80">
                        {salon.logo ? (
                            <img
                                src={assetUrl(salon.logo)!}
                                alt={salon.name}
                                className="object-cover rounded-full"
                                style={{
                                    width: 44, height: 44,
                                    mixBlendMode: "screen",
                                    filter: "brightness(1.1) contrast(1.1)",
                                    border: "1px solid rgba(245,242,236,0.1)"
                                }}
                            />
                        ) : (
                            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.2rem, 4vw, 1.75rem)", fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.03em" }}>
                                {salon.name}<span style={{ color: "#C3D809" }}>.</span>
                            </div>
                        )}
                    </a>
                    <nav className="hidden lg:flex items-center gap-10" style={{ fontFamily: "'Noto Sans Arabic', sans-serif", fontSize: "0.85rem", fontWeight: 500, letterSpacing: "0.05em" }}>
                        {[{ name: "الخدمات", id: "services" }, { name: "عن الصالون", id: "about" }, { name: "الفريق", id: "team" }, { name: "تواصل", id: "contact" }].map(item => (
                            <a key={item.id} href={`#${item.id}`} className="transition-colors" style={{ color: "rgba(245,242,236,0.5)" }}
                                onMouseEnter={e => (e.target as HTMLElement).style.color = "#C3D809"}
                                onMouseLeave={e => (e.target as HTMLElement).style.color = "rgba(245,242,236,0.5)"}>{item.name}</a>
                        ))}
                    </nav>
                    {/* Desktop CTA */}
                    <button onClick={() => setIsBookingOpen(true)}
                        className="hidden md:block px-6 py-2.5 rounded-full text-sm font-bold transition-all"
                        style={{ border: "1px solid rgba(245,242,236,0.15)", color: "#F5F2EC", background: "transparent", fontFamily: "'Noto Sans Arabic', sans-serif", fontSize: "0.9rem" }}
                        onMouseEnter={e => { (e.target as HTMLElement).style.background = "#C3D809"; (e.target as HTMLElement).style.borderColor = "#C3D809"; (e.target as HTMLElement).style.color = "#0A0A0A"; }}
                        onMouseLeave={e => { (e.target as HTMLElement).style.background = "transparent"; (e.target as HTMLElement).style.borderColor = "rgba(245,242,236,0.15)"; (e.target as HTMLElement).style.color = "#F5F2EC"; }}>
                        احجز الآن
                    </button>
                    {/* Mobile menu icon → opens booking */}
                    <button onClick={() => setIsBookingOpen(true)}
                        className="flex md:hidden items-center gap-1.5 px-4 py-2 rounded-full"
                        style={{ background: "var(--border-subtle)", border: "1px solid rgba(195,216,9,0.3)", color: "#C3D809", fontFamily: "'Noto Sans Arabic', sans-serif", fontSize: "0.85rem", fontWeight: 700 }}>
                        احجز
                    </button>
                </div>
            </header>

            <main>
                {/* ═══ HERO ═══ */}
                <section className="relative h-screen flex items-center justify-center text-center overflow-hidden">
                    <div className="absolute inset-0 z-0">
                        <video className="w-full h-full object-cover" autoPlay loop muted playsInline>
                            <source src="/hero.mp4" type="video/mp4" />
                        </video>
                        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(10,10,10,0.7) 0%, rgba(10,10,10,0.5) 50%, rgba(10,10,10,0.9) 100%)" }} />
                        {/* Grain texture overlay */}
                        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")" }} />
                    </div>
                    <div className="relative z-10 w-full px-5 sm:px-8 text-center">
                        <motion.div initial="hidden" animate="visible" variants={stagger}>
                            <motion.h1 variants={fadeUp} transition={spring} style={{
                                fontFamily: "'Noto Sans Arabic', sans-serif", fontWeight: 900,
                                fontSize: "clamp(2.8rem, 12vw, 8rem)", lineHeight: 1, letterSpacing: "-0.02em", marginBottom: 20,
                            }}>
                                نلتزم
                                <span style={{ color: "#C3D809", fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontWeight: 700, display: "block" }}>بالتميز</span>
                            </motion.h1>
                            <motion.p variants={fadeUp} transition={{ ...spring, delay: 0.2 }} style={{
                                fontSize: "clamp(0.9rem, 3.5vw, 1.1rem)", color: "rgba(245,242,236,0.5)", maxWidth: 400, margin: "0 auto 32px",
                                lineHeight: 1.9, fontFamily: "'Noto Sans Arabic', sans-serif", fontWeight: 400,
                            }}>
                                {salon.description || "نحن ملتزمون بتزويد عملائنا بتجربة صالون لا مثيل لها."}
                            </motion.p>
                            <motion.button variants={fadeUp} transition={{ ...spring, delay: 0.4 }}
                                onClick={() => setIsBookingOpen(true)}
                                className="inline-flex items-center gap-2 rounded-full font-bold transition-all"
                                style={{ border: "1px solid #C3D809", color: "#C3D809", background: "transparent", fontFamily: "'Noto Sans Arabic', sans-serif", fontSize: "clamp(0.9rem, 3vw, 1rem)", padding: "12px 28px" }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#C3D809"; (e.currentTarget as HTMLElement).style.color = "#0A0A0A"; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "#C3D809"; }}>
                                احجز موعدك الآن
                                <ArrowRight size={14} className="-rotate-180" />
                            </motion.button>
                        </motion.div>
                    </div>
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
                        <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2 }} style={{ opacity: 0.3 }}>
                            <ChevronDown size={24} />
                        </motion.div>
                    </div>
                </section>

                {/* ═══ MARQUEE ═══ */}
                <div className="overflow-hidden" style={{ height: 56, background: "#0A0A0A", borderTop: "1px solid rgba(245,242,236,0.04)", borderBottom: "1px solid rgba(245,242,236,0.04)" }}>
                    <div className="flex items-center h-full animate-marquee whitespace-nowrap">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <span key={i} className="flex items-center gap-6 mx-6" style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.7rem", letterSpacing: "0.15em", color: "rgba(245,242,236,0.2)" }}>
                                <span style={{ color: "#C3D809" }}>✦</span> PREMIUM QUALITY <span style={{ color: "#C3D809" }}>✦</span> احجز الآن <span style={{ color: "#C3D809" }}>✦</span> EXCELLENCE <span style={{ color: "#C3D809" }}>✦</span> تميز
                            </span>
                        ))}
                    </div>
                </div>

                {/* ═══ ABOUT ═══ */}
                <section id="about" className="py-16 sm:py-24 lg:py-40 px-5 sm:px-8 lg:px-12" style={{ background: "#F5F2EC", color: "#0A0A0A" }}>
                    <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-10 lg:gap-24">
                        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={spring} className="w-full lg:w-1/2 relative">
                            <div className="rounded-xl overflow-hidden" style={{ aspectRatio: "4/3", maxHeight: 420 }}>
                                <img src="https://images.unsplash.com/photo-1621605815971-fbc98d665033?q=80&w=800" alt="About" className="w-full h-full object-cover" loading="lazy" />
                            </div>

                        </motion.div>
                        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={spring} className="w-full lg:w-1/2 space-y-5 sm:space-y-7">
                            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.6rem", letterSpacing: "0.2em", color: "#C3D809" }}>قصتنا وتاريخنا</span>
                            <h2 style={{ fontFamily: "'Noto Sans Arabic', sans-serif", fontWeight: 900, fontSize: "clamp(1.8rem, 6vw, 4rem)", lineHeight: 1.05, letterSpacing: "-0.02em" }}>
                                نخلق <span style={{ color: "#C3D809", fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}>الجمال</span><br />بدقة وإبداع
                            </h2>
                            <p style={{ fontSize: "clamp(0.9rem, 3vw, 1.05rem)", color: "rgba(10,10,10,0.5)", lineHeight: 1.9 }}>
                                نحن في {salon.name} نؤمن بأن الحلاقة ليست مجرد خدمة، بل هي فن يتطلب الدقة والشغف.
                            </p>
                            <div className="flex gap-8 sm:gap-12 pt-4 sm:pt-8">
                                {[{ n: 20, label: "خبير مظهر" }, { n: 15, label: "سنة خبرة" }].map((stat, i) => (
                                    <div key={i} className="flex flex-col gap-2 relative">
                                        <div className="absolute -right-3 sm:-right-4 top-1 bottom-1 w-[1px] bg-[#C3D809]/30" />
                                        <h4 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: "clamp(2rem, 8vw, 3rem)", color: "#0A0A0A", fontStyle: "italic", lineHeight: 1 }}>
                                            <AnimatedCounter target={stat.n} />
                                        </h4>
                                        <p style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.58rem", color: "#C3D809", letterSpacing: "0.12em", fontWeight: 700, textTransform: "uppercase" }}>
                                            {stat.label}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* ═══ SERVICES ═══ */}
                <section id="services" className="py-16 sm:py-24 lg:py-40 px-4 sm:px-5 lg:px-6" style={{ background: "#0A0A0A" }}>
                    <div className="max-w-[1600px] mx-auto">
                        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-10 sm:mb-16">
                            <motion.h2 variants={fadeUp} style={{ fontFamily: "'Noto Sans Arabic', sans-serif", fontWeight: 900, fontSize: "clamp(2rem, 8vw, 5rem)", lineHeight: 1, marginBottom: 12 }}>
                                خدمات <span style={{ color: "#C3D809", fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}>نخبوية</span>
                            </motion.h2>
                            <motion.p variants={fadeUp} style={{ color: "rgba(245,242,236,0.3)", fontSize: "clamp(0.85rem, 3vw, 1rem)", maxWidth: 400, margin: "0 auto" }}>
                                نقدم مجموعة واسعة من الخدمات لتظهر بأفضل صورة
                            </motion.p>
                        </motion.div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3 lg:gap-4">
                            {serviceCards.map((s, i) => (
                                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                                    className="group relative overflow-hidden cursor-pointer" style={{ aspectRatio: "4/5", borderRadius: 12, background: "var(--color-background)" }}
                                    onClick={() => setIsBookingOpen(true)}>
                                    <img src={s.img} alt={s.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(10,10,10,0.85) 0%, rgba(10,10,10,0.15) 60%)" }} />
                                    <div className="relative h-full flex flex-col justify-end p-3 sm:p-5">
                                        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.5rem", letterSpacing: "0.15em", color: "#C3D809", display: "block", marginBottom: 3 }}>{s.en}</span>
                                        <h3 style={{ fontFamily: "'Noto Sans Arabic', sans-serif", fontWeight: 800, fontSize: "clamp(0.85rem, 3vw, 1.1rem)" }}>{s.name}</h3>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ═══ TEAM ═══ */}
                {employees.length > 0 && (
                    <section id="team" className="py-16 sm:py-24 lg:py-40 px-5 sm:px-6" style={{ background: "var(--color-background)" }}>
                        <div className="max-w-[1400px] mx-auto">
                            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={spring}
                                style={{ fontFamily: "'Noto Sans Arabic', sans-serif", fontWeight: 900, fontSize: "clamp(1.8rem, 7vw, 4.5rem)", lineHeight: 1.05, marginBottom: 32 }}>
                                فريقنا من<br /><span style={{ color: "#C3D809", fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}>مبدعين حقيقيين</span>
                            </motion.h2>
                            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 lg:gap-8">
                                {employees.map((emp, i) => (
                                    <motion.div key={emp.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                                        className="group relative overflow-hidden" style={{ aspectRatio: "3/4", borderRadius: 12 }}>
                                        <img src={emp.avatar ? assetUrl(emp.avatar)! : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600"}
                                            className="absolute inset-0 w-full h-full object-cover transition-all duration-700 grayscale group-hover:grayscale-0 group-hover:scale-105" alt={emp.name} loading="lazy" />
                                        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(10,10,10,0.9) 0%, transparent 55%)" }} />
                                        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 lg:p-8">
                                            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.5rem", letterSpacing: "0.12em", color: "#C3D809" }}>{emp.role || "خبير مظهر"}</span>
                                            <h3 style={{ fontFamily: "'Noto Sans Arabic', sans-serif", fontWeight: 900, fontSize: "clamp(1rem, 4vw, 1.6rem)", marginTop: 2 }}>{emp.name}</h3>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* ═══ GALLERY ═══ */}
                <section className="py-16 sm:py-24 lg:py-40 overflow-hidden" style={{ background: "#0A0A0A" }}>
                    <div className="max-w-[1700px] mx-auto px-5 sm:px-6 mb-8 sm:mb-10">
                        <h2 style={{ fontFamily: "'Noto Sans Arabic', sans-serif", fontWeight: 900, fontSize: "clamp(1.6rem, 6vw, 3.5rem)", marginBottom: 6 }}>
                            فلسفة <span style={{ color: "rgba(245,242,236,0.15)", fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}>المظهر</span>
                        </h2>
                    </div>
                    <div className="relative">
                        {/* Shadow over edges for cinematic fade */}
                        <div className="absolute inset-y-0 left-0 w-32 z-10 pointer-events-none" style={{ background: "linear-gradient(to right, #0A0A0A, transparent)" }} />
                        <div className="absolute inset-y-0 right-0 w-32 z-10 pointer-events-none" style={{ background: "linear-gradient(to left, #0A0A0A, transparent)" }} />

                        {/* Track 1: Move Left */}
                        <div className="flex animate-marquee-slow whitespace-nowrap hover:[animation-play-state:paused] mb-6">
                            {[...mockGallery, ...mockGallery].map((img, i) => (
                                <div key={`t1-${i}`} className="inline-block shrink-0 w-[60vw] lg:w-[30vw] mx-3 lg:mx-4 overflow-hidden group" style={{ aspectRatio: i % 2 === 0 ? "16/9" : "4/5", borderRadius: 8 }}>
                                    <img src={img} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="" loading="lazy" />
                                </div>
                            ))}
                        </div>

                        {/* Track 2: Move Right */}
                        <div className="flex animate-marquee-slow whitespace-nowrap hover:[animation-play-state:paused] direction-ltr" style={{ animationDirection: "reverse" }}>
                            {[...mockGallery.reverse(), ...mockGallery].map((img, i) => (
                                <div key={`t2-${i}`} className="inline-block shrink-0 w-[50vw] lg:w-[25vw] mx-3 lg:mx-4 overflow-hidden group" style={{ aspectRatio: i % 3 === 0 ? "1/1" : "3/2", borderRadius: 8 }}>
                                    <img src={img} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="" loading="lazy" />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="py-16 sm:py-24 lg:py-40 px-5 sm:px-6 relative overflow-hidden" style={{ background: "#111111" }}>
                    <div className="max-w-4xl mx-auto relative z-10">
                        <div className="flex flex-col items-center text-center">
                            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.6rem", letterSpacing: "0.3em", color: "#C3D809", display: "block", marginBottom: 24 }}>آراء عملائنا</span>
                            
                            <div className="relative">
                                {/* Large Quote Mark Decoration */}
                                <div className="absolute -top-12 -right-8 opacity-10 select-none" style={{ fontFamily: "'Playfair Display', serif", fontSize: "10rem", color: "#C3D809", lineHeight: 1 }}>"</div>
                                
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={step % mockReviews.length}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={spring}
                                        className="relative"
                                    >
                                        <p style={{ 
                                            fontFamily: "'Playfair Display', serif", 
                                            fontSize: "clamp(1.1rem, 4.5vw, 2.2rem)", 
                                            fontStyle: "italic", 
                                            lineHeight: 1.65, 
                                            color: "#F5F2EC",
                                            marginBottom: 28
                                        }}>
                                            "{mockReviews[step % mockReviews.length].comment}"
                                        </p>
                                        
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-12 h-[1px] bg-[#C3D809]/40 mb-2" />
                                            <span style={{ 
                                                fontFamily: "'Space Mono', monospace", 
                                                fontSize: "0.75rem", 
                                                letterSpacing: "0.2em", 
                                                color: "#C3D809",
                                                fontWeight: 700
                                            }}>
                                                {mockReviews[step % mockReviews.length].customer_name}
                                            </span>
                                            <span style={{ fontSize: "0.6rem", color: "rgba(245,242,236,0.3)", fontWeight: 500 }}>عميل دائم</span>
                                        </div>
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                            {/* Indicators */}
                            <div className="flex gap-2 mt-16">
                                {mockReviews.map((_, i) => (
                                    <div key={i} className="h-[2px] transition-all duration-500" style={{ 
                                        width: (step % mockReviews.length) === i ? 32 : 12,
                                        background: (step % mockReviews.length) === i ? "#C3D809" : "rgba(245,242,236,0.1)"
                                    }} />
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ═══ FAQ ═══ */}
                <section className="py-16 sm:py-24 lg:py-40 px-5 sm:px-6" style={{ background: "#F5F2EC", color: "#0A0A0A" }}>
                    <div className="max-w-3xl mx-auto">
                        <div className="text-center mb-8 sm:mb-12">
                            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.6rem", letterSpacing: "0.2em", color: "#C3D809", display: "block", marginBottom: 10 }}>لديك استفسار؟</span>
                            <h2 style={{ fontFamily: "'Noto Sans Arabic', sans-serif", fontWeight: 900, fontSize: "clamp(1.8rem, 6vw, 3rem)" }}>
                                الأسئلة <span style={{ color: "#C3D809", fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}>الشائعة</span>
                            </h2>
                        </div>
                        <div style={{ borderTop: "1px solid rgba(10,10,10,0.07)" }}>
                            {mockFaqs.map(faq => (
                                <div key={faq.id} style={{ borderBottom: "1px solid rgba(10,10,10,0.07)" }}>
                                    <button onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)} className="w-full py-5 sm:py-7 flex justify-between items-center text-right gap-4">
                                        <span style={{ fontFamily: "'Noto Sans Arabic', sans-serif", fontWeight: 700, fontSize: "clamp(0.95rem, 3.5vw, 1.2rem)", color: openFaq === faq.id ? "#C3D809" : "#0A0A0A", transition: "color 0.3s" }}>{faq.question}</span>
                                        <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all" style={{
                                            background: openFaq === faq.id ? "#0A0A0A" : "transparent",
                                            border: openFaq === faq.id ? "none" : "1px solid rgba(10,10,10,0.12)",
                                            color: openFaq === faq.id ? "#F5F2EC" : "#0A0A0A",
                                        }}>
                                            <Plus size={15} style={{ transition: "transform 0.5s", transform: openFaq === faq.id ? "rotate(45deg)" : "none" }} />
                                        </div>
                                    </button>
                                    <AnimatePresence>
                                        {openFaq === faq.id && (
                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={spring} className="overflow-hidden">
                                                <p style={{ paddingBottom: 20, color: "rgba(10,10,10,0.5)", lineHeight: 1.9, fontSize: "clamp(0.85rem, 3vw, 0.95rem)" }}>{faq.answer}</p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ═══ CTA ═══ */}
                <section className="relative py-20 sm:py-32 lg:py-48 overflow-hidden" style={{ background: "#0A0A0A" }}>
                    <div className="absolute inset-0 opacity-[0.04]" style={{ background: "radial-gradient(circle at center, #C3D809 0%, transparent 70%)" }} />
                    <div className="relative z-10 text-center px-5 sm:px-6">
                        <h2 style={{ fontFamily: "'Noto Sans Arabic', sans-serif", fontWeight: 900, fontSize: "clamp(2rem, 8vw, 5rem)", lineHeight: 1.1, marginBottom: 28 }}>
                            استعد<br /><span style={{ color: "#C3D809" }}>لمظهرك</span><br />القادم
                        </h2>
                        <button onClick={() => setIsBookingOpen(true)}
                            className="inline-block rounded-full font-bold transition-all"
                            style={{ background: "#F5F2EC", color: "#0A0A0A", fontFamily: "'Noto Sans Arabic', sans-serif", fontSize: "clamp(0.9rem, 3vw, 1.05rem)", padding: "14px 36px" }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#C3D809"; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#F5F2EC"; }}>
                            ابدأ الحجز الآن
                        </button>
                    </div>
                </section>

                <footer id="contact" className="py-12 sm:py-16 px-5 sm:px-8 lg:px-12" style={{ background: "#050505", borderTop: "1px solid rgba(245,242,236,0.05)" }}>
                    <div className="max-w-[1400px] mx-auto">
                        {/* Top Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 lg:gap-12 mb-10 sm:mb-12 text-right">
                            {/* Brand */}
                            <div>
                                <h3 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: "clamp(1.8rem, 3vw, 2.5rem)", fontStyle: "italic", lineHeight: 1.1, marginBottom: 16, letterSpacing: "-0.02em" }}>
                                    {salon.name}<span style={{ color: "#C3D809" }}>.</span>
                                </h3>
                                <p style={{ color: "rgba(245,242,236,0.45)", lineHeight: 1.8, fontSize: "0.9rem" }}>
                                    تجربة استثنائية تجمع بين الفن العريق والأسلوب المعاصر.
                                </p>
                            </div>

                            {/* Contact */}
                            <div>
                                <h4 style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.55rem", letterSpacing: "0.35em", color: "#C3D809", marginBottom: 24, textTransform: "uppercase" }}>تواصل معنا</h4>
                                <div className="space-y-5" style={{ color: "rgba(245,242,236,0.7)", fontSize: "0.9rem" }}>
                                    <a href={`tel:${salon.phone}`} className="flex items-center gap-3 hover:text-[#C3D809] transition-colors duration-400">
                                        <Phone size={13} className="opacity-50 shrink-0" />
                                        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.85rem" }}>{salon.phone || "0785295125"}</span>
                                    </a>
                                    <div className="flex items-center gap-3 hover:text-[#C3D809] transition-colors duration-400 cursor-pointer">
                                        <MapPin size={13} className="opacity-50 shrink-0" />
                                        <span>{salon.address || "عمان، الأردن"}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Social */}
                            <div>
                                <h4 style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.55rem", letterSpacing: "0.35em", color: "#C3D809", marginBottom: 24, textTransform: "uppercase" }}>تابعنا</h4>
                                <div className="flex gap-3">
                                    {[<Instagram size={18} />, <span className="text-sm font-black">X</span>].map((icon, i) => (
                                        <a key={i} href="#" className="w-10 h-10 rounded-full flex items-center justify-center border border-white/10 text-white/40 hover:border-[#C3D809] hover:text-[#C3D809] transition-all duration-500">
                                            {icon}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Bottom Bar */}
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-7 border-t border-white/[0.04]">
                            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.5rem", color: "rgba(245,242,236,0.2)", letterSpacing: "0.15em", textAlign: "center" }}>
                                © {new Date().getFullYear()} {salon.name.toUpperCase()}
                            </span>
                            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
                                    style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.5rem", letterSpacing: "0.25em", color: "rgba(245,242,236,0.2)", textTransform: "uppercase" }}
                                    className="hover:text-[#C3D809] transition-colors duration-500">
                                ↑ أعلى
                            </button>
                        </div>
                    </div>
                </footer>
            </main>

            {/* ═══ MOBILE STICKY BOTTOM BAR ═══ */}
            <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
                style={{ background: "rgba(10,10,10,0.97)", backdropFilter: "blur(20px)", borderTop: "1px solid var(--border-subtle)", padding: "12px 16px", paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
                <button onClick={() => setIsBookingOpen(true)}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl font-bold"
                    style={{ background: "#C3D809", color: "#0A0A0A", fontFamily: "'Noto Sans Arabic', sans-serif", fontWeight: 800, fontSize: "1rem", padding: "14px 20px" }}>
                    <Calendar size={18} />
                    احجز موعدك الآن
                </button>
            </div>



            {/* ═══ BOOKING MODAL ═══ */}
            <BookingModal
                isOpen={isBookingOpen} onClose={() => setIsBookingOpen(false)} salon={salon}
                services={services} employees={employees} step={step} setStep={setStep}
                sel={sel} setSel={setSel} dates={dates} bookedSlots={bookedSlots}
                fetchBooked={fetchBooked} genTimes={genTimes} totalPrice={totalPrice}
                totalDur={totalDur} selSrvs={selSrvs} submitting={submitting}
                error={error} submitBooking={submitBooking} toggleSrv={toggleSrv}
            />

            <style jsx global>{`
                .hide-scroll::-webkit-scrollbar { display: none; }
                .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
                @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(50%); } }
                .animate-marquee { animation: marquee 40s linear infinite; }
                .animate-marquee-slow { animation: marquee 80s linear infinite; }
                .animate-marquee:hover, .animate-marquee-slow:hover { animation-play-state: paused; }
                @media (prefers-reduced-motion: reduce) {
                    .animate-marquee, .animate-marquee-slow { animation: none; }
                }
                /* Mobile bottom bar space */
                @media (max-width: 767px) {
                    main { padding-bottom: 80px; }
                }
                /* Prevent text overflow on all screens */
                h1, h2, h3, h4 { overflow-wrap: break-word; word-break: break-word; }
            `}</style>
        </div>
    );
}

export default function BookingPage() {
    return <Suspense fallback={<div className="min-h-screen" style={{ background: "#0A0A0A" }} />}><BookingContent /></Suspense>;
}
