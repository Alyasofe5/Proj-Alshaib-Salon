"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  CalendarCheck, BarChart3, Users, Wallet,
  PenLine, Settings, Rocket, Mail, Phone, MapPin, Menu, X, ArrowLeft, Play, Lock, Check,
  Store, Star
} from "lucide-react";
import MaqassLogoIcon from "@/components/ui/MaqassLogoIcon";

/* Dynamic import — keeps Three.js OUT of the critical bundle */
const SPARKLE_LOADING = [0, 1, 2, 3, 4].map(i => ({
  top: `${15 + Math.sin(i * 1.4) * 35}%`,
  left: `${15 + Math.cos(i * 1.3) * 35}%`,
  animationDuration: `${2.5 + i * 0.5}s`,
  animationDelay: `${i * 0.6}s`,
}));

const BarberChair3D = dynamic(() => import("@/components/BarberChair3D"), {
  ssr: false,
  loading: () => (
    <div className="relative w-[280px] h-[280px] sm:w-[350px] sm:h-[350px] md:w-[450px] md:h-[450px] flex items-center justify-center">
      <div className="absolute inset-0 blur-[100px] opacity-20" style={{ background: "radial-gradient(circle, #C8A84B, transparent 60%)" }} />
      <div className="absolute inset-[10%] rounded-full border opacity-15" style={{ borderColor: "#C8A84B" }} />
      <div className="absolute inset-[5%] rounded-full border opacity-8 animate-spin" style={{ borderColor: "#E8D08A", animationDuration: "30s", animationTimingFunction: "linear" }} />
      {SPARKLE_LOADING.map((pos, i) => (
        <div key={i} className="absolute w-1.5 h-1.5 rounded-full animate-ping" style={{ ...pos, background: "#C8A84B", opacity: 0.5 }} />
      ))}
      <div className="w-10 h-10 rounded-full border-2 border-transparent border-t-[#C8A84B] border-r-[#C8A84B] animate-spin z-10" />
    </div>
  ),
});

// ===== Animated Counter =====
function Counter({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!isInView) return;
    let current = 0;
    const increment = value / 60;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) { setCount(value); clearInterval(timer); }
      else setCount(Math.floor(current));
    }, 33);
    return () => clearInterval(timer);
  }, [isInView, value]);
  return <span ref={ref}>{value % 1 !== 0 ? count.toFixed(1) : count.toLocaleString()}{suffix}</span>;
}

// ===== Floating Stat Card (Light) =====
function StatCard({ children, className = "", cardClass = "" }: { children: React.ReactNode; className?: string; cardClass?: string }) {
  return (
    <div
      className={`rounded-2xl px-5 py-4 ${className} ${cardClass}`}
      style={{
        background: "var(--white)",
        border: "1px solid var(--border)",
        boxShadow: "0 8px 32px rgba(230,179,30,.15)",
      }}
    >
      {children}
    </div>
  );
}

const FEATURES = [
  { icon: <CalendarCheck size={24} style={{ color: "var(--gold)" }} />, title: "حجوزات ذكية", desc: "رابط فريد لكل صالون. زبائنك يحجزون بدون اتصال 24/7", stat: "+280%", statLabel: "حجوزات أكثر" },
  { icon: <BarChart3 size={24} style={{ color: "var(--gold)" }} />, title: "تحليلات متقدمة", desc: "تقارير يومية وشهرية. اعرف أداء كل موظف بلمحة", stat: "-45%", statLabel: "وقت إداري" },
  { icon: <Users size={24} style={{ color: "var(--gold)" }} />, title: "إدارة الفريق", desc: "عمولات ورواتب تلقائية. سجل لكل موظف", stat: "+3.2h", statLabel: "وقت موفّر يومياً" },
  { icon: <Wallet size={24} style={{ color: "var(--gold)" }} />, title: "مصاريف وأرباح", desc: "سجّل مصاريفك وراقب أرباحك بدقة", stat: "99.9%", statLabel: "دقة التقارير" },
];

interface ApiPlan {
  id: number; name: string; name_ar: string;
  price: string; features: string[]; is_popular: boolean;
}

const FALLBACK_PLANS: ApiPlan[] = [
  { id: 2, name: "Basic", name_ar: "أساسي", price: "10.000", is_popular: false, features: ["عدد موظفين غير محدود", "إدارة المصاريف", "كشوفات مالية شهرية", "دعم فني خلال 24 ساعة", "تتبع لسير العمل بشكل كامل"] },
  { id: 3, name: "Professional", name_ar: "احترافي", price: "18.000", is_popular: true, features: ["موظفين غير محدود", "حجوزات غير محدودة", "تقارير متقدمة", "إشعارات واتساب", "دعم فني أولوية", "تخصيص كامل"] },
  { id: 4, name: "Enterprise", name_ar: "مؤسسات", price: "32.000", is_popular: false, features: ["إدارة فروع متعددة", "ربط API مخصص", "شامل مميزات الاحترافي"] },
];

// ============================================================
export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroScale  = useTransform(scrollYProgress, [0, 0.15], [1, 0.97]);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [plans, setPlans]     = useState<ApiPlan[]>(FALLBACK_PLANS);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL || "/api";
    fetch(`${API}/public/plans.php`)
      .then(r => r.ok ? r.json() : null)
      .then(res => {
        if (res?.data?.length) {
          // Never display the free plan publicly in pricing section
          const paid = res.data.filter((p: ApiPlan) => parseFloat(p.price) > 0);
          if (paid.length) setPlans(paid);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{ background: "var(--off-white)", color: "var(--text-main)", fontFamily: "'Cairo', 'Tajawal', sans-serif" }}
    >

      {/* ==================== NAVBAR ==================== */}
      <nav
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${scrolled ? "py-3" : "py-4"}`}
        style={{
          background: scrolled ? "rgba(20,20,20,.92)" : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(230,179,30,.08)" : "1px solid transparent",
        }}
      >
        <div className="relative max-w-7xl mx-auto flex items-center px-4 md:px-6" dir="rtl">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group z-10" onClick={() => setMenuOpen(false)}>
            <div className="transition-transform duration-500 group-hover:scale-110 flex-shrink-0">
              <MaqassLogoIcon size={40} />
            </div>
            <div className="flex flex-col">
              <span
                className="text-[18px] md:text-[20px] font-black tracking-wider leading-none"
                style={{ color: "var(--gold)" }}
              >MAQASS</span>
              <span className="text-[8px] font-semibold tracking-[.2em] mt-0.5" style={{ color: "var(--text-muted)" }}>SALON PLATFORM</span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-1">
            {["المميزات", "كيف يعمل", "الباقات", "تواصل"].map((l, i) => (
              <a key={i} href={`#${["features", "how", "pricing", "contact"][i]}`}
                className="px-4 py-1.5 text-sm font-semibold transition-colors duration-200 inline-flex flex-col items-center gap-0.5 group"
                style={{ color: "var(--color-text-secondary)" }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--color-accent)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--color-text-secondary)"; }}
              >
                <span>{l}</span>
                <span className="h-[2px] w-0 group-hover:w-full transition-all duration-200 rounded-full"
                  style={{ background: "var(--color-accent)" }} />
              </a>
            ))}
          </div>

          {/* CTA */}
          <div className="flex items-center gap-2 mr-auto z-10">
            <Link href="/login" className="hidden md:block text-sm font-semibold px-4 py-2 transition-colors"
              style={{ color: "var(--text-mid)" }}>تسجيل الدخول</Link>
            <Link href="/contact?from=free"
              className="hidden sm:flex items-center gap-1.5 text-sm font-bold px-4 py-2 md:px-5 md:py-2.5 rounded-full transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg, var(--gold), var(--gold-light))", color: "var(--btn-text)", boxShadow: "0 4px 16px rgba(200,168,75,.3)" }}
            >ابدأ مجاناً</Link>

            {/* Mobile hamburger */}
            <button onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg transition-colors"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              {menuOpen
                ? <X size={18} style={{ color: "var(--text-main)" }} />
                : <Menu size={18} style={{ color: "var(--text-main)" }} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden absolute top-full inset-x-0 py-4 px-4 shadow-lg" dir="rtl"
            style={{ background: "var(--off-white)", borderBottom: "1px solid var(--border)" }}>
            <div className="flex flex-col gap-1">
              {[["المميزات", "features"], ["كيف يعمل", "how"], ["الباقات", "pricing"], ["تواصل", "contact"]].map(([l, id]) => (
                <a key={id} href={`#${id}`} onClick={() => setMenuOpen(false)}
                  className="px-4 py-3 rounded-xl text-sm font-semibold transition-all"
                  style={{ color: "var(--text-mid)" }}
                >{l}</a>
              ))}
              <div className="mt-2 pt-2 flex flex-col gap-2" style={{ borderTop: "1px solid var(--border)" }}>
                <Link href="/login" onClick={() => setMenuOpen(false)}
                  className="px-4 py-3 rounded-xl text-sm font-semibold"
                  style={{ color: "var(--text-mid)" }}>تسجيل الدخول</Link>
                <Link href="/contact?from=free" onClick={() => setMenuOpen(false)}
                  className="px-4 py-3 rounded-xl text-sm font-bold text-center"
                  style={{ background: "linear-gradient(135deg, var(--gold), var(--gold-light))", color: "var(--btn-text)" }}
                >ابدأ مجاناً ←</Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ==================== HERO ==================== */}
      <section className="relative min-h-[100svh] w-full flex flex-col items-center justify-center overflow-hidden pt-20 pb-16" dir="rtl">
        
        {/* ── Cinematic Background Image ── */}
        <div className="absolute inset-0 z-0">
          <img src="/hero-bg.png" alt="" className="absolute inset-0 w-full h-full object-cover" style={{ filter: "brightness(0.25) saturate(1.3)" }} />
          {/* Multi-layer overlay for depth */}
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(17,17,17,0.7) 0%, rgba(17,17,17,0.4) 40%, rgba(17,17,17,0.85) 100%)" }} />
          {/* Gold vignette glow */}
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 50% at 50% 50%, rgba(230,179,30,0.06) 0%, transparent 70%)" }} />
          {/* Noise overlay */}
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%270 0 256 256%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.85%27 numOctaves=%274%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23n)%27/%3E%3C/svg%3E')" }} />
        </div>

        {/* CSS animations */}
        <style jsx>{`
          @keyframes hero-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
          @keyframes hero-float-delay { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
          @keyframes hero-pulse-glow { 0%,100%{opacity:0.4} 50%{opacity:0.7} }
          @keyframes hero-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
          @keyframes hero-line-grow { 0%{width:0} 100%{width:80px} }
          @keyframes dash-progress { 0%{width:0} 100%{width:100%} }
          @keyframes dash-count { 0%{opacity:0;transform:translateY(8px)} 100%{opacity:1;transform:translateY(0)} }
        `}</style>

        <div className="relative z-10 w-full max-w-6xl mx-auto text-center flex flex-col items-center flex-1 justify-center">
          
          {/* ── 3D Perspective Wrapper ── */}
          <div className="w-full" style={{ perspective: "1200px" }}>

            {/* ── Main Hero Grid: Text + Floating Cards ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 items-center w-full px-4 md:px-8">

              {/* ── Left Column: Text Content ── */}
              <div className="text-right order-2 lg:order-1">

                {/* Gold accent line */}
                <motion.div
                  initial={{ width: 0 }} animate={{ width: 80 }} transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="h-[3px] rounded-full mb-6 ml-auto"
                  style={{ background: "linear-gradient(to left, #E6B31E, transparent)" }}
                />

                {/* Eyebrow */}
                <motion.div
                  initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
                  style={{ background: "rgba(230,179,30,0.08)", border: "1px solid rgba(230,179,30,0.2)", backdropFilter: "blur(8px)" }}
                >
                  <Rocket size={13} style={{ color: "#E6B31E" }} />
                  <span className="text-xs font-semibold" style={{ color: "#E6B31E" }}>المنصة #1 لإدارة الصالونات</span>
                </motion.div>

                {/* Main Heading */}
                <motion.h1
                  initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[1.08] tracking-tight mb-5 sm:mb-6"
                >
                  <span style={{ color: "#FCFAF1" }}>أدِر صالونك</span>
                  <br />
                  <span className="relative inline-block mt-1">
                    <span style={{
                      background: "linear-gradient(90deg, #E6B31E, #FFD700, #E6B31E, #FFD700)",
                      backgroundSize: "200% 100%",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                      animation: "hero-shimmer 4s linear infinite",
                    }}>
                      كالمحترفين.
                    </span>
                  </span>
                </motion.h1>

                {/* Subheading */}
                <motion.p
                  initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.35 }}
                  className="text-sm sm:text-base md:text-lg lg:text-xl leading-relaxed mb-6 sm:mb-8 max-w-xl"
                  style={{ color: "rgba(255,255,255,0.6)" }}
                >
                  حجوزات ذكية، إدارة موظفين، تقارير مالية فورية — كل ما تحتاجه في منصة واحدة مصممة للصالونات الطموحة.
                </motion.p>

                {/* CTA Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.45 }}
                  className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-8"
                >
                  <Link href="/contact?from=free"
                    className="group relative inline-flex items-center gap-2 sm:gap-2.5 px-6 py-3.5 sm:px-8 sm:py-4 rounded-xl text-sm font-black overflow-hidden transition-all duration-300 hover:-translate-y-0.5"
                    style={{ background: "#E6B31E", color: "#111", boxShadow: "0 0 0 1px rgba(230,179,30,.3), 0 12px 40px -8px rgba(230,179,30,.5)" }}
                  >
                    <span className="relative z-10">ابدأ مجاناً</span>
                    <ArrowLeft size={16} className="relative z-10 transition-transform group-hover:-translate-x-1" />
                    <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-700 skew-x-12" />
                  </Link>
                  <a href="#features"
                    className="inline-flex items-center gap-2 sm:gap-2.5 px-6 py-3.5 sm:px-8 sm:py-4 rounded-xl text-sm font-bold transition-all duration-300 hover:bg-white/[0.06]"
                    style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", color: "rgba(255,255,255,.8)", backdropFilter: "blur(10px)" }}
                  >
                    <span>شاهد كيف يعمل</span>
                    <Play size={14} className="text-[#E6B31E]" />
                  </a>
                </motion.div>

                {/* Trust row */}
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.6 }}
                  className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px]"
                  style={{ color: "rgba(255,255,255,.4)" }}
                >
                  {["بدون بطاقة ائتمان", "إعداد في 5 دقائق", "دعم فوري"].map((t, i) => (
                    <span key={i} className="flex items-center gap-1.5">
                      <Check size={12} style={{ color: "#E6B31E" }} />{t}
                    </span>
                  ))}
                </motion.div>
              </div>

              {/* ── Right Column: 3D Barber Chair ── */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="relative order-1 lg:order-2 w-full hidden sm:flex items-center justify-center"
              >
                {/* 3D Chair */}
                <div className="relative z-10">
                  <BarberChair3D />
                </div>

                {/* Floating glass micro-cards around the chair */}
                <motion.div
                  animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-4 sm:top-8 left-0 sm:-left-4 z-20 flex items-center gap-2 px-3 py-2.5 rounded-xl"
                  style={{ background: "rgba(22,22,22,.92)", border: "1px solid rgba(230,179,30,.15)", boxShadow: "0 12px 40px rgba(0,0,0,.5)", backdropFilter: "blur(16px)" }}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(230,179,30,.12)" }}>
                    <Store size={16} style={{ color: "#E6B31E" }} />
                  </div>
                  <div>
                    <div className="text-sm font-black" style={{ color: "#E6B31E" }}>200+</div>
                    <div className="text-[9px] font-semibold" style={{ color: "rgba(255,255,255,.4)" }}>صالون يثق بنا</div>
                  </div>
                </motion.div>

                <motion.div
                  animate={{ y: [0, -8, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
                  className="absolute top-4 sm:top-8 right-0 sm:-right-2 z-20 flex items-center gap-2 px-3 py-2.5 rounded-xl"
                  style={{ background: "rgba(22,22,22,.92)", border: "1px solid rgba(52,211,153,.15)", boxShadow: "0 12px 40px rgba(0,0,0,.5)", backdropFilter: "blur(16px)" }}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(52,211,153,.12)" }}>
                    <CalendarCheck size={16} style={{ color: "#34D399" }} />
                  </div>
                  <div>
                    <div className="text-sm font-black" style={{ color: "#34D399" }}>50K+</div>
                    <div className="text-[9px] font-semibold" style={{ color: "rgba(255,255,255,.4)" }}>حجز تم إنجازه</div>
                  </div>
                </motion.div>

                <motion.div
                  animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                  className="absolute bottom-8 sm:bottom-12 left-2 sm:-left-2 z-20 flex items-center gap-2 px-3 py-2.5 rounded-xl"
                  style={{ background: "rgba(22,22,22,.92)", border: "1px solid rgba(255,215,0,.15)", boxShadow: "0 12px 40px rgba(0,0,0,.5)", backdropFilter: "blur(16px)" }}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,215,0,.12)" }}>
                    <Star size={16} style={{ color: "#FFD700" }} />
                  </div>
                  <div>
                    <div className="text-sm font-black" style={{ color: "#FFD700" }}>98%</div>
                    <div className="text-[9px] font-semibold" style={{ color: "rgba(255,255,255,.4)" }}>رضا العملاء</div>
                  </div>
                </motion.div>

                {/* Floating notification — bottom right */}
                <motion.div
                  animate={{ y: [0, -8, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -bottom-2 right-4 sm:-right-4 z-20 flex items-center gap-2.5 px-4 py-3 rounded-xl"
                  style={{ background: "rgba(22,22,22,.96)", border: "1px solid rgba(52,211,153,.2)", boxShadow: "0 16px 48px rgba(0,0,0,.6)", backdropFilter: "blur(16px)" }}
                >
                  <div className="relative flex h-2.5 w-2.5 flex-shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "#34D399" }} />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: "#34D399" }} />
                  </div>
                  <div>
                    <div className="text-xs font-bold" style={{ color: "#FCFAF1" }}>حجز جديد <span style={{ color: "#34D399" }}>✓</span></div>
                    <div className="text-[9px]" style={{ color: "#777" }}>الآن · خالد أحمد</div>
                  </div>
                </motion.div>

              </motion.div>
            </div>
          </div>

          {/* ── Bottom Social Proof ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.9 }}
            className="flex items-center justify-center gap-5 mt-8 md:mt-12"
          >
            <div className="flex -space-x-2 rtl:space-x-reverse">
              {[
                "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&q=80",
                "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&q=80",
                "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=40&h=40&fit=crop&q=80",
              ].map((src, i) => (
                <img key={i} src={src} alt="" className="w-8 h-8 rounded-full object-cover" style={{ border: "2px solid rgba(17,17,17,.8)" }} loading="lazy" />
              ))}
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-[9px] font-black" style={{ background: "rgba(230,179,30,.15)", color: "#E6B31E", border: "2px solid rgba(17,17,17,.8)" }}>+97</div>
            </div>
            <div>
              <div className="flex items-center gap-0.5 mb-0.5">
                {[1,2,3,4,5].map(s => <span key={s} style={{ color: "#E6B31E", fontSize: 11 }}>★</span>)}
                <span className="text-[10px] mr-1" style={{ color: "rgba(255,255,255,.4)" }}>4.9</span>
              </div>
              <div className="text-[11px] font-semibold" style={{ color: "rgba(255,255,255,.5)" }}>+200 صالون يثقون بنا</div>
            </div>
          </motion.div>

        </div>

        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20">
          <motion.div
            animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }}
            className="flex flex-col items-center gap-1"
          >
            <div className="text-[9px] font-semibold mb-1" style={{ color: "rgba(255,255,255,.25)" }}>اكتشف المزيد</div>
            <div className="w-5 h-8 rounded-full flex items-start justify-center pt-1.5" style={{ border: "1.5px solid rgba(255,255,255,.12)" }}>
              <div className="w-1 h-1.5 rounded-full" style={{ background: "#E6B31E", animation: "hero-float 1.5s ease-in-out infinite" }} />
            </div>
          </motion.div>
        </div>

      </section>

      {/* ==================== FEATURES ==================== */}
      <section id="features" className="relative py-16 md:py-24 lg:py-28 px-4 md:px-6" dir="rtl"
        style={{ background: "linear-gradient(180deg, #343434 0%, #3D3D3D 60%, #343434 100%)" }}>
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-10 md:mb-16 lg:mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-6"
              style={{ background: "rgba(230,179,30,.08)", border: "1px solid rgba(230,179,30,.2)", color: "var(--gold)" }}>
              المميزات
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4" style={{ color: "var(--text-main)" }}>
              كل ما تحتاجه
              <br />
              <span style={{ color: "var(--gold)" }}>في مكان واحد</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {FEATURES.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }} viewport={{ once: true }}
                className="group relative rounded-2xl md:rounded-3xl p-5 md:p-7 transition-all duration-500 cursor-default hover:shadow-lg"
                style={{ background: "var(--white)", border: "1px solid var(--border)", boxShadow: "0 4px 24px var(--shadow)" }}>
                <div className="absolute inset-0 rounded-2xl md:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: "linear-gradient(135deg, rgba(230,179,30,.08), rgba(230,179,30,.06))", border: "1px solid rgba(230,179,30,.16)" }} />
                <div className="relative z-10 flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-all group-hover:scale-110"
                      style={{ background: "rgba(230,179,30,.14)", border: "1px solid rgba(230,179,30,.2)" }}>
                      {f.icon}
                    </div>
                    <h3 className="text-lg font-bold mb-2 transition-colors group-hover:text-[#8B6E2A]"
                      style={{ color: "var(--text-main)" }}>{f.title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-mid)" }}>{f.desc}</p>
                  </div>
                  <div className="text-left flex-shrink-0">
                    <div className="text-2xl font-black" style={{ color: "var(--gold)" }}>{f.stat}</div>
                    <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>{f.statLabel}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== HOW IT WORKS ==================== */}
      <section id="how" className="relative py-16 md:py-24 lg:py-32 px-4 md:px-6" dir="rtl"
        style={{ background: "var(--off-white)" }}>
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-10 md:mb-16 lg:mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-6"
              style={{ background: "rgba(230,179,30,.08)", border: "1px solid rgba(230,179,30,.2)", color: "var(--gold)" }}>
              ببساطة
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black" style={{ color: "var(--text-main)" }}>
              ثلاث خطوات <span style={{ color: "var(--gold)" }}>لتبدأ</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {[
              { num: "01", icon: <PenLine size={24} style={{ color: "var(--gold)" }} />, title: "سجّل صالونك", desc: "أنشئ حسابك في أقل من 5 دقائق. بدون بطاقة ائتمان." },
              { num: "02", icon: <Settings size={24} style={{ color: "var(--gold)" }} />, title: "خصّص إعداداتك", desc: "أضف خدماتك وأسعارك وفريق عملك بسهولة." },
              { num: "03", icon: <Rocket size={24} style={{ color: "var(--gold)" }} />, title: "ابدأ الآن", desc: "شارك رابط الحجز وابدأ باستقبال الزبائن." },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.2 }} viewport={{ once: true }}
                className="relative text-center group">
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-5 sm:mb-6 rounded-2xl flex items-center justify-center relative transition-transform group-hover:scale-110"
                  style={{ background: "rgba(230,179,30,.08)", border: "1px solid rgba(230,179,30,.2)" }}>
                  {s.icon}
                  <div className="absolute -top-2 -right-2 w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center text-[10px] sm:text-[11px] font-black"
                    style={{ background: "linear-gradient(135deg, var(--gold), var(--gold-dark))", color: "var(--btn-text)" }}>
                    {s.num}
                  </div>
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2" style={{ color: "var(--text-main)" }}>{s.title}</h3>
                <p className="text-sm max-w-xs mx-auto" style={{ color: "var(--text-mid)" }}>{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== PRICING ==================== */}
      <section id="pricing" className="relative py-16 md:py-24 lg:py-32 px-4 md:px-6" dir="rtl"
        style={{ background: "linear-gradient(180deg, #343434 0%, #3D3D3D 100%)" }}>
        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-10 md:mb-16 lg:mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-6"
              style={{ background: "rgba(230,179,30,.08)", border: "1px solid rgba(230,179,30,.2)", color: "var(--gold)" }}>
              باقات مرنة
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black" style={{ color: "var(--text-main)" }}>
              اختر <span style={{ color: "var(--gold)" }}>باقتك</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((p, i) => {
              const priceNum = parseFloat(p.price);
              const isFree = priceNum === 0;
              return (
                <motion.div key={p.id} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.15 }} viewport={{ once: true }}
                  className={`relative rounded-2xl md:rounded-3xl p-5 md:p-8 transition-all duration-500 hover:scale-[1.02] hover:shadow-xl flex flex-col ${p.is_popular ? "shadow-lg" : ""}`}
                  style={{
                    background: p.is_popular ? "linear-gradient(135deg, #1a1a1a, #2a2218)" : "var(--white)",
                    border: p.is_popular ? "1px solid rgba(230,179,30,.25)" : "1px solid var(--border)",
                  }}>
                  {p.is_popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[11px] font-black whitespace-nowrap"
                      style={{ background: "linear-gradient(135deg, var(--gold), var(--gold-light))", color: "#FCFAF1" }}>
                      الأكثر شعبية <Star size={12} className="inline-block" style={{ fill: "#FCFAF1", color: "#FCFAF1" }} />
                    </div>
                  )}
                  <h3 className="text-lg font-bold mb-4" style={{ color: p.is_popular ? "#FCFAF1" : "var(--text-main)" }}>{p.name_ar}</h3>
                  <div className="flex items-end gap-1 mb-6">
                    <span className="text-4xl sm:text-5xl font-black" style={{ color: p.is_popular ? "#FCFAF1" : "var(--gold)" }}>
                      {isFree ? "0" : priceNum % 1 === 0 ? priceNum.toFixed(0) : priceNum.toFixed(3)}
                    </span>
                    <span className="text-sm mb-2" style={{ color: p.is_popular ? "rgba(252,250,241,.65)" : "var(--text-muted)" }}>د.أ / شهرياً</span>
                  </div>
                  <ul className="space-y-3 mb-8 flex-1">
                    {p.features.map((f, fi) => (
                      <li key={fi} className="flex items-center gap-2 text-sm"
                        style={{ color: p.is_popular ? "#FCFAF1" : "var(--text-mid)" }}>
                        <span className="text-xs" style={{ color: p.is_popular ? "#FFD700" : "var(--gold)" }}>✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  <Link href={`/contact${isFree ? "?from=free" : `?plan=${encodeURIComponent(p.name_ar || p.name)}`}`}
                    className={`block w-full text-center py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.03] mt-auto`}
                    style={p.is_popular
                      ? { background: "linear-gradient(135deg, rgba(230,179,30,.16), rgba(230,179,30,.08))", border: "1px solid rgba(230,179,30,.3)", boxShadow: "0 0 40px rgba(230,179,30,.14)", color: "#FCFAF1" }
                      : { background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-main)" }
                    }>
                    {isFree ? "ابدأ مجاناً" : "اشترك الآن"}
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ==================== CTA BANNER ==================== */}
      <section className="relative py-16 md:py-24 lg:py-32 px-4 md:px-6" dir="rtl">
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #2D2D2D 0%, #3D3D3D 50%, #2D2D2D 100%)" }} />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 60% at 50% 50%, rgba(230,179,30,.08) 0%, transparent 70%)" }} />
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg,rgba(255,255,255,.1) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black mb-4 md:mb-6 leading-tight" style={{ color: "#FCFAF1" }}>
            جاهز تنقل صالونك
            <br />
            <span style={{ color: "var(--gold)" }}>للمستوى التالي؟</span>
          </h2>
          <p className="text-base md:text-lg mb-8 md:mb-10" style={{ color: "var(--text-mid)" }}>
            انضم لمئات الصالونات التي تثق بـ Maqass
          </p>
          <Link href="/contact?from=cta"
            className="group relative inline-flex items-center gap-2 md:gap-3 px-6 py-3.5 md:px-10 md:py-5 rounded-full text-sm md:text-lg font-bold overflow-hidden"
            style={{ background: "linear-gradient(135deg, var(--gold), var(--gold-light))", color: "var(--btn-text)", boxShadow: "0 20px 60px rgba(0,0,0,.4)" }}>
            <span className="relative z-10 font-bold">ابدأ الآن — مجاناً</span>
            <span className="relative z-10 text-base md:text-xl group-hover:translate-x-[-4px] transition-transform font-sans">←</span>
            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
          </Link>
        </motion.div>
      </section>

      {/* ==================== FOOTER ==================== */}
      <footer id="contact" className="py-12 md:py-16 px-4 md:px-6" dir="rtl"
        style={{ background: "var(--white)", borderTop: "1px solid var(--border)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-10 mb-10 md:mb-12">
            <div className="md:col-span-2">
              <Link href="/" className="flex items-center gap-2 group mb-4">
                <div className="transition-transform duration-500 group-hover:scale-110 flex-shrink-0">
                  <MaqassLogoIcon size={40} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[18px] font-black tracking-wider leading-none"
                    style={{ color: "var(--gold)" }}>MAQASS</span>
                  <span className="text-[8px] font-semibold tracking-[.2em] mt-0.5"
                    style={{ color: "var(--text-muted)" }}>SALON PLATFORM</span>
                </div>
              </Link>
              <p className="text-sm max-w-sm leading-relaxed" style={{ color: "var(--text-mid)" }}>
                منصة إدارة الصالونات الأولى في الأردن. نساعدك تدير صالونك باحترافية وتنمّي عملك.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-bold mb-4" style={{ color: "var(--text-main)" }}>روابط</h4>
              <ul className="space-y-2.5 text-sm" style={{ color: "var(--text-mid)" }}>
                <li><a href="#features" className="hover:text-[#E6B31E] transition-colors">المميزات</a></li>
                <li><a href="#pricing" className="hover:text-[#E6B31E] transition-colors">الباقات</a></li>
                <li><Link href="/login" className="hover:text-[#E6B31E] transition-colors">تسجيل الدخول</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold mb-4" style={{ color: "var(--text-main)" }}>تواصل</h4>
              <ul className="space-y-2.5 text-sm" style={{ color: "var(--text-mid)" }}>
                <li className="flex items-center gap-2"><Mail size={14} style={{ color: "var(--gold)" }} /> info@maqass.app</li>
                <li className="flex items-center gap-2">
                  <Phone size={14} style={{ color: "var(--gold)" }} />
                  <a href="https://wa.me/962781717990" target="_blank" rel="noopener noreferrer"
                    className="hover:text-[#E6B31E] transition-colors" dir="ltr">+962 78 171 7990</a>
                </li>
                <li className="flex items-center gap-2"><MapPin size={14} style={{ color: "var(--gold)" }} /> عمّان، الأردن</li>
              </ul>
            </div>
          </div>
          <div className="pt-8" style={{ borderTop: "1px solid var(--border)" }}>
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                © {new Date().getFullYear()} Maqass. جميع الحقوق محفوظة.
              </p>
              <div className="flex items-center gap-4 text-[11px]" style={{ color: "var(--text-muted)" }}>
                <Link href="/privacy" className="hover:text-[#E6B31E] transition-colors">سياسة الخصوصية</Link>
                <Link href="/terms" className="hover:text-[#E6B31E] transition-colors">شروط الاستخدام</Link>
                <span>|</span>
                <a href="https://wr-technologies.net/" target="_blank" rel="noopener noreferrer"
                  className="hover:opacity-70 transition-opacity" style={{ color: "var(--gold)" }}>
                  WR Technologies
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
