"use client";

import { useEffect, useState, useCallback, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence, useInView } from "framer-motion";
import axios from "axios";
import { assetUrl } from "@/lib/assets";
import {
    Scissors, Calendar, Clock, X, ArrowRight, ArrowLeft, Star,
    Instagram, Facebook, Phone, Plus, ChevronLeft, ChevronRight
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { Service, Employee, SalonInfo, BookingSel, dayNames, dayNamesEn, monthNames, fmt12, API } from "../types";
import BookingModal from "../BookingModal";
import MaqassLogoIcon from "@/components/ui/MaqassLogoIcon";

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

const AUTO_TRANSLATE_MAP: Record<string, string> = {
    // --- Brand & Basic ---
    "صالون الشايب": "Al-Shaib Salon",
    "الشايب": "Al-Shaib",
    "صالون مقص": "Maqass Salon",
    "مقص": "Maqass",
    "تجربة استثنائية تجمع بين الفن العريق والأسلوب المعاصر في قلب العاصمة.": "An exceptional experience combining ancient art and contemporary style in the heart of the capital.",
    
    // --- Hero & About ---
    "أين يلتقي الإبــــداع بالأناقة": "Where Creativity Meets Elegance",
    "تأسس ٢٠٢٤ -- صالون فاخر": "Est. 2024 -- Luxury Salon",
    "قصتنا": "Our Story",
    "لمسة من الإبداع": "A Touch of Creativity",
    "ادخل إلى عالم يروي فيه كل مظهر قصة. يجمع خبراء الشايب بين التقنيات الأصيلة والفن الحديث لخلق مظهرك الفريد، بأسلوب يعكس شخصيتك ويرتقي بتجربتك.": "Step into a world where every look tells a story. Our experts combine authentic techniques and modern art to create your unique look, reflecting your personality and elevating your experience.",
    
    // --- Promotions ---
    "خصم": "Discount",
    "بمناسبة الافتتاح": "Opening Special",
    "للعملاء الجدد": "for new customers",
    "عرض خاص": "Special Offer",
    "عرض لفترة محدودة": "Limited Time Offer",
    
    // --- Sections ---
    "قائمة الخدمات": "Service Menu",
    "خدمات الصالون": "Our Services",
    "اختر الخدمة، شاهد لمحة فورية، ثم احجز بضغطة واحدة. تصميم واضح لتجربة راقية وعناية دقيقة تليق بك.": "Select a service, view an instant preview, and book with one click. Simple design for a refined experience and care that suits you.",
    "أيدي مبدعة": "Creative Hands",
    "فريق العمل": "Our Team",
    "خبراء محترفون يجمعون بين المهارة والإبداع لتقديم أفضل النتائج.": "Professional experts combining skill and creativity to deliver the best results.",
    "معرض أعمالنا": "Our Gallery",
    "لمحة عن إبداعاتنا وأعمالنا المميزة": "A glimpse of our work and unique creations",
    "ماذا يقول عنا العملاء": "What Our Clients Say",
    "آراء عملائنا": "Client Reviews",
    
    // --- Stats & Footer ---
    "سنوات خبرة": "Years of Exp.",
    "عميل سعيد": "Happy Clients",
    "خبير حلاقة": "Hair Experts",
    "موقعنا": "Our Location",
    "ساعات العمل": "Opening Hours",
    "تواصل معنا": "Contact Us",
    "جميع الحقوق محفوظة": "All Rights Reserved",
    "طورت بواسطة": "Developed by",
    
    // --- Booking Actions ---
    "احجز الآن": "Book Now",
    "اكتشف المزيد": "Discover More",
    "متوفر الآن": "Available Now",
    "أيام العمل": "Working Days",
    "مغلق": "Closed",
    
    // --- Roles ---
    "حلاق": "Barber",
    "كوافير": "Stylist",
    "خبير مظهر": "Style Expert",
    "أخصائي بشرة": "Skin Specialist",
    "مصفف شعر": "Hair Stylist",
    "حلاق رئيسي": "Master Barber",
    "Elite Barber": "Elite Barber",

    // --- Services ---
    "قسم الشعر": "Hair Section",
    "قسم الذقن": "Beard Section",
    "العناية بالبشرة": "Skin Care",
    "باقات العرسان": "Groom Packages",
    "باقات العريس": "Groom Packages",
    "حلاقة": "Haircut",
    "قص شعر": "Haircut",
    "حلاقة ذقن": "Beard Trim",
    "حلاقة وتحديد": "Trim & Line-up",
    "شعر وذقن": "Hair & Beard",
    "تصفيف شعر": "Hair Styling",
    "تنظيف بشرة عادي": "Standard Facial",
    "تنظيف بشرة عميق": "Deep Facial",
    "سشوار": "Blowdry",
    "استشوار": "Blowdry",
    "صبغة شعر": "Hair Coloring",
    "صبغة": "Dye",
    "كراتين": "Keratin",
    "كرياتين": "Keratin",
    "كيراتين شعر": "Hair Keratin",
    "بروتين شعر": "Hair Protein",
    "بروتين": "Protein",
    "حمام مغربي": "Moroccan Bath",
    "حمام": "Bath",
    "مغربي": "Moroccan",
    "مساج": "Massage",
    "بديكير ومنيكير": "Mani & Pedi",
    "تجميل": "Beauty",
    "مظهر": "Appearance",
    "عناية بالوجه": "Facial Care",
    "تنظيف بشرة": "Facial Cleansing",
    "مساج رأس": "Head Massage",
    "مساج وجه": "Face Massage",
    "ذقن": "Beard",
    "تنظيف": "Cleaning",
    "بشرة": "Skin",
    "تجهيز": "Grooming",
    "عريس": "Groom",
    "تقوية شعر": "Hair Strengthening",
    "عناية شعر": "Hair Care",
    "ماسك شعر": "Hair Mask",
    "تقوية": "Treatment",
    "علاج": "Treatment",
    "باقة": "Package",
    "خدمة": "Service",
    "خدمات": "Services",
};

const tData = (text: string | null | undefined, lang: 'ar' | 'en'): string => {
    if (!text) return "";
    
    // Support bilingual format: "عربي||English"
    if (text.includes("||")) {
        const [arText, enText] = text.split("||").map(s => s.trim());
        return lang === 'ar' ? (arText || "") : (enText || arText || "");
    }
    
    if (lang === 'ar') return text;
    
    const cleanText = text.trim();
    if (AUTO_TRANSLATE_MAP[cleanText]) return AUTO_TRANSLATE_MAP[cleanText];
    
    let translated = cleanText;
    Object.keys(AUTO_TRANSLATE_MAP).forEach(key => {
        if (key.split(" ").length === 1) {
            const regex = new RegExp(`(?<=^|\\s)${key}(?=\\s|$)`, 'g');
            translated = translated.replace(regex, AUTO_TRANSLATE_MAP[key]);
        }
    });

    translated = translated.replace(/(\d+)\s+دقيقة/g, '$1 min');
    translated = translated.replace(/(\d+)\s+دينار/g, '$1 JOD');
    translated = translated.replace(/(\d+)\s+د\.أ/g, '$1 JOD');
    translated = translated.replace(/د\.أ/g, 'JOD');

    return translated;
};

function BookingContent({ params }: { params: { slug: string } }) {
    const searchParams = useSearchParams();
    const slugFromPath = typeof window !== 'undefined' ? window.location.pathname.split('/').filter(Boolean).pop() : "";
    const rawSlug = params.slug || searchParams.get("s") || searchParams.get("salon") || slugFromPath || "";
    const slug = (Array.isArray(rawSlug) ? rawSlug[0] : rawSlug).toLowerCase();

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

    const [lang, setLang] = useState<'ar'|'en'>('ar');
    const [step, setStep] = useState(1);
    const [sel, setSel] = useState<BookingSel>({ service_ids: [], employee_id: 0, booking_date: "", booking_time: "", customer_name: "", customer_phone: "", notes: "" });
    const [bookedSlots, setBookedSlots] = useState<{ booking_time: string; employee_id: number }[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const thumbRef = useRef<HTMLDivElement>(null);

    const scrollThumbs = (dir: 'l' | 'r') => {
        if (!thumbRef.current) return;
        const amt = 320; 
        const container = thumbRef.current;
        if (dir === 'r') {
            container.scrollBy({ left: lang === 'ar' ? -amt : amt, behavior: 'smooth' });
        } else {
            container.scrollBy({ left: lang === 'ar' ? amt : -amt, behavior: 'smooth' });
        }
    };

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

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveReviewIndex((prev) => (prev + 1) % (salon?.reviews?.length || 3));
        }, 5000);
        return () => clearInterval(interval);
    }, [salon?.reviews?.length]);

    const fetchBooked = useCallback(async (empId: number, date: string) => {
        try {
            const res = await axios.get(`${API}/booking/book.php?act=getBooked&slug=${slug.toLowerCase()}&date=${date}&employee_id=${empId}`);
            setBookedSlots(res.data.data.booked_slots || []);
        } catch { /* silent */ }
    }, [slug]);

    const selSrvs = services.filter(s => sel.service_ids.includes(s.id));
    const subtotal = selSrvs.reduce((sum, s) => sum + parseFloat(s.price || "0"), 0);
    
    // Consolidated discount logic
    const hasDiscount = Number(salon?.discount_active) === 1 && parseFloat(salon?.discount_percentage || "0") > 0;
    const discountPercent = parseFloat(salon?.discount_percentage || "0") || 30;
    const totalPrice = hasDiscount ? Math.round(subtotal * (1 - discountPercent / 100) * 100) / 100 : subtotal;
    
    const totalDur = selSrvs.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);

    const submitBooking = useCallback(async () => {
        setError(""); setSubmitting(true);
        try {
            if (!sel.customer_name || !sel.customer_phone || !sel.booking_date || !sel.booking_time || sel.service_ids.length === 0)
                throw new Error("يرجى إكمال جميع البيانات المطلوبة");
            if (sel.customer_name.length < 3) throw new Error("الاسم يجب أن يكون 3 أحرف على الأقل");
            if (!/^07\d{8}$/.test(sel.customer_phone)) throw new Error("رقم الهاتف يجب أن يبدأ بـ 07 ويتكون من 10 أرقام (الأردن)");
            await axios.post(`${API}/booking/book.php`, { salon_slug: slug, ...sel, total_price: totalPrice, total_duration: totalDur });
            setStep(5);
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
            setError(axiosErr.response?.data?.message || axiosErr.message || "حدث خطأ");
        }
        setSubmitting(false);
    }, [sel, slug, totalPrice, totalDur]);

    const dates: string[] = [];
    let checkDate = new Date();
    let safeguard = 0;
    while (dates.length < bookingDays && dates.length < 30 && safeguard < 60) {
        safeguard++;
        if (!offDays.includes(checkDate.getDay())) {
            dates.push(checkDate.toISOString().split("T")[0]);
        }
        checkDate.setDate(checkDate.getDate() + 1);
    }

    const genTimes = useCallback(() => {
        const tr: string[] = [];
        if (!sel.booking_date) return tr;
        
        let [ch, cm] = workHours.start.split(":").map(Number);
        let [eh, em] = workHours.end.split(":").map(Number);
        
        let startTimeInMinutes = ch * 60 + cm;
        let endTimeInMinutes = eh * 60 + em;

        // If end time is 00:00 (Midnight) OR 12:00 (common UI interpretation for Midnight end)
        // AND it's less than or equal to start time (or just 12:00 generally for salons)
        if (endTimeInMinutes === 0 || (eh === 12 && ch >= 10)) {
            endTimeInMinutes = 24 * 60; 
        }
        
        const no = new Date();
        const isToday = sel.booking_date === no.toISOString().split("T")[0];
        
        while (true) {
            const currentTotalMinutes = ch * 60 + cm;
            const slotEndTimeInMinutes = currentTotalMinutes + workHours.interval;
            
            if (slotEndTimeInMinutes > endTimeInMinutes) break;

            const t = `${String(ch).padStart(2, "0")}:${String(cm).padStart(2, "0")}`;
            let passed = false;
            
            if (isToday) {
                if (ch < no.getHours() || (ch === no.getHours() && cm <= no.getMinutes() + 30)) passed = true;
            }
            
            if (!passed) tr.push(t);
            
            cm += workHours.interval;
            while (cm >= 60) { ch++; cm -= 60; }
            if (ch >= 24) break;
        }
        return tr;
    }, [workHours, sel.booking_date]);

    const toggleSrv = useCallback((id: number) => {
        setSel(p => ({ ...p, service_ids: p.service_ids.includes(id) ? p.service_ids.filter(x => x !== id) : [...p.service_ids, id] }));
    }, []);

    const resolveMediaUrl = useCallback((path?: string | null) => {
        if (!path || path === "null" || path === "undefined" || path === "[]" || path.trim() === "") return "";
        return assetUrl(path) || path || "";
    }, []);

    /* ─── Helpers ─── */
    const formatOpenDays = useCallback(() => {
        const names = lang === 'en' ? dayNamesEn : dayNames;
        if (offDays.length === 0) return lang === 'en' ? "All Week" : "طوال أيام الأسبوع";
        if (offDays.length === 7) return lang === 'en' ? "Temporarily Closed" : "مغلق مؤقتاً";

        const openIndices = Array.from({ length: 7 }, (_, i) => i).filter(i => !offDays.includes(i));
        if (openIndices.length === 0) return lang === 'en' ? "Closed" : "مغلق";

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

        const sep = lang === 'en' ? ', ' : ' ، ';
        return groups.map(g => {
            if (g.length === 1) return names[g[0]];
            if (g.length === 2) return `${names[g[0]]}${sep}${names[g[1]]}`;
            return `${names[g[0]]} - ${names[g[g.length - 1]]}`;
        }).join(sep);
    }, [offDays, lang]);

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

    const defaultGallery = [
        { type: "video", url: "https://assets.mixkit.co/videos/preview/mixkit-barber-trimming-a-beard-with-a-razor-4148-large.mp4" },
        { type: "image", url: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?q=80&w=1200" },
        { type: "video", url: "https://assets.mixkit.co/videos/preview/mixkit-stylist-combing-hair-of-a-customer-4147-large.mp4" },
        { type: "image", url: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?q=80&w=1200" },
        { type: "image", url: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=1200" },
        { type: "image", url: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=1200" },
    ];
    let mockGallery = salon.gallery?.length ? salon.gallery.map((g: any) => {
        if (typeof g === "string") return { type: "image", url: resolveMediaUrl(g) };
        const path = g.url || g.file_path || g.image_path || g.video_path || g.path;
        const type = g.type || g.file_type || (path?.match(/\.(mp4|webm|ogg)$/i) ? "video" : "image");
        return { type, url: resolveMediaUrl(path) };
    }) : [];
    
    mockGallery = mockGallery.filter((item: any) => item.url && item.url.length > 3);
    if (!mockGallery || mockGallery.length === 0) {
        mockGallery = defaultGallery;
    }
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
            img: resolveMediaUrl(service.image || (service as any).image_path),
            video: resolveMediaUrl(service.video || (service as any).video_path) || null,
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
    const galleryRowOneSource = mockGallery.filter((_, i) => i % 2 === 0);
    const galleryRowTwoSource = mockGallery.filter((_, i) => i % 2 !== 0);

    // If one row is empty (only 1 item in total), use it for both for seamless looping
    const r1src = galleryRowOneSource.length ? galleryRowOneSource : mockGallery;
    const r2src = galleryRowTwoSource.length ? galleryRowTwoSource : mockGallery;

    // Multiply enough times to avoid gaps in infinite scroll
    const galleryRowOne = Array(4).fill(r1src).flat();
    const galleryRowTwo = Array(4).fill(r2src).flat();
    const renderGalleryCard = (
        item: { type: string; url: string },
        key: string,
        widthClass: string,
        aspectRatio: string
    ) => (
        <div
            key={key}
            className={`shrink-0 ${widthClass} overflow-hidden group rounded-[1.5rem] sm:rounded-[2.2rem] bg-white/5 border border-white/[0.04] relative`}
            style={{ aspectRatio, transform: "translateZ(0)", backfaceVisibility: "hidden" }}
        >
            {item.type === "video" ? (
                <video
                    src={item.url}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover transition-all duration-[1.2s] group-hover:scale-105"
                    style={{ filter: "brightness(0.8) contrast(1.1)" }}
                />
            ) : (
                <img
                    src={item.url}
                    className="w-full h-full object-cover transition-all duration-[1.2s] group-hover:scale-105"
                    alt=""
                    style={{ filter: "brightness(0.8) contrast(1.1)" }}
                />
            )}
            <div className="absolute inset-0 bg-black/10 group-hover:opacity-0 transition-opacity duration-700 pointer-events-none" />
            {item.type === "video" && (
                <div className="absolute top-6 right-6 w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 opacity-60">
                    <div className="w-0 h-0 border-t-[4px] border-t-transparent border-l-[6px] border-l-white border-b-[4px] border-b-transparent translate-x-0.5" />
                </div>
            )}
        </div>
    );
    const mockReviews = (salon && (salon as any).reviews?.length) ? (salon as any).reviews : [
        { id: 1, customer_name: lang === 'en' ? "Ahmed Abdullah" : "\u0623\u062d\u0645\u062f \u0627\u0644\u0639\u0628\u062f\u0627\u0644\u0644\u0647", rating: 5, comment: lang === 'en' ? "Very professional service, the barber understood exactly what I wanted." : "\u062e\u062f\u0645\u0629 \u062d\u062a\u0631\u0627\u0641\u064a\u0629 \u062c\u062f\u0627\u064b\u060c \u0627\u0644\u062d\u0644\u0627\u0642 \u0641\u0647\u0645 \u0642\u0635\u0629 \u0627\u0644\u0634\u0631 \u0627\u0644\u0644\u064a \u0623\u0631\u064a\u062f\u0647\u0627 \u0628\u0627\u0644\u0636\u0628\u0637." },
        { id: 2, customer_name: lang === 'en' ? "Mohammed Khaled" : "\u0645\u062d\u0645\u062f \u062e\u0627\u0644\u062f", rating: 5, comment: lang === 'en' ? "Very elegant place and excellent commitment. I recommend trying the skincare section." : "\u0627\u0644\u0645\u0643\u0627\u0646 \u0631\u0627\u0642\u064a \u062c\u062f\u0627\u064b \u0648\u0627\u0644\u062a\u0631\u0627\u0645 \u0645\u0645\u062a\u0627\u0632. \u0623\u0646\u0635\u062d \u0628\u062a\u062c\u0631\u0628\u0629 \u0642\u0633\u0645 \u0627\u0644\u0639\u0646\u0627\u064a\u0629 \u0628\u0627\u0644\u0628\u0634\u0631\u0629." },
        { id: 3, customer_name: lang === 'en' ? "Salem Al-Marri" : "\u0633\u0627\u0644\u0645 \u0627\u0644\u0645\u0631\u064a", rating: 5, comment: lang === 'en' ? "Great experience and booking app is very easy. The price is reasonable for the quality." : "\u062a\u062c\u0631\u0628\u0629 \u0631\u0627\u0626\u0639\u0629 \u0648\u062a\u0637\u0628\u064a\u0642 \u0627\u0644\u062d\u062c\u0632 \u0633\u0647\u0644 \u062c\u062f\u0627\u064b. \u0627\u0644\u0633\u0631 \u0645\u0646\u0627\u0633\u0628 \u0645\u0642\u0627\u0628\u0644 \u0627\u0644\u062c\u0648\u062f\u0629." }
    ];
    const currentReview = mockReviews[Math.min(activeReviewIndex, Math.max(mockReviews.length - 1, 0))];
    const mockFaqs = salon.faqs?.length ? salon.faqs : [
        { id: 1, question: lang === 'en' ? "Is there parking available?" : "هل يتوفر مواقف سيارات؟", answer: lang === 'en' ? "Yes, we provide free parking for our customers directly in front of the salon." : "نعم، نوفر مواقف مجانية لعملائنا أمام الصالون مباشرة." },
        { id: 2, question: lang === 'en' ? "Can I cancel or reschedule my appointment?" : "هل يمكن إلغاء أو تعديل الموعد؟", answer: lang === 'en' ? "Of course, please contact us at least two hours before your appointment." : "بالطبع، تواصل معنا قبل ساعتين على الأقل من موعدك." },
        { id: 3, question: lang === 'en' ? "What payment methods are available?" : "ما هي طرق الدفع المتاحة؟", answer: lang === 'en' ? "We accept cash, credit cards, and Mada cards." : "نوفر الدفع نقداً وعبر البطاقات الائتمانية وبطاقات مدى." },
    ];



    return (
        <div 
            className="min-h-screen overflow-x-hidden transition-all duration-500" 
            data-lang={lang}
            style={{ 
                fontFamily: lang === 'en' ? "'Montserrat', sans-serif" : "'Noto Sans Arabic', sans-serif", 
                background: "#0A0A0A", 
                color: "#F5F2EC", 
                direction: lang === 'ar' ? 'rtl' : 'ltr',
            }}
        >
            {/* GOOGLE FONTS moved to layout.tsx for better local performance */}

            {/* ═══ HEADER (Solv Style) ═══ */}
            <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-700 border-b border-transparent" style={{
                padding: scrolled ? "clamp(8px, 1.5vh, 16px) clamp(16px, 4vw, 48px)" : "clamp(16px, 3vh, 32px) clamp(16px, 4vw, 48px)",
                background: scrolled ? "rgba(5,5,5,0.85)" : "transparent",
                backdropFilter: scrolled ? "blur(24px)" : "none",
            }}>
                <div className="max-w-[1500px] mx-auto grid grid-cols-2 lg:grid-cols-3 items-center">
                    {/* Left: Nav (Desktop Only) */}
                    <nav className="hidden lg:flex items-center justify-start gap-10">
                        {(lang === 'ar' ? [{ name: "خدماتنا", id: "services" }, { name: "قصتنا", id: "about" }, { name: "فريقنا", id: "team" }] : [{ name: "Services", id: "services" }, { name: "Story", id: "about" }, { name: "Team", id: "team" }]).map(item => (
                            <a key={item.id} href={`#${item.id}`} 
                               style={{ fontFamily: lang === 'ar' ? "'El Messiri', sans-serif" : "'Montserrat', sans-serif", letterSpacing: lang === 'en' ? '0.12em' : undefined }}
                               className="text-[13px] font-black tracking-widest uppercase text-white/60 hover:text-[#C3D809] transition-colors duration-300 relative group py-2"
                            >
                                {item.name}
                                <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-[#C3D809] transition-all duration-300 group-hover:w-full"></span>
                            </a>
                        ))}
                    </nav>

                    {/* Center: Logo */}
                    <div className="flex justify-center">
                        <a href={`/book/${slug}`} className="flex items-center gap-3 transition-transform hover:scale-105">
                            <div className="w-8 h-8 rounded-lg overflow-hidden bg-[#C3D809] flex items-center justify-center border border-white/10 shadow-[0_4px_18px_rgba(195,216,9,0.22)]">
                                {salon.logo ? (
                                    <img
                                        src={salon.logo}
                                        alt={tData(salon.name, lang)}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <Scissors size={18} className="text-black" />
                                )}
                            </div>
                            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.2rem, 3vw, 1.6rem)", fontWeight: 900, letterSpacing: "-0.04em", color: "#F5F2EC" }}>
                                {tData(salon.name, lang)}
                            </span>
                        </a>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex justify-end items-center gap-3 sm:gap-5">

                        {/* Classic minimalist language switcher */}
                        <div className="hidden sm:flex items-center gap-3 text-[10px] font-black uppercase tracking-widest" style={{ fontFamily: "'Space Mono', monospace" }}>
                            <button 
                                onClick={() => setLang('ar')}
                                className={`transition-all duration-300 px-1 ${lang === 'ar' ? 'text-[#C3D809]' : 'text-white/30 hover:text-white'}`}
                            >
                                ع
                            </button>
                            <span className="w-px h-3 bg-white/10"></span>
                            <button 
                                onClick={() => setLang('en')}
                                className={`transition-all duration-300 px-1 ${lang === 'en' ? 'text-[#C3D809]' : 'text-white/30 hover:text-white'}`}
                            >
                                EN
                            </button>
                        </div>

                        {/* Divider */}
                        <div className="hidden sm:block w-px h-5 bg-white/10" />

                        {/* Book Now — sharp luxury CTA */}
                        <button
                            onClick={() => setIsBookingOpen(true)}
                            className="relative overflow-hidden group flex items-center justify-center gap-3 px-6 sm:px-8 py-3 sm:py-4 text-black font-black uppercase tracking-widest text-[11px] sm:text-[12px] min-h-[48px] sm:min-h-[52px]"
                            style={{
                                fontFamily: lang === 'en' ? "'Montserrat', sans-serif" : "'Noto Sans Arabic', sans-serif",
                                background: '#C3D809',
                                clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 100%, 12px 100%)',
                            }}
                        >
                            <span className="relative z-10 transition-transform duration-300 group-hover:translate-x-0.5">
                                {lang === 'ar' ? 'احجز الآن' : 'Book Now'}
                            </span>
                            <span className="absolute inset-0 bg-white translate-x-[-101%] group-hover:translate-x-0 transition-transform duration-500 ease-out z-0" />
                        </button>

                        {/* Hamburger — refined minimal */}
                        <button className="flex flex-col gap-[5px] p-2.5 group min-h-[44px] min-w-[44px] items-center justify-center">
                            <div className="w-5 h-[1px] bg-white/70 group-hover:bg-[#C3D809] group-hover:w-4 transition-all duration-300" />
                            <div className="w-3.5 h-[1px] bg-white/40 group-hover:bg-[#C3D809] group-hover:w-5 transition-all duration-300" />
                            <div className="w-4 h-[1px] bg-white/20 group-hover:bg-[#C3D809] group-hover:w-3 transition-all duration-300" />
                        </button>
                    </div>
                </div>
            </header>

            <main>
                {/* ═══ SALON & CO. MINIMAL SPLIT HERO ═══ */}
                <section className="relative min-h-[100svh] flex flex-col bg-[#050505] overflow-hidden">
                    
                    {/* Image: LEFT in Arabic (RTL), RIGHT in English (LTR) */}
                    <div className={`absolute inset-y-0 w-full lg:w-[60%] z-0 h-full overflow-hidden ${lang === 'en' ? 'right-0' : 'left-0'}`}>
                        {/* Desktop gradient: fades toward text block */}
                        <div className="absolute inset-0 z-10 pointer-events-none hidden lg:block" style={{ background: lang === 'en' ? "linear-gradient(to left, transparent 0%, transparent 40%, #050505 100%)" : "linear-gradient(to right, transparent 0%, transparent 40%, #050505 100%)" }} />
                        
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
                    <div className="relative z-20 w-full max-w-[1500px] mx-auto grid grid-cols-1 lg:grid-cols-2 px-[clamp(16px,5vw,64px)] pt-[15vh] lg:pt-0 pb-12 my-auto">
                        
                        {/* Text Content: LTR=col1 (left), RTL=col1 (visually right) */}
                        <div className={`flex flex-col justify-end lg:justify-center w-full ${lang === 'en' ? 'text-left lg:pr-12 xl:pr-20' : 'text-right lg:pl-12 xl:pl-20'}`}>
                            
                            {/* Top Subtitle Component */}
                            <motion.div 
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8 }}
                                className="flex items-center gap-4 mb-4 lg:mb-5"
                            >
                                <div className="w-8 md:w-12 h-[1px] bg-[#C3D809]" />
                                <span className="text-[#C3D809] text-[clamp(8px,2vw,11px)] font-bold tracking-widest uppercase" style={{ fontFamily: "'Space Mono', monospace" }}>
                                    {tData(salon.hero_subtitle || (lang === 'ar' ? "تأسس ٢٠٢٤ -- صالون فاخر" : "EST 2024 -- LUXURY SALON"), lang)}
                                </span>
                            </motion.div>

                            {/* Massive Typography */}
                            {(() => {
                                const rawTitleAr = salon.hero_title ? tData(salon.hero_title, 'ar') : "أين يلتقي الإبــــداع بالأناقة";
                                const rawTitle = tData(salon.hero_title || (lang === 'ar' ? "أين يلتقي الإبــــداع بالأناقة" : "Where Creativity Meets Elegance"), lang);
                                const words = rawTitle.trim().split(/\s+/);
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
                                        className="text-white font-black leading-[1.05] mb-6 flex flex-col items-start gap-1"
                                    >
                                        {line1 && <span className="text-[clamp(1.5rem,4vw,2.75rem)] text-[#C3D809]" style={{ fontFamily: lang === 'en' ? "'Cormorant Garamond', serif" : "'Noto Sans Arabic', sans-serif" }}>{line1}</span>}
                                        {line2 && <span className="text-[clamp(2rem,6.5vw,4.5rem)]" style={{ fontFamily: lang === 'en' ? "'Cormorant Garamond', serif" : "'Noto Sans Arabic', sans-serif" }}>{line2}</span>}
                                        {line3 && <span className="text-[clamp(2rem,6.5vw,4.5rem)] opacity-30" style={{ fontFamily: lang === 'en' ? "'Cormorant Garamond', serif" : "'Noto Sans Arabic', sans-serif" }}>{line3}</span>}
                                    </motion.h1>
                                );
                            })()}

                            {/* Minimal Paragraph */}
                            <motion.p 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.4 }}
                                className="text-white/60 text-[clamp(13px,2.8vw,16px)] max-w-[320px] sm:max-w-md lg:max-w-xl whitespace-pre-line leading-[1.7] lg:leading-[1.8] mb-10 lg:mb-12 font-medium"
                                style={{ fontFamily: lang === 'en' ? "'Montserrat', sans-serif" : "'Noto Sans Arabic', sans-serif" }}
                            >
                                {tData(salon.description || (lang === 'ar' 
                                    ? "ادخل إلى عالم يروي فيه كل مظهر قصة. يجمع خبراء الشايب بين التقنيات الأصيلة والفن الحديث لخلق مظهرك الفريد، بأسلوب يعكس شخصيتك ويرتقي بتجربتك."
                                    : "Step into a world where every look tells a story. Our experts merge authentic techniques with modern art to create your unique look, reflecting your personality and elevating your experience."), lang)}
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
                                    className="bg-[#C3D809] hover:bg-white text-black transition-all duration-300 font-black uppercase tracking-widest text-[clamp(11px,2.2vw,13px)] px-10 py-6 flex items-center justify-between sm:justify-start gap-6 w-full sm:w-auto overflow-hidden group min-h-[56px] shadow-[0_15px_35px_rgba(195,216,9,0.15)] focus:scale-95"
                                    style={{ fontFamily: lang === 'en' ? "'Montserrat', sans-serif" : "'Noto Sans Arabic', sans-serif" }}
                                >
                                    <span>{lang === 'ar' ? "احجز موعدك الآن" : "Book Your Appointment"}</span>
                                    <ArrowLeft className={`w-4 h-4 transition-transform ${lang === 'en' ? 'rotate-180 group-hover:translate-x-1.5' : 'group-hover:-translate-x-1.5'}`} />
                                </button>

                                {/* Text Link with Arrow */}
                                <a 
                                    href="#services"
                                    className="text-white/60 hover:text-white uppercase font-bold tracking-widest text-[11px] md:text-xs flex items-center justify-between sm:justify-start gap-3 transition-colors group px-4 py-3 border border-white/10 sm:border-transparent sm:px-0 sm:py-0"
                                    style={{ fontFamily: lang === 'en' ? "'Montserrat', sans-serif" : "'Noto Sans Arabic', sans-serif" }}
                                >
                                    <span>{lang === 'ar' ? "استكشف الخدمات" : "Explore Services"}</span>
                                    <ArrowLeft className={`w-4 h-4 sm:w-3 sm:h-3 transition-transform opacity-60 group-hover:opacity-100 ${lang === 'en' ? 'rotate-180 group-hover:translate-x-2' : 'group-hover:-translate-x-2'}`} />
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
                                {(lang === 'ar' ? [
                                    "قصات دقيقة",
                                    "تلوين وميش الشعر",
                                    "تصفيف الشعر",
                                    "تسريحات المناسبات",
                                    "التجديد العميق",
                                    "العناية باللحية",
                                    "تنظيف البشرة",
                                    "مساج استرخائي"
                                ] : [
                                    "Precision Cuts",
                                    "Hair Coloring",
                                    "Hair Styling",
                                    "Event Hairstyles",
                                    "Deep Restoration",
                                    "Beard Care",
                                    "Skin Cleansing",
                                    "Relax Massage"
                                ]).map((service, j) => (
                                    <div key={j} className="flex items-center gap-8 lg:gap-16 pr-8 lg:pr-16">
                                        <span className="text-white/60 text-[13px] md:text-[15px] font-bold" style={{ fontFamily: lang === 'en' ? "'Montserrat', sans-serif" : "'Tajawal', sans-serif" }}>
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
                <section id="about" className="py-[clamp(64px,10vw,128px)] px-[clamp(16px,5vw,64px)] relative overflow-hidden" style={{ background: "#050505", color: "#F5F2EC" }}>


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
                                <div className={`flex items-center gap-4 ${lang === 'en' ? 'flex-row' : 'flex-row'}`}>
                                    <div className="w-12 h-[1px] bg-[#C3D809]" />
                                    <span className="text-[#C3D809] text-[10px] md:text-[11px] font-bold tracking-widest uppercase opacity-90" style={{ fontFamily: lang === 'en' ? "'Montserrat', sans-serif" : "'Space Mono', monospace" }}>
                                        {tData(salon.about_subtitle || (lang === 'ar' ? "قصتنا وقيمنا" : "Our Story & Values"), lang)}
                                    </span>
                                </div>
                                
                                <h2 className="text-white font-black leading-[1.05] tracking-tight text-[clamp(2rem,6vw,4rem)]" style={{ fontFamily: lang === 'en' ? "'Cormorant Garamond', serif" : "'Noto Sans Arabic', sans-serif" }}>
                                    {tData(salon.about_title || (lang === 'ar' ? "أكثر من مجرد صالون" : "More Than Just A Salon"), lang)}
                                </h2>
                            </div>

                             <div className="space-y-6 text-white/50 text-sm md:text-[15px] leading-[2] lg:leading-[2.2] max-w-xl font-medium" style={{ fontFamily: lang === 'en' ? "'Montserrat', sans-serif" : "'Tajawal', sans-serif" }}>
                                <p>
                                    {tData(salon.about_description || (lang === 'ar' ? "تأسس صالون الشايب في قلب المدينة من شغف حقيقي بالحرفة. نحن نؤمن بأن كل عميل يستحق عناية تفوق المعايير التقليدية. نحن المكان الذي يسود فيه الهدوء والذي يلعب فيه كل تفصيل دوراً مهماً في الارتقاء بمظهرك." : "Founded in the heart of the city out of genuine passion for the craft. We believe every client deserves care beyond traditional standards. We are the place where tranquility reigns and every detail plays a role in elevating your appearance."), lang)}
                                </p>
                            </div>

                            <div className="w-full max-w-xl h-[1px] bg-white/5 my-10" />

                            <div className="grid grid-cols-3 gap-6 sm:gap-10 pt-4">
                                {(lang === 'ar' ? [
                                    { n: salon?.stats_years || "7+", label: "سنوات خبرة" },
                                    { n: salon?.stats_clients || "15K+", label: "عميل راضٍ" },
                                    { n: salon?.stats_experts || "6", label: "خبراء مظهر" }
                                ] : [
                                    { n: salon?.stats_years || "7+", label: "Years Exp" },
                                    { n: salon?.stats_clients || "15K+", label: "Happy Client" },
                                    { n: salon?.stats_experts || "6", label: "Top Experts" }
                                ]).map((stat, i) => {
                                    const numPart = parseInt(stat.n.toString()) || 0;
                                    const suffixPart = stat.n.toString().replace(/[0-9]/g, "");
                                    return (
                                        <div key={i} className="space-y-4">
                                            <h4 className="text-[#C3D809] font-black text-[clamp(1.5rem,5vw,3rem)] tracking-tighter" style={{ fontFamily: "'Playfair Display', 'Oswald', sans-serif" }}>
                                                <AnimatedCounter target={numPart} suffix={suffixPart} />
                                            </h4>
                                            <p className="text-white/40 text-[10px] sm:text-[11px] font-bold leading-[1.6]" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                                                {stat.label.split(' ').map((word, wIdx) => <span key={wIdx} className="block">{word}</span>)}
                                            </p>
                                        </div>
                                    );
                                })}
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
                <section id="services" className="relative overflow-hidden bg-[#0A0A0A] py-[clamp(80px,12vw,160px)] px-[clamp(16px,5vw,64px)]">
                    
                    <div className="relative max-w-7xl mx-auto">
                        
                        {/* Improved Header - Stacked Vertically per user request */}
                        <div className="flex flex-col items-start gap-8 border-b border-white/[0.05] pb-12 mb-16 sm:mb-20 lg:mb-24">
                            <div className="space-y-4 lg:space-y-6">
                                <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex items-center gap-4">
                                    <div className="w-10 h-[1px] bg-[#C3D809]" />
                                    <span className="text-[#C3D809] text-[10px] sm:text-[11px] font-bold tracking-widest uppercase opacity-90" style={{ fontFamily: lang === 'en' ? "'Montserrat', sans-serif" : "'Space Mono', 'Tajawal', monospace" }}>
                                        {tData(salon.services_subtitle || (lang === 'ar' ? "خدمات الصالون" : "Salon Services"), lang)}
                                    </span>
                                </motion.div>
                                <motion.h2 initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="text-white font-black leading-[1.05] tracking-tighter text-[clamp(2.5rem,5vw,5.5rem)]" style={{ fontFamily: lang === 'en' ? "'Montserrat', sans-serif" : "'Noto Sans Arabic', sans-serif" }}>
                                    {tData(salon.services_title || (lang === 'ar' ? "خدمات نخبوية" : "Elite Services"), lang)}
                                </motion.h2>
                            </div>
                            <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className={`${lang === 'ar' ? "text-right" : "text-left"} max-w-2xl`}>
                                <p className="text-white/50 text-sm md:text-[15px] leading-[2] lg:leading-[2.2] font-medium" style={{ fontFamily: lang === 'en' ? "'Montserrat', sans-serif" : "'Tajawal', sans-serif" }}>
                                    {tData(salon.services_description || (lang === 'ar' ? "اختر الخدمة، شاهد لمحة فورية، ثم احجز بضغطة واحدة. تصميم واضح لتجربة راقية وعناية دقيقة تليق بك." : "Choose your service, view an instant glimpse, and book with one click. Clear design for an elegant experience and precise care you deserve."), lang)}
                                </p>
                            </motion.div>
                        </div>

                        <div className="grid lg:grid-cols-[minmax(0,1fr)_450px] gap-16 lg:gap-24 items-start">
                            
                            {/* list of services - Accordion typographic style */}
                            <div className="flex flex-col">
                                {serviceCards.map((s, i) => {
                                    const isActive = activeServiceIndex === i;
                                    return (
                            <motion.button type="button"
                                            initial={{ opacity: 0, x: -15 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: i * 0.08, duration: 0.6, ease: "easeOut" }}
                                            className={[
                                                "group relative w-full overflow-hidden border-b border-white/[0.05] py-7 sm:py-9 transition-colors outline-none",
                                                lang === 'en' ? 'text-left' : 'text-right',
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
                                                            "text-[clamp(1.5rem,5vw,3rem)]",
                                                            isActive ? "text-white" : "text-white/80 group-hover:text-white",
                                                        ].join(" ")}
                                                            style={{ fontFamily: lang === 'en' ? "'Cormorant Garamond', serif" : "'Noto Sans Arabic', sans-serif" }}>
                                                            <span className={isActive ? "text-[#C3D809] transition-colors duration-500" : ""}>{tData(s.name, lang)}</span>
                                                        </h3>
                                                        <div className={`overflow-hidden transition-all duration-500 ${isActive ? "max-h-20 opacity-100 mt-4" : "max-h-0 opacity-0 mt-0"}`}>
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-[1px] w-6 bg-[#C3D809]" />
                                                                <span className="text-[0.65rem] sm:text-[0.75rem] tracking-[0.05em] text-white/50" style={{ fontFamily: lang === 'en' ? "'Montserrat', sans-serif" : "'Tajawal', sans-serif" }}>
                                                                    {lang === 'ar' ? "عناية دقيقة بأدوات احترافية" : "Precise care with professional tools"}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Arrow */}
                                                <div className="flex items-center justify-center shrink-0">
                                                    <ArrowRight size={24} strokeWidth={isActive ? 2.5 : 1.5} className={[
                                                        lang === 'en' ? "transition-all duration-500" : "-rotate-180 transition-all duration-500",
                                                        isActive 
                                                          ? (lang === 'en' ? "text-[#C3D809] translate-x-2" : "text-[#C3D809] -translate-x-2") 
                                                          : "text-white/20 group-hover:text-white/50 scale-90",
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
                                            <div key={`svc-media-${activeServiceIndex}`} className="absolute inset-0 w-full h-full">
                                                {activeServiceCard?.video ? (
                                                    <video
                                                        src={activeServiceCard.video}
                                                        className="w-full h-full object-cover opacity-75 transition-opacity duration-300"
                                                        autoPlay
                                                        muted
                                                        loop
                                                        playsInline
                                                    />
                                                ) : (
                                                    <img
                                                        src={activeServiceCard?.img || activeServiceCard?.fallbackImg}
                                                        alt={activeServiceCard?.name}
                                                        className="w-full h-full object-cover grayscale opacity-70 transition-opacity duration-300"
                                                    />
                                                )}
                                            </div>

                                            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/20 to-transparent" />
                                            
                                            {/* Preview Tag */}
                                            <div className="absolute top-5 right-5 flex items-center gap-2 rounded-full border border-white/10 bg-[#050505]/60 px-3 py-1.5 text-[0.65rem] font-bold tracking-[0.07em] text-white/80 backdrop-blur-md"
                                                style={{ fontFamily: lang === 'en' ? "'Montserrat', sans-serif" : "'Noto Sans Arabic', sans-serif" }}>
                                                {lang === 'ar' ? 'معاينة الحجز' : 'Booking Preview'}
                                                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#C3D809] shadow-[0_0_10px_rgba(195,216,9,0.8)]" />
                                            </div>

                                            {/* Content Footer */}
                                            <div className="absolute bottom-0 left-0 right-0 p-7 sm:p-8">
                                                <p className="mb-2 text-[0.7rem] font-bold tracking-[0.08em] text-[#C3D809]/80 uppercase"
                                                    style={{ fontFamily: lang === 'en' ? "'Montserrat', sans-serif" : "'Noto Sans Arabic', sans-serif" }}>
                                                    {lang === 'ar' ? 'خدمة مختارة' : 'Selected Service'}
                                                </p>
                                                <h3 className="text-[clamp(1.8rem,4vw,2.5rem)] font-black leading-none text-white mb-6" style={{ fontFamily: lang === 'en' ? "'Cormorant Garamond', serif" : "'Noto Sans Arabic', sans-serif" }}>
                                                    {tData(activeServiceCard?.name, lang)}
                                                </h3>
                                                {(activeServiceCard?.price || activeServiceCard?.duration) && (
                                                    <p className="mb-6 text-sm text-white/60 flex items-center gap-4" style={{ fontFamily: lang === 'en' ? "'Montserrat', sans-serif" : "'Noto Sans Arabic', sans-serif" }}>
                                                        {activeServiceCard?.price && <span>{Number(activeServiceCard.price).toFixed(2)} {lang === 'ar' ? 'دينار أردني' : 'JOD'}</span>}
                                                        {activeServiceCard?.duration && <span>{activeServiceCard.duration} {lang === 'ar' ? 'دقيقة' : 'min'}</span>}
                                                    </p>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => setIsBookingOpen(true)}
                                                    className="inline-flex w-full justify-center items-center gap-3 rounded-full border border-white/10 bg-white/5 px-6 py-4 text-sm font-bold text-white transition-all hover:bg-[#C3D809] hover:text-[#050505] hover:border-[#C3D809]"
                                                    style={{ fontFamily: lang === 'en' ? "'Montserrat', sans-serif" : "'Noto Sans Arabic', sans-serif" }}
                                                >
                                                    {lang === 'ar' ? 'احجز الخدمة الآن' : 'Book This Service'}
                                                    <ArrowRight size={18} className={lang === 'en' ? '' : '-rotate-180'} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* thumbnails (scrollable row with navigation arrows) */}
                                    <div className="relative mt-6 px-1 lg:px-2 group">
                                        {/* Left Arrow */}
                                        <button 
                                            type="button"
                                            onClick={() => scrollThumbs('l')} 
                                            className="absolute -left-4 lg:-left-6 top-[calc(50%-4px)] -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/60 hover:text-[#C3D809] hover:border-[#C3D809]/50 transition-all active:scale-95 sm:opacity-0 sm:group-hover:opacity-100"
                                        >
                                            <ChevronLeft size={18} />
                                        </button>

                                        <div ref={thumbRef} className="flex overflow-x-auto gap-3 sm:gap-4 px-1 no-scrollbar pb-2 scroll-smooth">
                                            {serviceCards.map((s, i) => {
                                            const isActive = activeServiceIndex === i;
                                            return (
                                                <button
                                                    key={`thumb-${s.en}`}
                                                    type="button"
                                                    className={[
                                                        "relative overflow-hidden rounded-xl sm:rounded-2xl flex-shrink-0 w-16 sm:w-24 transition-all focus:outline-none",
                                                        isActive ? "border-[2px] border-[#C3D809]" : "border-[1px] border-white/10 hover:border-white/30",
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

                                        {/* Right Arrow */}
                                        <button 
                                            type="button"
                                            onClick={() => scrollThumbs('r')} 
                                            className="absolute -right-4 lg:-right-6 top-[calc(50%-4px)] -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/60 hover:text-[#C3D809] hover:border-[#C3D809]/50 transition-all active:scale-95 sm:opacity-0 sm:group-hover:opacity-100"
                                        >
                                            <ChevronRight size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ═══ TEAM ═══ */}
                {employees.length > 0 && (
                    <section id="team" className="py-[clamp(80px,10vw,160px)] px-[clamp(16px,5vw,48px)]" style={{ background: "#050505" }}>
                        <div className="max-w-[1400px] mx-auto">
                            <div className="flex flex-col items-center text-center">
                                <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex items-center justify-center gap-4 mb-3 sm:mb-4">
                                    <div className="w-8 sm:w-10 h-[1px] bg-white/20" />
                                    <span className="text-[#C3D809] text-[10px] sm:text-[11px] uppercase font-bold tracking-widest opacity-80" style={{ fontFamily: lang === 'en' ? "'Montserrat', sans-serif" : "'Noto Sans Arabic', sans-serif" }}>
                                        {tData(salon.team_subtitle || (lang === 'ar' ? "نخبة الخبراء" : "Our Experts"), lang)}
                                    </span>
                                    <div className="w-8 sm:w-10 h-[1px] bg-white/20" />
                                </motion.div>

                                <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-10 sm:mb-20">
                                    <h2 className="text-white font-black tracking-tighter text-[clamp(2rem,6vw,4.5rem)]" style={{ fontFamily: lang === 'en' ? "'Cormorant Garamond', serif" : "'Noto Sans Arabic', sans-serif" }}>
                                        {tData(salon.team_title || (lang === 'ar' ? "فريقنا من المبدعين" : "Our Creative Team"), lang)}
                                    </h2>
                                    {salon.team_description && !/[\u00d9\u00d8]/.test(salon.team_description) && (
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
                                                className="absolute inset-0 w-full h-full object-cover transition-all duration-[1.2s] grayscale group-hover:grayscale-0 group-hover:scale-110" alt={tData(emp.name, lang)} />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-60 transition-opacity duration-700 group-hover:opacity-30" />
                                            <div className="absolute inset-0 border-[0.5px] border-white/0 group-hover:border-white/10 transition-all duration-700 m-3 sm:m-4 rounded-[1.25rem] sm:rounded-[1.5rem] pointer-events-none" />
                                        </div>
                                        <div className="mt-8 px-4">
                                            <span style={{ fontFamily: lang === 'en' ? "'Montserrat', sans-serif" : "'Noto Sans Arabic', sans-serif", fontSize: "0.7rem", fontWeight: 900, letterSpacing: "0.1em", color: "#C3D809", textTransform: "uppercase" }}>{tData(emp.specialty || (lang === 'ar' ? 'خبير مظهر' : 'Elite Expert'), lang)}</span>
                                            <h3 style={{ fontFamily: lang === 'en' ? "'Cormorant Garamond', serif" : "'Noto Sans Arabic', sans-serif", fontWeight: 800, fontSize: "clamp(1.1rem, 4vw, 1.8rem)", marginTop: 6, color: "#F5F2EC" }}>{tData(emp.name, lang)}</h3>
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
                                <span className="text-white/40 text-[10px] sm:text-[11px] uppercase font-bold tracking-[0.3em]" style={{ fontFamily: lang === 'en' ? "'Montserrat', sans-serif" : "'Space Mono', 'Tajawal', monospace" }}>
                                {lang === 'ar' ? (tData(salon.gallery_subtitle || "إلهام بالصور والفيديو", lang)) : tData(salon.gallery_subtitle || "Visual Gallery", lang)}
                                </span>
                                <div className="w-8 sm:w-10 h-[1px] bg-white/10" />
                            </motion.div>

                            <motion.h2 initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-white font-black tracking-tighter text-[clamp(2.2rem,7vw,5.5rem)]" style={{ fontFamily: lang === 'en' ? "'Cormorant Garamond', serif" : "'Noto Sans Arabic', sans-serif" }}>
                                {tData(salon.gallery_title || (lang === 'ar' ? "فلسفة المظهر" : "Style Philosophy"), lang)}
                            </motion.h2>
                        </div>
                    </div>
                    
                    <div className="flex flex-col gap-8 sm:gap-12">
                        <div className="flex w-full overflow-hidden">
                            <motion.div
                                animate={{ x: ["0%", "-25%"] }}
                                transition={{ ease: "linear", duration: 50, repeat: Infinity }}
                                className="flex gap-6 sm:gap-10 pr-6 sm:pr-10"
                                style={{ width: "max-content" }}
                            >
                                {galleryRowOne.map((item, idx) => 
                                    renderGalleryCard(item, `r1-${idx}`, idx % 2 === 0 ? "w-64 sm:w-[28rem]" : "w-56 sm:w-96", idx % 2 === 0 ? "2/3" : "4/5")
                                )}
                            </motion.div>
                        </div>
                        <div className="flex w-full overflow-hidden relative">
                            <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#070707] to-transparent z-10 pointer-events-none" />
                            <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#070707] to-transparent z-10 pointer-events-none" />
                            <motion.div
                                animate={{ x: ["-25%", "0%"] }}
                                transition={{ ease: "linear", duration: 60, repeat: Infinity }}
                                className="flex gap-6 sm:gap-10 pr-6 sm:pr-10"
                                style={{ width: "max-content" }}
                            >
                                {galleryRowTwo.map((item, idx) => 
                                    renderGalleryCard(item, `r2-${idx}`, idx % 2 !== 0 ? "w-64 sm:w-[26rem]" : "w-56 sm:w-80", idx % 2 !== 0 ? "3/4" : "1/1")
                                )}
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* ═══ REVIEWS (Premium Showcase Style) ═══ */}
                <section id="reviews" className="py-20 sm:py-28 lg:py-40 px-6 lg:px-12 relative overflow-hidden bg-black">
                    {/* Atmospheric Lighting removed per user request */}
                    
                    
                    <div className="max-w-6xl mx-auto relative z-10">
                        <div className="flex flex-col items-center">
                            
                            {/* Section Header */}
                            <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex flex-col items-center mb-16">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-10 h-px bg-[#C3D809]/20" />
                                    <span className="text-[#C3D809] text-[11px] sm:text-[12px] uppercase font-black tracking-[0.5em]" style={{ fontFamily: lang === 'en' ? "'Montserrat', sans-serif" : "'Space Mono', monospace" }}>
                                        {tData(salon.reviews_subtitle || (lang === 'ar' ? "آراء العملاء" : "Client Reviews"), lang)}
                                    </span>
                                    <div className="w-10 h-px bg-[#C3D809]/20" />
                                </div>
                                <h2 className="text-white font-black tracking-tighter text-center leading-none text-[clamp(2rem,6vw,4.5rem)]" style={{ fontFamily: lang === 'en' ? "'Cormorant Garamond', serif" : "'Noto Sans Arabic', sans-serif" }}>
                                    {lang === 'ar' ? (tData(salon.reviews_title || "ماذا يقولون عنا", 'ar').split(' ')[0]) : "What They"} <span className="maqass-brand text-[#C3D809]">{lang === 'ar' ? (tData(salon.reviews_title || "ماذا يقولون عنا", 'ar').split(' ').slice(1).join(' ')) : "Say About Us"}</span>
                                </h2>
                            </motion.div>

                            <div className="relative w-full min-h-[300px]">
                                {mockReviews.length > 0 && (
                                    <AnimatePresence mode="wait">
                                        <motion.div 
                                            key={activeReviewIndex} 
                                            initial={{ opacity: 0, scale: 0.98, y: 20 }} 
                                            animate={{ opacity: 1, scale: 1, y: 0 }} 
                                            exit={{ opacity: 0, scale: 1.02, y: -20 }} 
                                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                                            className="flex flex-col items-center text-center"
                                        >
                                            {/* Rating Stars */}
                                            <div className="flex gap-1.5 mb-8">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star 
                                                        key={i} 
                                                        size={18} 
                                                        fill={i < (salon?.reviews?.[activeReviewIndex]?.rating || 5) ? "#C3D809" : "transparent"} 
                                                        className={i < (salon?.reviews?.[activeReviewIndex]?.rating || 5) ? "text-[#C3D809]" : "text-white/10"} 
                                                    />
                                                ))}
                                            </div>

                                            {/* Large Quote Design */}
                                            <div className="relative px-4 sm:px-12">
                                                {/* Visual Quote Icon Decor */}
                                                <div className="absolute -top-12 -right-8 text-[#C3D809]/5 select-none rotate-12">
                                                    <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor"><path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C20.1216 16 21.017 16.8954 21.017 18V21C21.017 22.1046 20.1216 23 19.017 23H16.017C14.9124 23 14.017 22.1046 14.017 21ZM5 21V18C5 16.8954 5.89543 16 7 16H10C11.1046 16 12 16.8954 12 18V21C12 22.1046 11.1046 23 10 23H7C5.89543 23 5 22.1046 5 21Z"/></svg>
                                                </div>

                                                <h3 className="relative z-10 leading-[1.6] text-white/90 font-medium tracking-tight mb-12 max-w-4xl" 
                                                    style={{ fontFamily: "'Noto Sans Arabic', sans-serif", fontSize: "clamp(1.25rem, 3.5vw, 2.25rem)" }}>
                                                    &ldquo;{tData(mockReviews[activeReviewIndex]?.comment, lang)}&rdquo;
                                                </h3>
                                            </div>
                                            
                                            {/* Customer Signature */}
                                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="flex flex-col items-center">
                                                <div className="w-12 h-1 bg-[#C3D809] mb-6 rounded-full" />
                                                <h4 className="text-white text-lg sm:text-xl font-bold tracking-tight mb-1" style={{ fontFamily: lang === 'en' ? "'Cormorant Garamond', serif" : "'Noto Sans Arabic', sans-serif" }}>
                                                    {tData(mockReviews[activeReviewIndex]?.customer_name, lang)}
                                                </h4>
                                                <span className="text-[#C3D809] text-[11px] font-black uppercase tracking-[0.4em] opacity-60" style={{ fontFamily: lang === 'en' ? "'Montserrat', sans-serif" : "'Noto Sans Arabic', sans-serif" }}>
                                                    {tData(mockReviews[activeReviewIndex]?.role || (lang === 'ar' ? "عميل موثق" : "Verified Client"), lang)}
                                                </span>
                                            </motion.div>
                                        </motion.div>
                                    </AnimatePresence>
                                )}
                            </div>
                            
                            {/* Smart Pagination */}
                            <div className="flex items-center gap-4 mt-16">
                                {mockReviews.map((_: any, i: number) => {
                                    const active = activeReviewIndex === i;
                                    return (
                                        <button 
                                            key={i} 
                                            onClick={() => setActiveReviewIndex(i)} 
                                            className="relative p-2 group outline-none transition-all duration-300 hover:scale-110"
                                        >
                                            <div className={`h-1 rounded-full transition-all duration-700 ease-out-expo ${active ? "w-12 bg-[#C3D809]" : "w-3 bg-white/10 group-hover:bg-white/30"}`} />
                                            {active && (
                                                <motion.div layoutId="review-dot" className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#C3D809]" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                            
                        </div>
                    </div>
                </section>


                {/* ═══ FAQ (Sophisticated Minimalist) ═══ */}
                <section id="faq" className="py-[clamp(64px,12vw,160px)] px-[clamp(16px,5vw,64px)] bg-[#050505]">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex flex-col items-center text-center mb-16 sm:mb-24">
                            <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex items-center justify-center gap-4 mb-3 sm:mb-4">
                                <div className="w-8 sm:w-10 h-[1px] bg-white/10" />
                                <span className="text-white/40 text-[10px] sm:text-[11px] uppercase font-bold tracking-[0.3em]" style={{ fontFamily: lang === 'en' ? "'Montserrat', sans-serif" : "'Space Mono', 'Tajawal', monospace" }}>
                                    {tData(salon.faq_subtitle || (lang === 'ar' ? "لديك استفسار؟" : "HAVE A QUESTION?"), lang)}
                                </span>
                                <div className="w-8 sm:w-10 h-[1px] bg-white/10" />
                            </motion.div>

                            <motion.h2 initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-white text-3xl sm:text-5xl lg:text-7xl font-black tracking-tighter" style={{ fontFamily: lang === 'en' ? "'Cormorant Garamond', serif" : "'Noto Sans Arabic', sans-serif" }}>
                                {tData(salon.faq_title || (lang === 'ar' ? "الأسئلة الشائعة" : "Common Questions"), lang)}
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
                                            className={`w-full py-6 sm:py-9 flex items-center gap-4 group outline-none ${lang === 'en' ? 'flex-row justify-between text-left' : 'flex-row-reverse justify-between text-right'}`}
                                        >
                                            <span 
                                                className={`transition-all duration-500 font-bold text-[clamp(0.95rem,3.5vw,1.25rem)] tracking-tight ${isOpen ? "text-[#C3D809]" : "text-white/80 group-hover:text-white"}`}
                                                style={{ fontFamily: lang === 'en' ? "'Montserrat', sans-serif" : "'Noto Sans Arabic', sans-serif", textAlign: lang === 'en' ? 'left' : 'right' }}
                                            >
                                                {tData(faq.question, lang)}
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
                                                        className={`pb-8 sm:pb-12 text-white/40 leading-[1.8] text-[clamp(0.85rem,3vw,1rem)] max-w-2xl ${lang === 'en' ? 'mr-auto text-left' : 'ml-auto text-right'}`}
                                                        style={{ fontFamily: lang === 'en' ? "'Montserrat', sans-serif" : "'Noto Sans Arabic', sans-serif" }}
                                                    >
                                                        {tData(faq.answer, lang)}
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
                {/* High-Impact High-Visibility Sticker Backdrop */}
                <section className="relative py-48 lg:py-80 overflow-hidden bg-[#020202] flex items-center justify-center">
                    
                    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none">
                        
                        {/* Realistic Floating Tools (Photos from NEW-PIC - Now 100% Transparent) */}
                        <motion.div 
                            initial={{ opacity: 0, x: -50, rotate: -20 }}
                            whileInView={{ opacity: 1, x: 0, rotate: 0 }}
                            animate={{ y: [-20, 20, -20], rotate: [-10, 5, -10] }}
                            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute top-[18%] left-[5%] w-[180px] sm:w-[280px] opacity-100 z-[5]"
                        >
                            <img src="/images/sticker_scissors.svg" alt="Scissors" 
                                 className="w-full h-auto object-contain filter invert brightness-[2.5] drop-shadow-[0_0_40px_rgba(255,255,255,0.6)]" 
                                 style={{ mixBlendMode: 'screen' }} />
                        </motion.div>

                        <motion.div 
                            initial={{ opacity: 0, x: 50, rotate: 20 }}
                            whileInView={{ opacity: 1, x: 0, rotate: 0 }}
                            animate={{ y: [0, -15, 0], rotate: [5, -5, 5] }}
                            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute top-[12%] right-[5%] w-[150px] sm:w-[240px] opacity-100 z-[5]"
                        >
                            <img src="/images/sticker_comb.svg" alt="Comb" 
                                 className="w-full h-auto object-contain filter invert brightness-[2.5] drop-shadow-[0_0_40px_rgba(255,255,255,0.6)]"
                                 style={{ mixBlendMode: 'screen' }} />
                        </motion.div>

                        <motion.div 
                            initial={{ opacity: 0, y: 50, rotate: 10 }}
                            whileInView={{ opacity: 1, y: 0, rotate: 0 }}
                            animate={{ y: [-10, 10, -10], rotate: [2, -2, 2] }}
                            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute bottom-[15%] right-[10%] w-[clamp(140px,30vw,280px)] z-[5] opacity-[0.8]"
                        >
                            <img src="/images/sticker_clipper.svg" alt="Clipper" 
                                 className="w-full h-auto object-contain filter drop-shadow-[0_0_30px_rgba(195,216,9,0.4)]"
                                 style={{ 
                                     filter: "invert(84%) sepia(82%) saturate(4156%) hue-rotate(24deg) brightness(101%) contrast(98%)",
                                     mixBlendMode: 'screen' 
                                 }} />
                        </motion.div>

                        <motion.div 
                            initial={{ opacity: 0, y: -50, rotate: -15 }}
                            whileInView={{ opacity: 1, y: 0, rotate: 0 }}
                            animate={{ y: [15, -15, 15], rotate: [-5, 5, -5] }}
                            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute bottom-[25%] left-[8%] w-[clamp(100px,25vw,240px)] z-[5] opacity-[0.8]"
                        >
                            <img src="/images/sticker_spray.svg" alt="Spray" 
                                 className="w-full h-auto object-contain filter drop-shadow-[0_0_30px_rgba(195,216,9,0.4)]"
                                 style={{ 
                                     filter: "invert(84%) sepia(82%) saturate(4156%) hue-rotate(24deg) brightness(101%) contrast(98%)",
                                     mixBlendMode: 'screen' 
                                 }} />
                        </motion.div>






                    </div>

                    {/* Dramatic Depth Overlays */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black z-[1] pointer-events-none" />
                    <div className="absolute inset-0 bg-black/20 z-[0] pointer-events-none" />
                    
                    <div className="relative z-10 text-center px-6">
                            <motion.div 
                                initial={{ opacity: 0, y: 15 }} 
                                whileInView={{ opacity: 1, y: 0 }} 
                                transition={{ duration: 0.8 }}
                            >
                                {hasDiscount && (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.8 }} 
                                        animate={{ opacity: 1, scale: 1 }} 
                                        className="inline-flex items-center gap-3 px-6 py-3 rounded-full border border-[#C3D809]/30 bg-[#C3D809]/5 backdrop-blur-md mb-8"
                                    >
                                        <div className="w-2 h-2 rounded-full bg-[#C3D809] animate-pulse" />
                                        <span className="text-[#C3D809] text-xs font-black tracking-widest uppercase">
                                            {lang === 'ar' ? `خصم خاص ${discountPercent}% للعملاء الجدد` : `${discountPercent}% SPECIAL DISCOUNT FOR NEW GUESTS`}
                                        </span>
                                    </motion.div>
                                )}

                                <h2 
                                    className="text-white font-bold leading-[1.1] tracking-tight mb-12 italic"
                                    style={{ fontFamily: lang === 'en' ? "'Cormorant Garamond', serif" : "'Noto Sans Arabic', sans-serif", fontSize: "clamp(2.5rem, 8vw, 4.5rem)" }}
                                >
                                    {lang === 'ar' ? <>{"\u0627\u0633\u062a\u0639\u062f"} <span className="text-[#C3D809]">{"\u0644\u0645\u0638\u0647\u0631\u0643"}</span> <br className="hidden sm:block" /> {"\u0627\u0644\u0642\u0627\u062f\u0645"}</> : <>Get Ready For <br className="sm:hidden" /> <span className="text-[#C3D809]">Your Next</span> <br className="hidden sm:block" /> Look</>}
                                </h2>
                                
                                <button 
                                    onClick={() => setIsBookingOpen(true)} 
                                    className="relative overflow-hidden group inline-flex items-center gap-[clamp(16px,4vw,24px)] bg-[#C3D809] text-black px-[clamp(32px,8vw,64px)] py-[clamp(18px,4vh,24px)] text-[clamp(12px,2vw,16px)] font-bold uppercase tracking-[0.2em] transition-all duration-300 hover:bg-white active:scale-95 shadow-[0_20px_50px_rgba(195,216,9,0.3)] min-h-[44px]"
                                    style={{ 
                                        fontFamily: lang === 'en' ? "'Cormorant Garamond', serif" : "'Noto Sans Arabic', sans-serif"
                                    }}
                                >
                                    <span className="relative z-10 tracking-widest">{lang === 'ar' ? "\u0627\u062d\u062c\u0632 \u0645\u0648\u0639\u062f\u0643 \u0627\u0644\u0622\u0646" : "Book Your Appointment"}</span>
                                    <ArrowRight size={20} className={`relative z-10 transition-transform duration-500 ${lang === 'en' ? 'group-hover:translate-x-2' : '-rotate-180 group-hover:-translate-x-2'}`} />
                                    
                                    {/* Sweep Effect */}
                                    <div className="absolute inset-0 bg-white/20 translate-y-[101%] group-hover:translate-y-0 transition-transform duration-500"></div>
                                </button>
                            </motion.div>
                        </div>
                    </section>
            </main>
            
            <footer id="contact" className="py-[clamp(48px,10vw,96px)] px-[clamp(16px,5vw,64px)] bg-[#050505] border-t border-white/[0.03]">
                    <div className="max-w-7xl mx-auto">
                        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 lg:gap-12 ${lang === 'en' ? 'text-left' : 'text-right'}`}>
                            {/* Brand Info */}
                            <div className="space-y-10">
                                <h3 className="text-white font-black tracking-tighter" style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.8rem, 5vw, 2.5rem)" }}>
                                    {tData(salon.name, lang)}<span className="text-[#C3D809]">.</span>
                                </h3>
                                <p className="text-white/30 leading-relaxed text-[clamp(12px,2vw,14px)] max-w-[280px]" style={{ fontFamily: lang === 'en' ? "'Montserrat', sans-serif" : "'Noto Sans Arabic', sans-serif" }}>
                                    {tData(salon.secondary_description || salon.description || (lang === 'ar' ? "تجربة استثنائية تجمع بين الفن العريق والأسلوب المعاصر في قلب المدينة." : "An exceptional experience combining ancient art and contemporary style in the heart of the city."), lang)}
                                </p>
                                {hasDiscount && (
                                    <div className="inline-block p-5 rounded-3xl border border-white/5 bg-white/[0.01]" style={{ fontFamily: lang === 'en' ? "'Montserrat', sans-serif" : "'Noto Sans Arabic', sans-serif" }}>
                                        <p className="text-[#C3D809] font-black text-xl mb-1">{lang === 'ar' ? `احصل على ${salon.discount_percentage ?? '30'}% خصم` : `Get ${salon.discount_percentage ?? '30'}% OFF`}</p>
                                        <p className="text-white/10 text-[0.65rem] uppercase tracking-[0.25em] font-black">{lang === 'ar' ? "\u0639\u0644\u0649 \u0632\u064a\u0627\u0631\u062a\u0643 \u0627\u0644\u0623\u0648\u0644\u0649 \u0644\u0644\u0635\u0627\u0644\u0648\u0646" : "ON YOUR FIRST VISIT"}</p>
                                    </div>
                                )}
                            </div>

                            {/* Links */}
                            <div className={lang === 'ar' ? 'lg:pr-10' : 'lg:pl-10'}>
                                <span className="text-[#C3D809] text-[11px] uppercase font-black tracking-wide mb-8 block" style={{ fontFamily: lang === 'en' ? "'Montserrat', sans-serif" : "'Tajawal', 'Noto Sans Arabic', sans-serif" }}>{lang === 'ar' ? "قائمة الروابط" : "Quick Links"}</span>
                                <ul className="space-y-5">
                                    {(lang === 'ar' ? [{ name: "\u0642\u0635\u062a\u0646\u0627", id: "about" }, { name: "\u062e\u062f\u0645\u0627\u062a\u0646\u0627", id: "services" }, { name: "\u0641\u0631\u064a\u0642\u0646\u0627", id: "team" }, { name: "\u0627\u0644\u062e\u0635\u0648\u0635\u064a\u0629", id: "privacy" }] : [{ name: "Story", id: "about" }, { name: "Services", id: "services" }, { name: "Team", id: "team" }, { name: "Privacy", id: "privacy" }]).map(link => (
                                        <li key={link.id}>
                                            <a href={`#${link.id}`} className="text-white/50 hover:text-white transition-all duration-300 text-[0.95rem] font-medium" style={{ fontFamily: lang === 'en' ? "'Montserrat', sans-serif" : "'Noto Sans Arabic', sans-serif" }}>
                                                {link.name}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Work Hours */}
                            <div>
                                <span className="text-[#C3D809] text-[11px] uppercase font-black tracking-wide mb-8 block" style={{ fontFamily: lang === 'en' ? "'Montserrat', sans-serif" : "'Tajawal', 'Noto Sans Arabic', sans-serif" }}>{lang === 'ar' ? "\u0623\u0648\u0642\u0627\u062a \u0627\u0644\u0639\u0645\u0644" : "Working Hours"}</span>
                                <div className="space-y-8">
                                    <div className="space-y-1">
                                        <p className="text-white/80 font-black text-lg" style={{ fontFamily: lang === 'en' ? "'Montserrat', sans-serif" : "'Noto Sans Arabic', sans-serif", textAlign: lang === 'en' ? 'left' : 'right' }} dir={lang === 'en' ? 'ltr' : 'rtl'}>
                                            {formatOpenDays()}
                                        </p>
                                        <p className="text-white/20 text-[0.75rem] uppercase tracking-wide font-bold" style={{ fontFamily: lang === 'en' ? "'Montserrat', sans-serif" : "'Tajawal', 'Noto Sans Arabic', sans-serif" }}>{lang === 'ar' ? "\u0627\u0644\u0623\u064a\u0627\u0645 \u0627\u0644\u0645\u062a\u0627\u062d\u0629" : "AVAILABLE DAYS"}</p>
                                    </div>
                                    <div className="pt-2">
                                        <div className="flex items-center gap-4 group">
                                            {/* Clock Icon with Pulse */}
                                            <div className="relative">
                                                <div className="w-10 h-10 rounded-xl border border-[#C3D809]/10 flex items-center justify-center bg-[#C3D809]/5 text-[#C3D809] group-hover:scale-105 transition-transform duration-500">
                                                    <Clock size={16} strokeWidth={2.5} />
                                                </div>
                                                {(() => {
                                                    const now = new Date();
                                                    const [sh, sm] = workHours.start.split(":").map(Number);
                                                    const [eh, em] = workHours.end.split(":").map(Number);
                                                    const curMin = now.getHours() * 60 + now.getMinutes();
                                                    const startMin = sh * 60 + sm;
                                                    let endMin = eh * 60 + em;
                                                    if (endMin <= startMin) endMin += 24 * 60;
                                                    
                                                    const isOpen = curMin >= startMin && curMin < endMin && !offDays.includes(now.getDay());
                                                    if (isOpen) {
                                                        return <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-[#C3D809] rounded-full border-[2px] border-[#0A0A0A] animate-pulse shadow-[0_0_10px_rgba(195,216,9,0.5)]" />;
                                                    }
                                                    return null;
                                                })()}
                                            </div>

                                            {/* Time Display */}
                                            <div className="flex flex-col gap-0.5">
                                                <div className="flex items-center gap-2.5" dir="ltr">
                                                    {(() => {
                                                        const start = fmt12(workHours.start, lang).split(" ");
                                                        const end = fmt12(workHours.end, lang).split(" ");
                                                        return (
                                                            <>
                                                                <div className="flex items-baseline gap-1">
                                                                    <span className="text-[1.3rem] font-black text-white tracking-tighter leading-none" style={{ fontFamily: "'Oswald', sans-serif" }}>{start[0]}</span>
                                                                    <span className="text-[9px] font-black text-[#C3D809] uppercase tracking-widest opacity-60">{start[1]}</span>
                                                                </div>
                                                                <div className="w-4 h-[1px] bg-white/10" />
                                                                <div className="flex items-baseline gap-1">
                                                                    <span className="text-[1.3rem] font-black text-white tracking-tighter leading-none" style={{ fontFamily: "'Oswald', sans-serif" }}>{end[0]}</span>
                                                                    <span className="text-[9px] font-black text-[#C3D809] uppercase tracking-widest opacity-60">{end[1]}</span>
                                                                </div>
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                                <div className="flex items-center gap-1.5 opacity-30">
                                                    <div className="w-1 h-1 rounded-full bg-[#C3D809]" />
                                                    <span className="text-[8px] font-black tracking-[0.2em] uppercase text-white">{lang === 'ar' ? 'متصل الآن' : 'ONLINE NOW'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Contact & Social */}
                            <div>
                                <span className="text-[#C3D809] text-[11px] uppercase font-black tracking-wide mb-8 block" style={{ fontFamily: lang === 'en' ? "'Montserrat', sans-serif" : "'Tajawal', 'Noto Sans Arabic', sans-serif" }}>{lang === 'ar' ? "\u062a\u0648\u0627\u0635\u0644 \u0645\u0639\u0646\u0627" : "Contact Us"}</span>
                                <div className="space-y-8">
                                    <a href={`tel:${salon.phone}`} className={`block group ${lang === 'en' ? 'text-left' : 'text-right'}`}>
                                        <p className="text-white text-lg font-black group-hover:text-[#C3D809] transition-colors" dir="ltr">{salon.phone || "0785295125"}</p>
                                        <p className="text-white/20 text-[0.7rem] uppercase tracking-widest font-bold mt-1">{lang === 'ar' ? "\u0627\u062a\u0635\u0644 \u0628\u0646\u0627" : "CALL US"}</p>
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
                                © {new Date().getFullYear()} {tData(salon.name, lang)} . ALL RIGHTS RESERVED
                            </div>
                        </div>
                    </div>
                </footer>

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
                        subtotal={subtotal}
                        totalPrice={totalPrice}
                        hasDiscount={hasDiscount}
                        discountPercent={discountPercent}
                        totalDur={totalDur}
                        selSrvs={selSrvs}
                        submitting={submitting}
                        error={error}
                        submitBooking={submitBooking}
                        toggleSrv={toggleSrv}
                        lang={lang}
                        tData={tData}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

export default function BookingClient({ params }: { params: { slug: string } }) {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A0A0A" }}>
                <div className="w-10 h-10 rounded-full animate-spin" style={{ border: "3px solid rgba(195,216,9,0.15)", borderTopColor: "#C3D809" }} />
            </div>
        }>
            <BookingContent params={params} />
        </Suspense>
    );
}
