"use client";

import { useEffect, useState, useCallback, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence, useInView } from "framer-motion";
import axios from "axios";
import { assetUrl } from "@/lib/assets";
import {
    Scissors, Calendar, Clock, UserCircle, X, ArrowRight, ArrowLeft, Plus, Sparkles, Star,
    ChevronDown, MapPin, Phone, Instagram, AlertCircle, Check, CheckCircle2, Facebook
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
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
    const [activeServiceIndex, setActiveServiceIndex] = useState(0);
    const [activeReviewIndex, setActiveReviewIndex] = useState(0);
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
                if (d.work_hours) {
                    setWorkHours({
                        start: d.work_hours.start || "09:00",
                        end: d.work_hours.end || "22:00",
                        interval: parseInt(d.work_hours.interval) || 30
                    });
                }
                if (d.off_days) {
                    setOffDays(Array.isArray(d.off_days) ? d.off_days.map(Number) : []);
                }
                if (d.booking_days) {
                    setBookingDays(parseInt(d.booking_days) || 7);
                }
                if (d.salon?.is_booking_active === 0 || d.salon?.is_booking_active === "0") setNoBookingPage(true);
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

    const resolveMediaUrl = useCallback((path?: string | null) => assetUrl(path) || path || "", []);

    /* ─── Helpers ─── */
    const formatOpenDays = useCallback(() => {
        if (offDays.length === 0) return "طوال أيام الأسبوع";
        if (offDays.length === 7) return "مغلق مؤقتاً";

        const openIndices = Array.from({ length: 7 }, (_, i) => i).filter(i => !offDays.includes(i));
        if (openIndices.length === 0) return "مغلق";

        const groups: number[][] = [];
        let cur: number[] = [];
        for (let i = 0; i < openIndices.length; i++) {
            if (cur.length === 0 || openIndices[i] === cur[cur.length - 1] + 1) {
                cur.push(openIndices[i]);
            } else {
                groups.push(cur);
                cur = [openIndices[i]];
            }
        }
        if (cur.length > 0) groups.push(cur);

        // Handle wrap-around (e.g., Saturday and Sunday)
        if (groups.length > 1 && groups[0][0] === 0 && groups[groups.length - 1][groups[groups.length - 1].length - 1] === 6) {
            const last = groups.pop()!;
            groups[0] = [...last, ...groups[0]];
        }

        return groups.map(g => {
            if (g.length === 1) return dayNames[g[0]];
            if (g.length === 2) return `${dayNames[g[0]]} ، ${dayNames[g[1]]}`;
            return `${dayNames[g[0]]} - ${dayNames[g[g.length - 1]]}`;
        }).join(" ، ");
    }, [offDays]);

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

    const mockGallery = salon.gallery?.length ? salon.gallery.map((g: any) => {
        if (typeof g === "string") return { type: "image", url: resolveMediaUrl(g) };
        return {
            type: g.type || g.file_type || "image",
            url: resolveMediaUrl(g.url || g.file_path),
        };
    }) : [
        { type: "video", url: "https://assets.mixkit.co/videos/preview/mixkit-barber-trimming-a-beard-with-a-razor-4148-large.mp4" },
        { type: "image", url: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?q=80&w=1200" },
        { type: "video", url: "https://assets.mixkit.co/videos/preview/mixkit-stylist-combing-hair-of-a-customer-4147-large.mp4" },
        { type: "image", url: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?q=80&w=1200" },
        { type: "image", url: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=1200" },
        { type: "image", url: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=1200" },
    ];
    const legacyStaticServiceCards = [
        { name: "حلاقة الشعر", en: "HAIR", img: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?q=80&w=600" },
        { name: "تلوين الشعر", en: "COLOR", img: "https://images.unsplash.com/photo-1560869713-7d0a29430803?q=80&w=600" },
        { name: "العناية الكيميائية", en: "CHEMICAL", img: "https://images.unsplash.com/photo-1622288432450-277d0fef5ed6?q=80&w=600" },
        { name: "علاجات الشعر", en: "TREATMENT", img: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=600" },
        { name: "خدمات التجميل", en: "AESTHETICS", img: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=600" },
    ];
    const serviceCards = services.length
        ? services.map((service, index) => ({
            id: service.id,
            name: service.name,
            en: `SERVICE-${index + 1}`,
            img: resolveMediaUrl(service.image),
            video: resolveMediaUrl(service.video) || null,
            fallbackImg: legacyStaticServiceCards[index % legacyStaticServiceCards.length]?.img,
            price: service.price,
            duration: service.duration_minutes,
        }))
        : legacyStaticServiceCards.map((card, index) => ({
            id: index + 1,
            name: card.name,
            en: card.en,
            img: card.img,
            video: null,
            fallbackImg: card.img,
            price: "0",
            duration: null,
        }));
    const activeServiceCard = serviceCards[Math.min(activeServiceIndex, Math.max(serviceCards.length - 1, 0))];
    const gallerySplitIndex = Math.ceil(mockGallery.length / 2);
    const galleryRowOneSource = mockGallery.slice(0, gallerySplitIndex);
    const galleryRowTwoSource = mockGallery.slice(gallerySplitIndex);
    const galleryRowOne = [...(galleryRowOneSource.length ? galleryRowOneSource : mockGallery), ...(galleryRowOneSource.length ? galleryRowOneSource : mockGallery)];
    const galleryRowTwoBase = galleryRowTwoSource.length ? galleryRowTwoSource : mockGallery;
    const galleryRowTwo = [...galleryRowTwoBase, ...galleryRowTwoBase];
    const renderGalleryCard = (
        item: { type: string; url: string },
        key: string,
        widthClass: string,
        aspectRatio: string
    ) => (
        <div
            key={key}
            className={`shrink-0 ${widthClass} overflow-hidden group rounded-[1.5rem] sm:rounded-[2rem] bg-white/5 border border-white/[0.03] relative`}
            style={{ aspectRatio }}
            onMouseEnter={(e) => { const v = e.currentTarget.querySelector("video"); if (v) v.play(); }}
            onMouseLeave={(e) => { const v = e.currentTarget.querySelector("video"); if (v) { v.pause(); v.currentTime = 0; } }}
        >
            {item.type === "video" ? (
                <video
                    src={item.url}
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover grayscale transition-all duration-[1.2s] group-hover:grayscale-0 group-hover:scale-105"
                />
            ) : (
                <img
                    src={item.url}
                    className="w-full h-full object-cover grayscale transition-all duration-[1.2s] group-hover:grayscale-0 group-hover:scale-105"
                    alt=""
                />
            )}
            <div className="absolute inset-0 bg-black/20 group-hover:opacity-0 transition-opacity duration-700 pointer-events-none" />
            {item.type === "video" && (
                <div className="absolute top-6 right-6 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 group-hover:scale-0 transition-transform duration-500">
                    <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[8px] border-l-white border-b-[5px] border-b-transparent translate-x-0.5" />
                </div>
            )}
        </div>
    );
    const mockReviews = salon.reviews?.length ? salon.reviews : [
        { id: 1, customer_name: "أحمد العبدالله", rating: 5, comment: "خدمة احترافية جداً، الحلاق فهم قصة الشعر اللي أريدها بالضبط." },
        { id: 2, customer_name: "محمد خالد", rating: 5, comment: "المكان راقي جداً والتعامل ممتاز. أنصح بتجربة قسم العناية بالبشرة." },
        { id: 3, customer_name: "سالم المري", rating: 5, comment: "تجربة رائعة وتطبيق الحجز سهل جداً. السعر مناسب مقابل الجودة." },
    ];
    const currentReview = mockReviews[Math.min(activeReviewIndex, Math.max(mockReviews.length - 1, 0))];
    const mockFaqs = salon.faqs?.length ? salon.faqs : [
        { id: 1, question: "هل يتوفر مواقف سيارات؟", answer: "نعم، نوفر مواقف مجانية لعملائنا أمام الصالون مباشرة." },
        { id: 2, question: "هل يمكن إلغاء أو تعديل الموعد؟", answer: "بالطبع، تواصل معنا قبل ساعتين على الأقل من موعدك." },
        { id: 3, question: "ما هي طرق الدفع المتاحة؟", answer: "نوفر الدفع نقداً وعبر البطاقات الائتمانية وبطاقات مدى." },
    ];

    const staticServiceCards = [
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
            <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700;1,900&family=Noto+Sans+Arabic:wght@100;400;700;900&family=Tajawal:wght@400;500;700;800;900&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />

            {/* ═══ HEADER (Solv Style) ═══ */}
            <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-700 border-b border-transparent" style={{
                padding: scrolled ? "12px 24px" : "24px 24px",
                background: scrolled ? "rgba(5,5,5,0.85)" : "transparent",
                backdropFilter: scrolled ? "blur(24px)" : "none",
            }}>
                <div className="max-w-[1500px] mx-auto grid grid-cols-3 items-center">
                    {/* Left: Nav */}
                    <nav className="hidden lg:flex items-center gap-2">
                        {[{ name: "الخدمات", id: "services" }, { name: "الاشتراكات", id: "membership" }, { name: "المنتجات", id: "products" }].map(item => (
                            <a key={item.id} href={`#${item.id}`} className="px-5 py-2 rounded-full text-[13px] font-bold text-white/70 hover:text-white hover:bg-white/5 transition-all">
                                {item.name}
                            </a>
                        ))}
                    </nav>

                    {/* Center: Logo */}
                    <div className="flex justify-center">
                        <a href={`/book?s=${slug}`} className="flex items-center gap-3 transition-transform hover:scale-105">
                            <div className="w-8 h-8 rounded-lg overflow-hidden bg-[#C3D809] flex items-center justify-center border border-white/10 shadow-[0_4px_18px_rgba(195,216,9,0.22)]">
                                {salon.logo ? (
                                    <img
                                        src={salon.logo}
                                        alt={salon.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <Scissors size={18} className="text-black" />
                                )}
                            </div>
                            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.5rem", fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.04em", color: "#F5F2EC" }}>
                                {salon.name}
                            </span>
                        </a>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex justify-end items-center gap-4">

                        <button 
                            onClick={() => setIsBookingOpen(true)}
                            className="px-6 py-2.5 rounded-full bg-white text-black text-[13px] font-black hover:bg-[#C3D809] transition-all"
                        >
                            احجز الآن
                        </button>
                        <button className="flex flex-col gap-1 px-3 py-2 rounded-full border border-white/10 bg-white/5 group">
                            <div className="w-4 h-[1.5px] bg-white group-hover:bg-[#C3D809] transition-colors" />
                            <div className="w-2.5 h-[1.5px] bg-white group-hover:bg-[#C3D809] transition-colors" />
                        </button>
                    </div>
                </div>
            </header>

            <main>
                {/* ═══ SALON & CO. MINIMAL SPLIT HERO ═══ */}
                <section className="relative min-h-[100svh] flex flex-col bg-[#050505] overflow-hidden">
                    
                    {/* Left Sub-Section (Image goes left in RTL context) */}
                    <div className="absolute inset-y-0 left-0 w-full lg:w-[60%] z-0 h-full overflow-hidden">
                        {/* Make the image fade out entirely towards the right edge so it blends into the solid black text background */}
                        <div className="absolute inset-0 z-10 pointer-events-none hidden lg:block" style={{ background: "linear-gradient(to right, transparent 0%, transparent 40%, #050505 100%)" }} />
                        
                        {/* Mobile Gradient (Fades bottom up to let text sitting on top read clearly) */}
                        <div className="absolute inset-0 z-10 pointer-events-none lg:hidden" style={{ background: "linear-gradient(to top, #050505 0%, #050505 40%, transparent 100%)" }} />

                        {/* Slight bottom dark gradient to blend with the rest of the page globally */}
                        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#050505] to-transparent z-10 pointer-events-none" />
                        
                        {salon.hero_type === "video" && resolveMediaUrl(salon.hero_video) ? (
                            <video
                                src={resolveMediaUrl(salon.hero_video)}
                                className="w-full h-full object-cover grayscale brightness-[60%] lg:brightness-75 object-center"
                                autoPlay
                                muted
                                loop
                                playsInline
                            />
                        ) : (
                            <img
                                src={resolveMediaUrl(salon.hero_image) || "/images/salon_hero.png"}
                                className="w-full h-full object-cover grayscale brightness-[60%] lg:brightness-75 object-center"
                                alt="Hero Background"
                            />
                        )}
                    </div>

                    {/* Content Container */}
                    <div className="relative z-20 w-full max-w-[1500px] mx-auto grid grid-cols-1 lg:grid-cols-2 px-6 sm:px-12 lg:px-16 xl:px-24 pt-[15vh] pb-8 lg:pt-24 lg:pb-16 my-auto">
                        
                        {/* Right Sub-Section: Text Content */}
                        <div className="flex flex-col justify-end lg:justify-center text-right lg:pl-12 xl:pl-20 w-full">
                            
                            {/* Top Subtitle Component */}
                            <motion.div 
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8 }}
                                className="flex items-center gap-4 mb-4 lg:mb-5"
                            >
                                <div className="w-8 md:w-12 h-[1px] bg-[#C3D809]" />
                                <span className="text-[#C3D809] text-[9px] md:text-[10px] font-bold tracking-widest uppercase" style={{ fontFamily: "'Space Mono', monospace" }}>
                                    {salon.hero_subtitle || "تأسس ٢٠٢٤ -- صالون فاخر"}
                                </span>
                            </motion.div>

                            {/* Massive Typography */}
                            {(() => {
                                const fullTitle = salon.hero_title || "أين يلتقي الإبــــداع بالأناقة";
                                const words = fullTitle.trim().split(/\s+/);
                                let line1 = "", line2 = "", line3 = "";

                                if (words.length <= 3) {
                                    line1 = words[0] || "";
                                    line2 = words[1] || "";
                                    line3 = words[2] || "";
                                } else if (words.length === 4) {
                                    line1 = words.slice(0, 2).join(" ");
                                    line2 = words[2];
                                    line3 = words[3];
                                } else {
                                    const count = words.length;
                                    const cut1 = Math.ceil(count / 3);
                                    const cut2 = Math.ceil((count * 2) / 3);
                                    line1 = words.slice(0, cut1).join(" ");
                                    line2 = words.slice(cut1, cut2).join(" ");
                                    line3 = words.slice(cut2).join(" ");
                                }

                                return (
                                    <motion.h1 
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.8, delay: 0.2 }}
                                        className="text-white font-black leading-[1.25] mb-6 lg:mb-8 flex flex-col items-start gap-1"
                                    >
                                        {line1 && <span className="text-[clamp(2.2rem,4.5vw,4.5rem)]" style={{ fontFamily: "'Noto Sans Arabic', sans-serif" }}>{line1}</span>}
                                        {line2 && <span className="text-[clamp(2.7rem,5vw,5.5rem)]" style={{ fontFamily: "'Noto Sans Arabic', sans-serif" }}>{line2}</span>}
                                        {line3 && <span className="text-[clamp(2.2rem,4.5vw,4.5rem)] text-transparent" style={{ fontFamily: "'Noto Sans Arabic', sans-serif", WebkitTextStroke: "1px rgba(255,255,255,0.6)" }}>{line3}</span>}
                                    </motion.h1>
                                );
                            })()}

                            {/* Minimal Paragraph */}
                            <motion.p 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.4 }}
                                className="text-white/70 text-[13px] md:text-[14px] lg:text-[15px] xl:text-base max-w-[320px] sm:max-w-md lg:max-w-xl xl:max-w-2xl whitespace-pre-line leading-[1.7] lg:leading-[1.8] mb-8 lg:mb-10 font-medium"
                                style={{ fontFamily: "'Noto Sans Arabic', sans-serif" }}
                            >
                                {salon.description || "ادخل إلى عالم يروي فيه كل مظهر قصة. يجمع خبراء الشايب بين التقنيات الأصيلة والفن الحديث لخلق مظهرك الفريد، بأسلوب يعكس شخصيتك ويرتقي بتجربتك."}
                            </motion.p>

                            {/* Sharp Minimal Buttons */}
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.6 }}
                                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-10"
                            >
                                {/* Brand Colored Button (Sharp Edges!) */}
                                <button 
                                    onClick={() => setIsBookingOpen(true)}
                                    className="bg-[#C3D809] hover:bg-white text-black transition-colors duration-300 font-bold uppercase tracking-widest text-[11px] md:text-xs px-8 py-4 lg:py-4 flex items-center justify-between sm:justify-start gap-3 sm:gap-4 w-full sm:w-auto overflow-hidden group"
                                    style={{ fontFamily: "'Noto Sans Arabic', sans-serif" }}
                                >
                                    <span>احجز موعدك الآن</span>
                                    <ArrowLeft className="w-4 h-4 sm:w-3 sm:h-3 group-hover:-translate-x-1 transition-transform" />
                                </button>

                                {/* Text Link with Arrow */}
                                <a 
                                    href="#services"
                                    className="text-white/60 hover:text-white uppercase font-bold tracking-widest text-[11px] md:text-xs flex items-center justify-between sm:justify-start gap-3 transition-colors group px-4 py-3 border border-white/10 sm:border-transparent sm:px-0 sm:py-0"
                                    style={{ fontFamily: "'Noto Sans Arabic', sans-serif" }}
                                >
                                    <span>استكشف الخدمات</span>
                                    <ArrowLeft className="w-4 h-4 sm:w-3 sm:h-3 group-hover:-translate-x-2 transition-transform opacity-60 group-hover:opacity-100" />
                                </a>
                            </motion.div>

                        </div>

                        {/* Empty Column (Takes up the Left side in RTL grid-cols-2, allowing absolute image below to show) */}
                        <div className="hidden lg:block pointer-events-none" />

                    </div>
                </section>

                {/* ═══ SERVICES TICKER ═══ */}
                <div className="w-full bg-[#050505] border-t border-b border-white/5 py-5 overflow-hidden flex whitespace-nowrap z-20 relative pointer-events-none" dir="ltr">
                    <motion.div 
                        animate={{ x: ["0%", "-50%"] }} 
                        transition={{ repeat: Infinity, ease: "linear", duration: 40 }}
                        className="flex items-center w-max"
                    >
                        {/* 2 continuous sets for perfect infinite scrolling loop */}
                        {[...Array(2)].map((_, i) => (
                            <div key={i} className="flex items-center pr-8 lg:pr-16">
                                {[
                                    "قصات دقيقة",
                                    "تلوين وميش الشعر",
                                    "تصفيف الشعر",
                                    "تسريحات المناسبات",
                                    "التجديد العميق",
                                    "العناية باللحية",
                                    "تنظيف البشرة",
                                    "مساج استرخائي"
                                ].map((service, j) => (
                                    <div key={j} className="flex items-center gap-8 lg:gap-16 pr-8 lg:pr-16">
                                        <span className="text-white/60 text-[13px] md:text-[15px] font-bold" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                                            {service}
                                        </span>
                                        <span className="text-[#C3D809]/60 text-[10px] md:text-xs">•</span>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </motion.div>
                </div>

                {/* ═══ ABOUT (Reference Style) ═══ */}
                <section id="about" className="py-24 sm:py-32 lg:py-48 px-6 lg:px-12 relative overflow-hidden" style={{ background: "#050505", color: "#F5F2EC" }}>


                    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center relative z-10">
                        
                        {/* Text Content (Right side in RTL context -> First in DOM) */}
                        <motion.div 
                            initial={{ opacity: 0, y: 30 }} 
                            whileInView={{ opacity: 1, y: 0 }} 
                            viewport={{ once: true }} 
                            transition={{ duration: 0.8 }} 
                            className="w-full space-y-10"
                        >
                            <div className="space-y-6 lg:space-y-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-[1px] bg-[#C3D809]" />
                                    <span className="text-[#C3D809] text-[10px] md:text-[11px] font-bold tracking-widest uppercase opacity-90" style={{ fontFamily: "'Space Mono', monospace" }}>
                                        {salon.about_subtitle || "قصتنا وقيمنا"}
                                    </span>
                                </div>
                                
                                <h2 className="text-white font-black leading-[1.05] tracking-tight text-[clamp(2.5rem,5vw,5rem)]" style={{ fontFamily: "'Noto Sans Arabic', sans-serif" }}>
                                    {salon.about_title || "أكثر من مجرد صالون"}
                                </h2>
                            </div>

                             <div className="space-y-6 text-white/50 text-sm md:text-[15px] leading-[2] lg:leading-[2.2] max-w-xl font-medium" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                                <p>
                                    {salon.about_description || "تأسس صالون الشايب في قلب المدينة من شغف حقيقي بالحرفة. نحن نؤمن بأن كل عميل يستحق عناية تفوق المعايير التقليدية. نحن المكان الذي يسود فيه الهدوء والذي يلعب فيه كل تفصيل دوراً مهماً في الارتقاء بمظهرك."}
                                </p>
                            </div>

                            <div className="w-full max-w-xl h-[1px] bg-white/5 my-10" />

                            <div className="grid grid-cols-3 gap-6 sm:gap-10 pt-4">
                                {[
                                    { n: "7+", label: "سنوات خبرة" },
                                    { n: "15K+", label: "عميل راضٍ" },
                                    { n: "6", label: "خبراء مظهر" }
                                ].map((stat, i) => (
                                    <div key={i} className="space-y-4">
                                        <h4 className="text-[#C3D809] font-black text-4xl lg:text-5xl tracking-tighter" style={{ fontFamily: "'Playfair Display', 'Oswald', sans-serif" }}>
                                            {stat.n}
                                        </h4>
                                        <p className="text-white/40 text-[10px] sm:text-[11px] font-bold leading-[1.6]" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                                            {stat.label.split(' ').map((word, wIdx) => <span key={wIdx} className="block">{word}</span>)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Image Composition (Left side in RTL context -> Second in DOM) */}
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }} 
                            whileInView={{ opacity: 1, scale: 1 }} 
                            viewport={{ once: true }} 
                            transition={{ duration: 1 }} 
                            className="relative w-full aspect-[4/5] mx-auto max-w-lg lg:max-w-none lg:h-[800px]"
                        >
                            {/* Main Background Image - Anchored Top-Right */}
                            <div className="absolute top-0 right-0 w-[80%] h-[75%] lg:h-[80%] overflow-hidden bg-[#111]">
                                <img src={resolveMediaUrl(salon.about_image_1) || "/images/barber_action.png"} alt="Salon Vibe" className="w-full h-full object-cover grayscale opacity-60 hover:opacity-80 transition-opacity duration-700 mix-blend-lighten" loading="lazy" />
                            </div>
                            
                            {/* Overlay Image - Anchored Bottom-Left */}
                            <motion.div 
                                initial={{ x: -20, opacity: 0 }} 
                                whileInView={{ x: 0, opacity: 1 }} 
                                viewport={{ once: true }} 
                                transition={{ duration: 0.8, delay: 0.3 }} 
                                className="absolute bottom-0 left-0 w-[60%] h-[50%] lg:h-[55%] border-[12px] sm:border-[16px] border-[#050505] overflow-hidden bg-[#111]"
                            >
                                <img src={resolveMediaUrl(salon.about_image_2) || "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?q=80&w=600"} alt="Master Barber" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" loading="lazy" />
                            </motion.div>
                        </motion.div>

                    </div>
                </section>

                {/* ═══ SERVICES (Minimalist Layout) ═══ */}
                <section id="services" className="relative overflow-hidden bg-[#0A0A0A] py-24 sm:py-32 lg:py-56 px-6 lg:px-12">
                    
                    <div className="relative max-w-7xl mx-auto">
                        
                        {/* Improved Header */}
                        <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-10 lg:gap-20 border-b border-white/[0.05] pb-12 mb-16 sm:mb-20 lg:mb-24">
                            <div className="space-y-6 lg:space-y-8">
                                <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex items-center gap-4">
                                    <div className="w-10 h-[1px] bg-[#C3D809]" />
                                    <span className="text-[#C3D809] text-[10px] sm:text-[11px] font-bold tracking-widest uppercase opacity-90" style={{ fontFamily: "'Space Mono', 'Tajawal', monospace" }}>
                                        {salon.services_subtitle || "خدمات الصالون"}
                                    </span>
                                </motion.div>
                                <motion.h2 initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="text-white font-black leading-[1.05] tracking-tighter text-[clamp(2.5rem,5vw,5.5rem)]" style={{ fontFamily: "'Noto Sans Arabic', sans-serif" }}>
                                    {salon.services_title || "قائمة الخدمات"}
                                </motion.h2>
                            </div>
                            <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="max-w-xl text-right lg:pb-4">
                                <p className="text-white/50 text-sm md:text-[15px] leading-[2.2] font-medium" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                                    {salon.services_description || "اختر الخدمة، شاهد لمحة فورية، ثم احجز بضغطة واحدة. تصميم واضح لتجربة راقية وعناية دقيقة تليق بك."}
                                </p>
                            </motion.div>
                        </div>

                        <div className="grid lg:grid-cols-[minmax(0,1fr)_450px] gap-16 lg:gap-24 items-start">
                            
                            {/* list of services - Accordion typographic style */}
                            <div className="flex flex-col">
                                {serviceCards.map((s, i) => {
                                    const isActive = activeServiceIndex === i;
                                    return (
                                        <motion.button
                                            type="button"
                                            key={s.name}
                                            initial={{ opacity: 0, x: -15 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: i * 0.08, duration: 0.6, ease: "easeOut" }}
                                            className={[
                                                "group relative w-full text-right overflow-hidden border-b border-white/[0.05] py-7 sm:py-9 transition-colors outline-none",
                                                isActive ? "opacity-100" : "opacity-40 hover:opacity-100",
                                            ].join(" ")}
                                            onClick={() => setIsBookingOpen(true)}
                                            onMouseEnter={() => setActiveServiceIndex(i)}
                                            onFocus={() => setActiveServiceIndex(i)}
                                            aria-label={`احجز خدمة ${s.name}`}
                                        >
                                            <div className="flex flex-row items-center justify-between gap-6">
                                                <div className="flex flex-row items-center gap-5 sm:gap-8 lg:gap-12">
                                                    
                                                    {/* Index Number */}
                                                    <div className={[
                                                        "text-[0.8rem] sm:text-[0.95rem] font-medium tracking-[0.2em] transition-colors font-mono min-w-[2rem]",
                                                        isActive ? "text-[#C3D809]" : "text-white/30",
                                                    ].join(" ")}>
                                                        {String(i + 1).padStart(2, "0")}
                                                    </div>

                                                    {/* Name & Expanded Body */}
                                                    <div className="flex flex-col justify-center">
                                                        <h3 className={[
                                                            "font-black tracking-tight transition-all duration-500",
                                                            "text-3xl sm:text-4xl lg:text-5xl",
                                                            isActive ? "text-white" : "text-white/80 group-hover:text-white",
                                                        ].join(" ")}
                                                            style={{ fontFamily: "'Noto Sans Arabic', sans-serif" }}>
                                                            <span className={isActive ? "text-[#C3D809] italic transition-colors duration-500" : ""}>{s.name}</span>
                                                        </h3>
                                                        <div className={`overflow-hidden transition-all duration-500 ${isActive ? "max-h-20 opacity-100 mt-4" : "max-h-0 opacity-0 mt-0"}`}>
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-[1px] w-6 bg-[#C3D809]" />
                                                                <span className="text-[0.65rem] sm:text-[0.75rem] tracking-[0.05em] text-white/50" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                                                                    عناية دقيقة بأدوات احترافية
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Arrow */}
                                                <div className="flex items-center justify-center shrink-0">
                                                    <ArrowRight size={24} strokeWidth={isActive ? 2.5 : 1.5} className={[
                                                        "-rotate-180 transition-all duration-500",
                                                        isActive ? "text-[#C3D809] translate-x-2" : "text-white/20 group-hover:text-white/50 scale-90",
                                                    ].join(" ")} />
                                                </div>
                                            </div>
                                        </motion.button>
                                    );
                                })}
                            </div>

                            {/* preview sticky framed image */}
                            <div className="lg:sticky lg:top-32 mt-10 lg:mt-0">
                                <div className="relative">
                                    <div className="relative overflow-hidden rounded-[2rem] border border-white/[0.05] bg-[#050505] p-2.5 sm:p-3 shadow-2xl">
                                        <div className="relative aspect-[3/4] sm:aspect-[4/5] lg:aspect-[3/4] overflow-hidden rounded-[1.5rem]">
                                            <AnimatePresence mode="wait">
                                                {activeServiceCard?.video ? (
                                                    <motion.video
                                                        key={activeServiceCard.video}
                                                        src={activeServiceCard.video}
                                                        className="absolute inset-0 w-full h-full object-cover opacity-75"
                                                        autoPlay
                                                        muted
                                                        loop
                                                        playsInline
                                                        initial={{ opacity: 0, scale: 1.05 }}
                                                        animate={{ opacity: 0.75, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.95 }}
                                                        transition={{ duration: 0.5, ease: "easeOut" }}
                                                    />
                                                ) : (
                                                    <motion.img
                                                        key={activeServiceCard?.img || activeServiceCard?.fallbackImg}
                                                        src={activeServiceCard?.img || activeServiceCard?.fallbackImg}
                                                        alt={activeServiceCard?.name}
                                                        className="absolute inset-0 w-full h-full object-cover grayscale opacity-70"
                                                        initial={{ opacity: 0, scale: 1.05 }}
                                                        animate={{ opacity: 0.7, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.95 }}
                                                        transition={{ duration: 0.5, ease: "easeOut" }}
                                                    />
                                                )}
                                            </AnimatePresence>

                                            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/20 to-transparent" />
                                            
                                            {/* Preview Tag */}
                                            <div className="absolute top-5 right-5 flex items-center gap-2 rounded-full border border-white/10 bg-[#050505]/60 px-3 py-1.5 text-[0.65rem] font-bold tracking-[0.07em] text-white/80 backdrop-blur-md"
                                                style={{ fontFamily: "'Noto Sans Arabic', sans-serif" }}>
                                                معاينة الحجز
                                                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#C3D809] shadow-[0_0_10px_rgba(195,216,9,0.8)]" />
                                            </div>

                                            {/* Content Footer */}
                                            <div className="absolute bottom-0 left-0 right-0 p-7 sm:p-8">
                                                <p className="mb-2 text-[0.7rem] font-bold tracking-[0.08em] text-[#C3D809]/80 uppercase"
                                                    style={{ fontFamily: "'Noto Sans Arabic', sans-serif" }}>
                                                    خدمة مختارة
                                                </p>
                                                <h3 className="text-3xl sm:text-4xl font-black leading-none text-white mb-6" style={{ fontFamily: "'Noto Sans Arabic', sans-serif" }}>
                                                    {activeServiceCard?.name}
                                                </h3>
                                                {(activeServiceCard?.price || activeServiceCard?.duration) && (
                                                    <p className="mb-6 text-sm text-white/60 flex items-center gap-4">
                                                        {activeServiceCard?.price && <span>{Number(activeServiceCard.price).toFixed(2)} د.أ</span>}
                                                        {activeServiceCard?.duration && <span>{activeServiceCard.duration} دقيقة</span>}
                                                    </p>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => setIsBookingOpen(true)}
                                                    className="inline-flex w-full justify-center items-center gap-3 rounded-full border border-white/10 bg-white/5 px-6 py-4 text-sm font-bold text-white transition-all hover:bg-[#C3D809] hover:text-[#050505] hover:border-[#C3D809]"
                                                    style={{ fontFamily: "'Noto Sans Arabic', sans-serif" }}
                                                >
                                                    احجز الخدمة الآن
                                                    <ArrowRight size={18} className="-rotate-180" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* thumbnails (minimal squares below) */}
                                    <div className="mt-4 grid grid-cols-5 gap-2 sm:gap-3 px-1">
                                        {serviceCards.map((s, i) => {
                                            const isActive = activeServiceIndex === i;
                                            return (
                                                <button
                                                    key={`thumb-${s.en}`}
                                                    type="button"
                                                    className={[
                                                        "relative overflow-hidden rounded-xl sm:rounded-2xl transition-all focus:outline-none",
                                                        isActive ? "border-[1.5px] border-[#C3D809]" : "border-[1px] border-white/10 hover:border-white/30",
                                                    ].join(" ")}
                                                    style={{ aspectRatio: "1 / 1" }}
                                                    onClick={() => setActiveServiceIndex(i)}
                                                    aria-label={`عرض ${s.name}`}
                                                >
                                                    {s.img ? (
                                                        <img src={s.img} alt="" className="absolute inset-0 h-full w-full object-cover grayscale opacity-50" />
                                                    ) : s.video ? (
                                                        <video src={s.video} className="absolute inset-0 h-full w-full object-cover grayscale opacity-50" muted playsInline />
                                                    ) : (
                                                        <img src={s.fallbackImg} alt="" className="absolute inset-0 h-full w-full object-cover grayscale opacity-50" />
                                                    )}
                                                    <div className={["absolute inset-0 transition-opacity bg-black", isActive ? "opacity-0" : "opacity-40"].join(" ")} />
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ═══ TEAM ═══ */}
                {employees.length > 0 && (
                    <section id="team" className="py-24 sm:py-32 lg:py-48 px-6 lg:px-12" style={{ background: "#050505" }}>
                        <div className="max-w-[1400px] mx-auto">
                            <div className="flex flex-col items-center text-center">
                                <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex items-center justify-center gap-4 mb-3 sm:mb-4">
                                    <div className="w-8 sm:w-10 h-[1px] bg-white/20" />
                                    <span className="text-[#C3D809] text-[10px] sm:text-[11px] uppercase font-bold tracking-widest opacity-80" style={{ fontFamily: "'Space Mono', 'Tajawal', monospace" }}>
                                        {salon.team_subtitle || "نخبة الخبراء"}
                                    </span>
                                    <div className="w-8 sm:w-10 h-[1px] bg-white/20" />
                                </motion.div>

                                <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-14 sm:mb-24">
                                    <h2 className="text-white text-3xl sm:text-5xl lg:text-6xl font-black tracking-tighter" style={{ fontFamily: "'Noto Sans Arabic', sans-serif" }}>
                                        {salon.team_title || "فريقنا من المبدعين"}
                                    </h2>
                                    {salon.team_description && (
                                        <p className="mt-6 max-w-2xl text-white/45 text-sm sm:text-base leading-8">
                                            {salon.team_description}
                                        </p>
                                    )}
                                </motion.div>
                            </div>
                            
                            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-10 lg:gap-16">
                                {employees.map((emp, i) => (
                                    <motion.div key={emp.id} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.8 }} className="group relative">
                                        <div className="relative overflow-hidden aspect-[3/4] rounded-[1.5rem] sm:rounded-[2rem] bg-white/5 border border-white/[0.03]">
                                            <img src={emp.avatar ? assetUrl(emp.avatar)! : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600"}
                                                className="absolute inset-0 w-full h-full object-cover transition-all duration-[1.2s] grayscale group-hover:grayscale-0 group-hover:scale-110" alt={emp.name} />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-60 transition-opacity duration-700 group-hover:opacity-30" />
                                            <div className="absolute inset-0 border-[0.5px] border-white/0 group-hover:border-white/10 transition-all duration-700 m-3 sm:m-4 rounded-[1.25rem] sm:rounded-[1.5rem] pointer-events-none" />
                                        </div>
                                        <div className="mt-8 px-4">
                                            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.6rem", letterSpacing: "0.2em", color: "#C3D809", textTransform: "uppercase" }}>{emp.role || "خبير مظهر"}</span>
                                            <h3 style={{ fontFamily: "'Noto Sans Arabic', sans-serif", fontWeight: 800, fontSize: "clamp(1.1rem, 4vw, 1.8rem)", marginTop: 6, color: "#F5F2EC" }}>{emp.name}</h3>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* ═══ GALLERY (Atmospheric Minimalist) ═══ */}
                <section className="py-24 sm:py-32 lg:py-56 overflow-hidden bg-[#070707]">
                    <div className="max-w-7xl mx-auto px-6 lg:px-12 mb-20 sm:mb-32">
                        <div className="flex flex-col items-center text-center">
                            <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex items-center justify-center gap-4 mb-3 sm:mb-4">
                                <div className="w-8 sm:w-10 h-[1px] bg-white/10" />
                                <span className="text-white/40 text-[10px] sm:text-[11px] uppercase font-bold tracking-[0.3em]" style={{ fontFamily: "'Space Mono', 'Tajawal', monospace" }}>
                                    {salon.gallery_subtitle || "\u0627\u0644\u0641\u064a\u062f\u064a\u0648 \u0648\u0627\u0644\u0635\u0648\u0631"}
                                </span>
                                <div className="w-8 sm:w-10 h-[1px] bg-white/10" />
                            </motion.div>

                            <motion.h2 initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-white text-3xl sm:text-5xl lg:text-7xl font-black tracking-tighter" style={{ fontFamily: "'Noto Sans Arabic', sans-serif" }}>
                                {salon.gallery_title || "\u0641\u0644\u0633\u0641\u0629 \u0627\u0644\u0645\u0638\u0647\u0631"}
                            </motion.h2>
                        </div>
                    </div>

                    <div className="relative">
                        {/* Edge Fades */}
                        <div className="absolute inset-y-0 left-0 w-32 sm:w-64 lg:w-96 z-10 pointer-events-none bg-gradient-to-r from-[#070707] via-[#070707]/80 to-transparent" />
                        <div className="absolute inset-y-0 right-0 w-32 sm:w-64 lg:w-96 z-10 pointer-events-none bg-gradient-to-l from-[#070707] via-[#070707]/80 to-transparent" />

                        {/* Row 1 (Moving to Right) */}
                        <div className="marquee-lane mb-10 lg:mb-16 hover:[&_.marquee-strip]:[animation-play-state:paused]">
                            <div className="marquee-strip marquee-strip-right-primary">
                                {galleryRowOne.map((item, i) =>
                                    renderGalleryCard(
                                        item,
                                        `row-1-primary-${i}`,
                                        "w-[68vw] sm:w-[54vw] lg:w-[30vw] xl:w-[26vw]",
                                        i % 2 === 0 ? "16/10" : "4/5"
                                    )
                                )}
                            </div>
                            <div className="marquee-strip marquee-strip-right-secondary" aria-hidden="true">
                                {galleryRowOne.map((item, i) =>
                                    renderGalleryCard(
                                        item,
                                        `row-1-secondary-${i}`,
                                        "w-[68vw] sm:w-[54vw] lg:w-[30vw] xl:w-[26vw]",
                                        i % 2 === 0 ? "16/10" : "4/5"
                                    )
                                )}
                            </div>
                        </div>

                        {/* Row 2 (Moving to Left) */}
                        <div className="marquee-lane hover:[&_.marquee-strip]:[animation-play-state:paused]">
                            <div className="marquee-strip marquee-strip-left-primary">
                                {galleryRowTwo.map((item, i) =>
                                    renderGalleryCard(
                                        item,
                                        `row-2-primary-${i}`,
                                        "w-[60vw] sm:w-[46vw] lg:w-[24vw] xl:w-[20vw]",
                                        i % 3 === 0 ? "1/1" : "3/2"
                                    )
                                )}
                            </div>
                            <div className="marquee-strip marquee-strip-left-secondary" aria-hidden="true">
                                {galleryRowTwo.map((item, i) =>
                                    renderGalleryCard(
                                        item,
                                        `row-2-secondary-${i}`,
                                        "w-[60vw] sm:w-[46vw] lg:w-[24vw] xl:w-[20vw]",
                                        i % 3 === 0 ? "1/1" : "3/2"
                                    )
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ═══ REVIEWS (Minimal Reference Style) ═══ */}
                <section id="reviews" className="py-24 sm:py-32 lg:py-48 px-6 lg:px-12 relative overflow-hidden bg-[#050505]">
                    {/* Background glow & watermark */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/[0.015] rounded-full blur-[140px] pointer-events-none" />
                    


                    <div className="max-w-4xl mx-auto relative z-10">
                        <div className="flex flex-col items-center text-center">
                            
                            {/* Top Title Line */}
                            <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex items-center justify-center gap-4 mb-3 sm:mb-4">
                                <div className="w-8 sm:w-10 h-[1px] bg-white/20" />
                                <span className="text-[#C3D809] text-[10px] sm:text-[11px] uppercase font-bold tracking-widest opacity-80" style={{ fontFamily: "'Space Mono', 'Tajawal', monospace" }}>
                                    {salon.reviews_subtitle || "\u0622\u0631\u0627\u0621 \u0639\u0645\u0644\u0627\u0626\u0646\u0627"}
                                </span>
                                <div className="w-8 sm:w-10 h-[1px] bg-white/20" />
                            </motion.div>

                            {/* Headline */}
                            <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-14 sm:mb-20">
                                <h2 className="text-white text-3xl sm:text-5xl lg:text-6xl font-black tracking-tighter" style={{ fontFamily: "'Noto Sans Arabic', sans-serif" }}>
                                    {salon.reviews_title || "\u0645\u0627\u0630\u0627 \u064a\u0642\u0648\u0644 \u0639\u0646\u0651\u0627 \u0627\u0644\u0639\u0645\u0644\u0627\u0621"}
                                </h2>
                            </motion.div>

                            <div className="relative w-full">
                                <AnimatePresence mode="wait">
                                    <motion.div 
                                        key={activeReviewIndex} 
                                        initial={{ opacity: 0, y: 15 }} 
                                        animate={{ opacity: 1, y: 0 }} 
                                        exit={{ opacity: 0, y: -15 }} 
                                        transition={{ duration: 0.5, ease: "easeOut" }}
                                        className="flex flex-col items-center"
                                    >
                                        {/* Stars */}
                                        <div className="flex gap-2 justify-center mb-8 text-[#C3D809]">
                                            {[1, 2, 3, 4, 5].map(s => <svg key={s} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-star opacity-90"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"></path></svg>)}
                                        </div>
                                        
                                        {/* Review Paragraph */}
                                        <p className="leading-[1.9] text-[#E0E0E0] italic mb-12 max-w-3xl mx-auto" style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.1rem, 3.5vw, 1.8rem)", fontWeight: 400 }}>
                                            &ldquo;{currentReview?.comment}&rdquo;
                                        </p>
                                        
                                        {/* Footer / Author */}
                                        <div className="flex flex-col items-center gap-1.5 mt-4">
                                            <h4 className="text-white text-[11px] sm:text-[12px] font-black uppercase tracking-[0.15em]" style={{ fontFamily: "'Space Mono', 'Noto Sans Arabic', monospace" }}>
                                                {currentReview?.customer_name}
                                            </h4>
                                            <span className="text-[#C3D809]/60 text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.25em] font-mono">
                                                {currentReview?.role || "\u0639\u0645\u064a\u0644 \u062f\u0627\u0626\u0645"}
                                            </span>
                                        </div>
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                            
                            {/* Pagination Dots */}
                            <div className="flex items-center gap-3 mt-16 sm:mt-24">
                                {mockReviews.map((_, i) => {
                                    const active = activeReviewIndex === i;
                                    return (
                                        <button key={i} onClick={() => setActiveReviewIndex(i)} className="p-2.5 group outline-none" aria-label={`\u0627\u0644\u062a\u0642\u064a\u064a\u0645 ${i + 1}`}>
                                            <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${active ? "bg-[#C3D809] border-[1.5px] border-[#C3D809]" : "bg-transparent border-[1.5px] border-white/20 group-hover:border-white/50"}`} />
                                        </button>
                                    );
                                })}
                            </div>
                            
                        </div>
                    </div>
                </section>

                {/* ═══ FAQ (Sophisticated Minimalist) ═══ */}
                <section id="faq" className="py-24 sm:py-32 lg:py-56 px-6 lg:px-12 bg-[#050505]">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex flex-col items-center text-center mb-16 sm:mb-24">
                            <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex items-center justify-center gap-4 mb-3 sm:mb-4">
                                <div className="w-8 sm:w-10 h-[1px] bg-white/10" />
                                <span className="text-white/40 text-[10px] sm:text-[11px] uppercase font-bold tracking-[0.3em]" style={{ fontFamily: "'Space Mono', 'Tajawal', monospace" }}>
                                    لديك استفسار؟
                                </span>
                                <div className="w-8 sm:w-10 h-[1px] bg-white/10" />
                            </motion.div>

                            <motion.h2 initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-white text-3xl sm:text-5xl lg:text-7xl font-black tracking-tighter" style={{ fontFamily: "'Noto Sans Arabic', sans-serif" }}>
                                الأسئلة <span className="text-[#C3D809]" style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontWeight: 700 }}>الشائعة</span>
                            </motion.h2>
                        </div>

                        <div className="border-t border-white/5">
                            {mockFaqs.map((faq, i) => {
                                const isOpen = openFaq === faq.id;
                                return (
                                    <motion.div 
                                        key={faq.id} 
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: i * 0.1 }}
                                        className="border-bottom border-white/5"
                                        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                                    >
                                        <button 
                                            onClick={() => setOpenFaq(isOpen ? null : faq.id)} 
                                            className="w-full py-6 sm:py-9 flex justify-between items-center text-right group outline-none"
                                        >
                                            <span 
                                                className={`transition-all duration-500 font-bold text-[clamp(0.95rem,3.5vw,1.25rem)] tracking-tight ${isOpen ? "text-[#C3D809]" : "text-white/80 group-hover:text-white"}`}
                                                style={{ fontFamily: "'Noto Sans Arabic', sans-serif" }}
                                            >
                                                {faq.question}
                                            </span>
                                            
                                            <div className={`flex-shrink-0 w-8 h-8 sm:w-11 sm:h-11 rounded-full border transition-all duration-500 flex items-center justify-center ${isOpen ? "bg-[#C3D809] border-[#C3D809] text-black rotate-45" : "border-white/10 text-white/40 group-hover:border-white/30 group-hover:text-white"}`}>
                                                <Plus size={16} />
                                            </div>
                                        </button>
                                        
                                        <AnimatePresence>
                                            {isOpen && (
                                                <motion.div 
                                                    initial={{ height: 0, opacity: 0 }} 
                                                    animate={{ height: "auto", opacity: 1 }} 
                                                    exit={{ height: 0, opacity: 0 }} 
                                                    transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
                                                    className="overflow-hidden"
                                                >
                                                    <p 
                                                        className="pb-8 sm:pb-12 text-white/40 leading-[1.8] text-[clamp(0.85rem,3vw,1rem)] max-w-2xl ml-auto"
                                                        style={{ fontFamily: "'Noto Sans Arabic', sans-serif" }}
                                                    >
                                                        {faq.answer}
                                                    </p>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* ═══ CTA (Minimal Punch) ═══ */}
                <section className="relative py-24 sm:py-32 lg:py-56 overflow-hidden bg-[#050505]">
                    {/* Atmospheric Glow */}
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#C3D809]/5 rounded-full blur-[120px] pointer-events-none" />
                    
                    <div className="relative z-10 text-center px-6">
                        <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                            <h2 
                                className="text-white font-black leading-[1.05] tracking-tighter mb-12 sm:mb-16"
                                style={{ fontFamily: "'Noto Sans Arabic', sans-serif", fontSize: "clamp(2.5rem, 10vw, 7rem)" }}
                            >
                                استعد <span className="text-[#C3D809]" style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontWeight: 700 }}>لمظهرك</span> <br className="hidden sm:block" /> القادم
                            </h2>
                            
                            <button 
                                onClick={() => setIsBookingOpen(true)} 
                                className="inline-flex items-center gap-4 bg-[#C3D809] text-black px-10 sm:px-14 py-5 sm:py-6 rounded-full font-black uppercase tracking-widest hover:bg-white transition-all duration-500 hover:scale-105 active:scale-95 group shadow-2xl shadow-[#C3D809]/20"
                                style={{ fontFamily: "'Space Mono', 'Tajawal', monospace", fontSize: "0.85rem" }}
                            >
                                احجز موعدك الآن
                                <ArrowRight size={18} className="group-hover:translate-x-[-10px] transition-transform duration-500" />
                            </button>
                        </motion.div>
                    </div>
                </section>

                <footer id="contact" className="py-16 sm:py-20 px-6 lg:px-12 bg-[#050505] border-t border-white/[0.03]">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 lg:gap-12 text-right">
                            {/* Brand Info */}
                            <div className="space-y-8">
                                <h3 className="text-white font-black italic tracking-tighter" style={{ fontFamily: "'Playfair Display', serif", fontSize: "2.2rem" }}>
                                    {salon.name}<span className="text-[#C3D809]">.</span>
                                </h3>
                                <p className="text-white/40 leading-relaxed text-sm max-w-xs" style={{ fontFamily: "'Noto Sans Arabic', sans-serif" }}>
                                    {salon.secondary_description || salon.description || "تجربة استثنائية تجمع بين الفن العريق والأسلوب المعاصر في قلب العاصمة."}
                                </p>
                                <div className="inline-block p-4 rounded-2xl border border-white/5 bg-white/[0.02]" style={{ fontFamily: "'Noto Sans Arabic', sans-serif" }}>
                                    <p className="text-[#C3D809] font-black text-lg mb-0.5">احصل على 30% خصم</p>
                                    <p className="text-white/20 text-[0.7rem] uppercase tracking-widest font-bold">على زيارتك الأولى</p>
                                </div>
                            </div>

                            {/* Links */}
                            <div className="lg:pr-10">
                                <span className="text-[#C3D809] text-[9px] uppercase font-bold tracking-[0.4em] mb-8 block" style={{ fontFamily: "'Space Mono', monospace" }}>قائمة الروابط</span>
                                <ul className="space-y-5">
                                    {[{ name: "قصتنا", id: "about" }, { name: "خدماتنا", id: "services" }, { name: "فريقنا", id: "team" }, { name: "الخصوصية", id: "privacy" }].map(link => (
                                        <li key={link.id}>
                                            <a href={`#${link.id}`} className="text-white/50 hover:text-white transition-all duration-300 text-[0.95rem] font-medium" style={{ fontFamily: "'Noto Sans Arabic', sans-serif" }}>
                                                {link.name}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Work Hours */}
                            <div>
                                <span className="text-[#C3D809] text-[9px] uppercase font-bold tracking-[0.4em] mb-8 block" style={{ fontFamily: "'Space Mono', monospace" }}>أوقات العمل</span>
                                <div className="space-y-8">
                                    <div className="space-y-1">
                                        <p className="text-white/80 font-black text-lg" style={{ fontFamily: "'Noto Sans Arabic', sans-serif" }}>{formatOpenDays()}</p>
                                        <p className="text-white/20 text-[0.7rem] uppercase tracking-[0.2em] font-bold" style={{ fontFamily: "'Space Mono', monospace" }}>الأيام المتاحة</p>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 text-[#C3D809]">
                                            <div className="w-9 h-9 rounded-xl border border-[#C3D809]/20 flex items-center justify-center bg-[#C3D809]/5">
                                                <Clock size={16} />
                                            </div>
                                            <span className="text-2xl font-black text-white" style={{ fontFamily: "'Noto Sans Arabic', sans-serif", letterSpacing: "-0.02em" }}>
                                                {fmt12(workHours.start)} — {fmt12(workHours.end)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Contact & Social */}
                            <div>
                                <span className="text-[#C3D809] text-[9px] uppercase font-bold tracking-[0.4em] mb-8 block" style={{ fontFamily: "'Space Mono', monospace" }}>تواصل معنا</span>
                                <div className="space-y-8">
                                    <a href={`tel:${salon.phone}`} className="block group">
                                        <p className="text-white text-lg font-black group-hover:text-[#C3D809] transition-colors" dir="ltr">{salon.phone || "0785295125"}</p>
                                        <p className="text-white/20 text-[0.7rem] uppercase tracking-widest font-bold mt-1">اتصل بنا</p>
                                    </a>
                                    
                                    <div className="flex gap-4">
                                        {salon.instagram && (
                                            <div className="relative group cursor-pointer">
                                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-gradient-to-tr from-[#405DE6] to-[#F56040] text-[10px] text-white font-bold tracking-widest opacity-0 group-hover:opacity-100 transition-all duration-300 scale-50 group-hover:scale-100 pointer-events-none z-20">
                                                    INSTAGRAM
                                                </div>
                                                <a href={`https://instagram.com/${salon.instagram.replace('@', '')}`} target="_blank" className="w-12 h-12 rounded-full border border-white/5 bg-white/[0.02] flex items-center justify-center relative overflow-hidden group/icon">
                                                    <div className="absolute bottom-0 left-0 w-full h-0 group-hover/icon:h-full transition-all duration-500 bg-gradient-to-tr from-[#405DE6] via-[#E1306C] to-[#FFDC80] z-0" />
                                                    <Instagram size={20} className="relative z-10 text-white/40 group-hover/icon:text-white transition-colors duration-300" />
                                                </a>
                                            </div>
                                        )}
                                        {salon.whatsapp && (
                                            <div className="relative group cursor-pointer">
                                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-[#25D366] text-[10px] text-white font-bold tracking-widest opacity-0 group-hover:opacity-100 transition-all duration-300 scale-50 group-hover:scale-100 pointer-events-none z-20">
                                                    WHATSAPP
                                                </div>
                                                <a href={`https://wa.me/${salon.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" className="w-12 h-12 rounded-full border border-white/5 bg-white/[0.02] flex items-center justify-center relative overflow-hidden group/icon">
                                                    <div className="absolute bottom-0 left-0 w-full h-0 group-hover/icon:h-full transition-all duration-500 bg-[#25D366] z-0" />
                                                    <FaWhatsapp size={20} className="relative z-10 text-white/40 group-hover/icon:text-white transition-colors duration-300" />
                                                </a>
                                            </div>
                                        )}
                                        {salon.facebook && (
                                            <div className="relative group cursor-pointer">
                                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-[#1877F2] text-[10px] text-white font-bold tracking-widest opacity-0 group-hover:opacity-100 transition-all duration-300 scale-50 group-hover:scale-100 pointer-events-none z-20">
                                                    FACEBOOK
                                                </div>
                                                <a href={salon.facebook.startsWith('http') ? salon.facebook : `https://facebook.com/${salon.facebook}`} target="_blank" className="w-12 h-12 rounded-full border border-white/5 bg-white/[0.02] flex items-center justify-center relative overflow-hidden group/icon">
                                                    <div className="absolute bottom-0 left-0 w-full h-0 group-hover/icon:h-full transition-all duration-500 bg-[#1877F2] z-0" />
                                                    <Facebook size={20} className="relative z-10 text-white/40 group-hover/icon:text-white transition-colors duration-300" />
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Copyright */}
                        <div className="mt-16 pt-10 border-t border-white/[0.03] flex flex-col md:flex-row justify-between items-center gap-6">
                            <div className="flex items-center gap-8" style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.65rem" }}>
                                <a href="https://maqas.site/" target="_blank" className="text-[#C3D809] font-black tracking-[0.1em] hover:opacity-80 transition-opacity">MAQAS.SITE</a>
                                <div className="flex gap-6">
                                    <a href={`/privacy?s=${slug}`} className="text-white/20 hover:text-white transition-colors uppercase tracking-widest font-bold">Privacy</a>
                                    <a href={`/terms?s=${slug}`} className="text-white/20 hover:text-white transition-colors uppercase tracking-widest font-bold">Terms Policy</a>
                                </div>
                            </div>
                            <div className="text-white/20 font-bold tracking-[0.05em] uppercase text-[10px]" style={{ fontFamily: "'Space Mono', monospace" }}>
                                © {new Date().getFullYear()} {salon.name} . ALL RIGHTS RESERVED
                            </div>
                        </div>
                    </div>
                </footer>
            </main>

            <AnimatePresence>
                {isBookingOpen && (
                    <BookingModal
                        isOpen={isBookingOpen}
                        onClose={() => setIsBookingOpen(false)}
                        salon={salon}
                        services={services}
                        employees={employees}
                        step={step}
                        setStep={setStep}
                        sel={sel}
                        setSel={setSel}
                        dates={dates}
                        bookedSlots={bookedSlots}
                        fetchBooked={fetchBooked}
                        genTimes={genTimes}
                        totalPrice={totalPrice}
                        totalDur={totalDur}
                        selSrvs={selSrvs}
                        submitting={submitting}
                        error={error}
                        submitBooking={submitBooking}
                        toggleSrv={toggleSrv}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

export default function BookingPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A0A0A" }}>
                <div className="w-10 h-10 rounded-full animate-spin" style={{ border: "3px solid rgba(195,216,9,0.15)", borderTopColor: "#C3D809" }} />
            </div>
        }>
            <BookingContent />
        </Suspense>
    );
}
