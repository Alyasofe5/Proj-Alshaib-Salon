"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import Link from "next/link";
import dynamic from "next/dynamic";
import { CalendarCheck, BarChart3, Users, Wallet, PenLine, Settings, Rocket, Scissors, TrendingDown, Zap, CircleCheckBig, ArrowUpRight, Mail, Phone, MapPin } from "lucide-react";

/* Dynamic import — keeps Three.js (~1MB) OUT of the critical bundle */
const BarberChair3D = dynamic(() => import("@/components/BarberChair3D"), {
  ssr: false,
  loading: () => (
    <div className="relative w-[350px] h-[350px] md:w-[500px] md:h-[500px] flex items-center justify-center">
      <div className="absolute inset-0 blur-[100px] opacity-25" style={{ background: "radial-gradient(circle, #c8a96e, transparent 60%)" }} />
      <div className="w-12 h-12 rounded-full border-2 border-transparent border-t-[#c8a96e] border-r-[#c8a96e] animate-spin" />
    </div>
  ),
});

// ============================================================
//  MAQASS — Premium SaaS Landing Page
//  Inspired by Holo / SOLAR Digital — Dark + Gold + 3D Glass
// ============================================================

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


// ===== Floating Glass Card — plain div + CSS animation (no JS delay) =====
function GlassCard({ children, className = "", cardClass = "" }: { children: React.ReactNode; className?: string; cardClass?: string }) {
  return (
    <div
      className={`rounded-2xl px-5 py-4 ${className} ${cardClass}`}
      style={{
        background: "rgba(20,20,20,.7)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,.06)",
        boxShadow: "0 8px 32px rgba(0,0,0,.4)",
      }}
    >
      {children}
    </div>
  );
}

const FEATURES = [
  { icon: <CalendarCheck size={24} className="text-[#c8a96e]" />, title: "حجوزات ذكية", desc: "رابط فريد لكل صالون. زبائنك يحجزون بدون اتصال 24/7", stat: "+280%", statLabel: "حجوزات أكثر" },
  { icon: <BarChart3 size={24} className="text-[#c8a96e]" />, title: "تحليلات متقدمة", desc: "تقارير يومية وشهرية. اعرف أداء كل موظف بلمحة", stat: "-45%", statLabel: "وقت إداري" },
  { icon: <Users size={24} className="text-[#c8a96e]" />, title: "إدارة الفريق", desc: "عمولات ورواتب تلقائية. سجل لكل موظف", stat: "+3.2h", statLabel: "وقت موفّر يومياً" },
  { icon: <Wallet size={24} className="text-[#c8a96e]" />, title: "مصاريف وأرباح", desc: "سجّل مصاريفك وراقب أرباحك بدقة", stat: "99.9%", statLabel: "دقة التقارير" },
];

// ============================================================
export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.95]);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <div className="min-h-screen bg-[#040404] text-white overflow-x-hidden" style={{ fontFamily: "'Cairo', 'Tajawal', sans-serif" }}>

      {/* ==================== NAVBAR ==================== */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-700 ${scrolled ? "py-3 bg-[#040404]/90 backdrop-blur-xl" : "py-5"}`}>
        <div className="absolute bottom-0 inset-x-0 h-px transition-opacity duration-700 pointer-events-none" style={{ background: "rgba(255,255,255,0.06)", opacity: scrolled ? 1 : 0 }} />
        <div className="relative max-w-7xl mx-auto flex items-center px-4 md:px-6" dir="rtl">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group z-10" onClick={() => setMenuOpen(false)}>
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110" style={{ background: "linear-gradient(135deg, #c8a96e, #e8c96a)", boxShadow: "0 4px 20px rgba(200,169,110,.3)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="6" cy="6" r="3" /><path d="M8.12 8.12 12 12" /><path d="M20 4 8.12 15.88" /><circle cx="6" cy="18" r="3" /><path d="M14.8 14.8 20 20" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-[18px] md:text-[20px] font-black tracking-wider leading-none bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(90deg,#fff 0%,#c8a96e 45%,#e8c96a 55%,#fff 100%)", backgroundSize: "200% 100%", animation: "shimmer 3s ease-in-out infinite" }}>MAQASS</span>
              <span className="text-[8px] font-semibold tracking-[.2em] text-gray-600 mt-0.5">SALON PLATFORM</span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full px-2 py-1.5" style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.06)" }}>
            {["المميزات", "كيف يعمل", "الباقات", "تواصل"].map((l, i) => (
              <a key={i} href={`#${["features", "how", "pricing", "contact"][i]}`} className="px-4 py-1.5 rounded-full text-sm font-semibold text-gray-400 hover:text-white hover:bg-white/5 transition-all">{l}</a>
            ))}
          </div>

          {/* CTA + Hamburger */}
          <div className="flex items-center gap-2 mr-auto z-10">
            <Link href="/login" className="hidden md:block text-sm font-semibold text-gray-400 hover:text-white transition-colors px-4 py-2">تسجيل الدخول</Link>
            <Link href="/contact" className="hidden sm:flex items-center gap-1.5 text-sm font-bold px-4 py-2 md:px-5 md:py-2.5 rounded-full transition-all hover:scale-105" style={{ background: "linear-gradient(135deg, #c8a96e, #e8c96a)", color: "#0a0a0a" }}>ابدأ مجاناً</Link>
            {/* Mobile hamburger */}
            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden flex flex-col justify-center items-center w-9 h-9 rounded-lg gap-1.5" style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)" }}>
              <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
              <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`} />
              <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
            </button>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        {menuOpen && (
          <div className="md:hidden absolute top-full inset-x-0 py-4 px-4" style={{ background: "rgba(4,4,4,.97)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,.06)" }} dir="rtl">
            <div className="flex flex-col gap-1">
              {[["المميزات", "features"], ["كيف يعمل", "how"], ["الباقات", "pricing"], ["تواصل", "contact"]].map(([l, id]) => (
                <a key={id} href={`#${id}`} onClick={() => setMenuOpen(false)}
                  className="px-4 py-3 rounded-xl text-sm font-semibold text-gray-300 hover:text-white hover:bg-white/5 transition-all">{l}</a>
              ))}
              <div className="border-t border-white/5 mt-2 pt-2 flex flex-col gap-2">
                <Link href="/login" onClick={() => setMenuOpen(false)} className="px-4 py-3 rounded-xl text-sm font-semibold text-gray-400 hover:text-white transition-colors">تسجيل الدخول</Link>
                <Link href="/contact" onClick={() => setMenuOpen(false)} className="px-4 py-3 rounded-xl text-sm font-bold text-center" style={{ background: "linear-gradient(135deg, #c8a96e, #e8c96a)", color: "#0a0a0a" }}>ابدأ مجاناً ←</Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ==================== HERO ==================== */}
      <motion.section style={{ opacity: heroOpacity, scale: heroScale }} className="relative min-h-screen flex items-center overflow-hidden" dir="rtl">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 80% 60% at 30% 50%, rgba(200,169,110,.06) 0%, transparent 60%)" }} />
          <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)", backgroundSize: "80px 80px" }} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto w-full px-4 md:px-6 grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 lg:gap-12 pt-20 md:pt-24 pb-20 items-center">

          {/* ================= Part 1: Text Top (Mobile & Desktop) ================= */}
          <div className="flex flex-col text-right order-1 lg:col-start-1 lg:row-start-1 h-full lg:justify-end lg:pb-0 relative z-20">
            {/* Badge */}
            <div className="hero-badge w-fit inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-6 md:mb-8 cursor-default"
              style={{ background: "rgba(200,169,110,.08)", border: "1px solid rgba(200,169,110,.15)", color: "#c8a96e" }}>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-black" style={{ background: "#c8a96e", color: "#0a0a0a" }}>جديد</span>
              نظام حجوزات ذكي متكامل ←
            </div>

            {/* Headline */}
            <h1 className="hero-h1 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[1.1] mb-4 md:mb-6">
              أدِر صالونك
              <br />
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(135deg, #c8a96e, #e8c96a, #c8a96e)" }}>
                بذكاء مطلق.
              </span>
            </h1>

            <p className="hero-p text-sm md:text-base lg:text-lg text-gray-500 max-w-md leading-relaxed mb-4 lg:mb-8">
              منصة متكاملة لإدارة الحجوزات والموظفين والتقارير المالية. تقنية ذكية تجعل عملك أكثر كفاءة.
            </p>
          </div>

          {/* ================= Part 2: Barber Chair 3D ================= */}
          <div className="order-2 lg:order-none relative flex items-center justify-center min-h-[300px] md:min-h-[450px] lg:min-h-[500px] w-full lg:col-start-2 lg:row-start-1 lg:row-span-2">
            <BarberChair3D />

            {/* Floating Stat Cards (Desktop Only) */}
            <GlassCard className="absolute top-6 md:top-12 left-0 md:left-[-20px] hidden lg:block" cardClass="glass-card-1">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(200,169,110,.15)" }}><TrendingDown size={16} className="text-[#c8a96e]" /></div>
                <div>
                  <div className="text-xl font-black text-[#c8a96e]">-75%</div>
                  <div className="text-[11px] text-gray-500">وقت إداري أقل</div>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="absolute bottom-16 md:bottom-20 right-0 md:right-[-10px] hidden lg:block" cardClass="glass-card-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(200,169,110,.15)" }}><Zap size={16} className="text-[#c8a96e]" /></div>
                <div>
                  <div className="text-xl font-black text-white">+2.3h</div>
                  <div className="text-[11px] text-gray-500">وقت موفّر يومياً</div>
                </div>
                <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: "rgba(255,255,255,.06)" }}><ArrowUpRight size={10} className="text-gray-400" /></div>
              </div>
            </GlassCard>

            <GlassCard className="absolute bottom-0 left-4 md:left-8 hidden lg:block" cardClass="glass-card-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(46,204,113,.15)" }}><CircleCheckBig size={16} className="text-emerald-400" /></div>
                <div>
                  <div className="text-sm font-bold text-emerald-400">حجز جديد!</div>
                  <div className="text-[11px] text-gray-500">قبل 3 دقائق</div>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* ================= Part 3: CTAs & Social (Mobile bottom) ================= */}
          <div className="flex flex-col text-right order-3 lg:col-start-1 lg:row-start-2 h-full lg:justify-start pt-2 lg:pt-0 relative z-20">
            {/* CTAs */}
            <div className="hero-cta flex flex-wrap items-center justify-start gap-4 mb-8 md:mb-12">
              <Link href="/contact" className="group relative inline-flex items-center justify-center gap-2 px-6 py-3.5 md:px-7 md:py-3.5 rounded-full text-sm font-bold overflow-hidden" style={{ background: "linear-gradient(135deg, #c8a96e, #e8c96a)", color: "#0a0a0a" }}>
                <span className="relative z-10 font-bold">ابدأ مجاناً</span>
                <span className="relative z-10 w-6 h-6 rounded-full bg-black/10 flex items-center justify-center text-xs group-hover:translate-x-[-3px] transition-transform font-sans">←</span>
                <div className="absolute inset-0 bg-white/25 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
              </Link>
              <a href="#features" className="text-sm font-semibold text-gray-400 hover:text-white transition-colors cursor-pointer text-center">
                اكتشف المنصة
              </a>
            </div>

            {/* Social Proof */}
            <div className="hero-social flex items-center justify-start gap-4 mx-auto sm:mx-0">
              <div className="flex -space-x-2 rtl:space-x-reverse">
                {[
                  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&q=80",
                  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&q=80",
                  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=40&h=40&fit=crop&q=80",
                  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=40&h=40&fit=crop&q=80",
                ].map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt={`زبون ${i + 1}`}
                    className="w-8 h-8 md:w-9 md:h-9 rounded-full border-2 border-[#0a0a0a] object-cover"
                  />
                ))}
              </div>
              <div>
                <div className="text-lg md:text-xl font-black text-white">100<span className="text-[#c8a96e]">+</span></div>
                <div className="text-[11px] md:text-xs text-gray-500 font-semibold" style={{ marginTop: "-2px" }}>صالون يستخدم Maqass</div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator — centered */}
        <div className="absolute bottom-6 md:bottom-8 inset-x-0 flex justify-center pointer-events-none z-20">
          <motion.a href="#features"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex flex-col items-center gap-1 text-[10px] md:text-xs text-gray-500 hover:text-[#c8a96e] transition-colors cursor-pointer pointer-events-auto">
            <span className="font-semibold tracking-wide">اكتشف المزيد</span>
            <span className="text-sm">↓</span>
          </motion.a>
        </div>
      </motion.section>

      {/* ==================== FEATURES ==================== */}
      <section id="features" className="relative py-16 md:py-24 lg:py-32 px-4 md:px-6" dir="rtl">
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(200,169,110,.04) 0%, transparent 60%)" }} />

        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10 md:mb-16 lg:mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-6" style={{ background: "rgba(200,169,110,.06)", border: "1px solid rgba(200,169,110,.1)", color: "#c8a96e" }}>
              المميزات
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4">
              كل ما تحتاجه
              <br />
              <span className="text-[#c8a96e]">في مكان واحد</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {FEATURES.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="group relative rounded-2xl md:rounded-3xl p-5 md:p-7 border border-white/[.04] hover:border-[#c8a96e]/20 transition-all duration-500 cursor-default"
                style={{ background: "linear-gradient(135deg, rgba(255,255,255,.02), rgba(255,255,255,.005))" }}
              >
                <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: "radial-gradient(circle at 50% 0%, rgba(200,169,110,.05) 0%, transparent 70%)" }} />
                <div className="relative z-10 flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="mb-3">{f.icon}</div>
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[#c8a96e] transition-colors">{f.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                  </div>
                  <div className="text-left flex-shrink-0">
                    <div className="text-2xl font-black text-[#c8a96e]">{f.stat}</div>
                    <div className="text-[11px] text-gray-600">{f.statLabel}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== HOW IT WORKS ==================== */}
      <section id="how" className="relative py-16 md:py-24 lg:py-32 px-4 md:px-6" dir="rtl">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10 md:mb-16 lg:mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-6" style={{ background: "rgba(200,169,110,.06)", border: "1px solid rgba(200,169,110,.1)", color: "#c8a96e" }}>
              ببساطة
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black">
              ثلاث خطوات <span className="text-[#c8a96e]">لتبدأ</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {[
              { num: "01", icon: <PenLine size={24} className="text-[#c8a96e]" />, title: "سجّل صالونك", desc: "أنشئ حسابك في أقل من 5 دقائق. بدون بطاقة ائتمان." },
              { num: "02", icon: <Settings size={24} className="text-[#c8a96e]" />, title: "خصّص إعداداتك", desc: "أضف خدماتك وأسعارك وفريق عملك بسهولة." },
              { num: "03", icon: <Rocket size={24} className="text-[#c8a96e]" />, title: "ابدأ الآن", desc: "شارك رابط الحجز وابدأ باستقبال الزبائن." },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.2 }}
                viewport={{ once: true }}
                className="relative text-center group"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-5 sm:mb-6 rounded-2xl flex items-center justify-center relative transition-transform group-hover:scale-110" style={{ background: "rgba(200,169,110,.06)", border: "1px solid rgba(200,169,110,.1)" }}>
                  {s.icon}
                  <div className="absolute -top-2 -right-2 w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center text-[10px] sm:text-[11px] font-black" style={{ background: "linear-gradient(135deg, #c8a96e, #e8c96a)", color: "#0a0a0a" }}>{s.num}</div>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 max-w-xs mx-auto">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== PRICING ==================== */}
      <section id="pricing" className="relative py-16 md:py-24 lg:py-32 px-4 md:px-6" dir="rtl">
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 50% 60% at 50% 30%, rgba(200,169,110,.04) 0%, transparent 60%)" }} />

        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10 md:mb-16 lg:mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-6" style={{ background: "rgba(200,169,110,.06)", border: "1px solid rgba(200,169,110,.1)", color: "#c8a96e" }}>
              باقات مرنة
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black">
              اختر <span className="text-[#c8a96e]">باقتك</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: "مجاني", price: "0", period: "/شهر", pop: false, features: ["حتى 2 موظف", "50 حجز/شهر", "تقارير أساسية", "رابط حجز مخصص"] },
              { name: "احترافي", price: "15", period: "شهرياً", pop: true, features: ["موظفين غير محدود", "حجوزات غير محدودة", "تقارير متقدمة", "إشعارات واتساب", "دعم فني أولوية", "تخصيص كامل"] },
              { name: "مؤسسات", price: "35", period: "شهرياً", pop: false, features: ["فروع متعددة", "كل مميزات الاحترافي", "API مخصص", "مدير حساب خاص", "تدريب الفريق"] },
            ].map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                viewport={{ once: true }}
                className={`relative rounded-2xl md:rounded-3xl p-5 md:p-8 border transition-all duration-500 hover:scale-[1.02] ${p.pop ? "border-[#c8a96e]/25" : "border-white/[.04]"}`}
                style={{ background: p.pop ? "linear-gradient(135deg, rgba(200,169,110,.08), rgba(200,169,110,.02))" : "rgba(255,255,255,.015)" }}
              >
                {p.pop && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[11px] font-black whitespace-nowrap" style={{ background: "linear-gradient(135deg, #c8a96e, #e8c96a)", color: "#0a0a0a" }}>
                    الأكثر شعبية ⭐
                  </div>
                )}
                <h3 className="text-lg font-bold mb-4">{p.name}</h3>
                <div className="flex items-end gap-1 mb-6">
                  <span className="text-5xl font-black text-[#c8a96e]">{p.price}</span>
                  <span className="text-gray-500 text-sm mb-2">د.أ / {p.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {p.features.map((f, fi) => (
                    <li key={fi} className="flex items-center gap-2 text-sm text-gray-400">
                      <span className="text-[#c8a96e] text-xs">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/contact" className={`block w-full text-center py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.03] ${p.pop ? "text-[#0a0a0a]" : "text-white border border-white/10 hover:border-[#c8a96e]/30"}`} style={p.pop ? { background: "linear-gradient(135deg, #c8a96e, #e8c96a)" } : {}}>
                  {p.price === "0" ? "ابدأ مجاناً" : "اشترك الآن"}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== CTA ==================== */}
      <section className="relative py-16 md:py-28 lg:py-32 px-4 md:px-6" dir="rtl">
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 60% at 50% 50%, rgba(200,169,110,.06) 0%, transparent 50%)" }} />
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black mb-4 md:mb-6 leading-tight">
            جاهز تنقل صالونك
            <br />
            <span className="text-[#c8a96e]">للمستوى التالي؟</span>
          </h2>
          <p className="text-gray-500 text-base md:text-lg mb-8 md:mb-10">انضم لمئات الصالونات التي تثق بـ Maqass</p>
          <Link href="/contact" className="group relative inline-flex items-center gap-2 md:gap-3 px-6 py-3.5 md:px-10 md:py-5 rounded-full text-sm md:text-lg font-bold overflow-hidden" style={{ background: "linear-gradient(135deg, #c8a96e, #e8c96a)", color: "#0a0a0a", boxShadow: "0 20px 60px rgba(200,169,110,.25)" }}>
            <span className="relative z-10 font-bold">ابدأ الآن — مجاناً</span>
            <span className="relative z-10 text-base md:text-xl group-hover:translate-x-[-4px] transition-transform font-sans">←</span>
            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
          </Link>
        </motion.div>
      </section>

      {/* ==================== FOOTER ==================== */}
      <footer id="contact" className="border-t border-white/[.04] py-12 md:py-16 px-4 md:px-6" dir="rtl">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            <div className="md:col-span-2">
              <Link href="/" className="flex items-center gap-2.5 group mb-4">
                <div
                  className="w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110 flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #c8a96e, #e8c96a)", boxShadow: "0 4px 20px rgba(200,169,110,.3)" }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="6" cy="6" r="3" /><path d="M8.12 8.12 12 12" /><path d="M20 4 8.12 15.88" /><circle cx="6" cy="18" r="3" /><path d="M14.8 14.8 20 20" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span
                    className="text-[18px] font-black tracking-wider leading-none bg-clip-text text-transparent"
                    style={{ backgroundImage: "linear-gradient(90deg,#fff 0%,#c8a96e 45%,#e8c96a 55%,#fff 100%)", backgroundSize: "200% 100%", animation: "shimmer 3s ease-in-out infinite" }}
                  >MAQASS</span>
                  <span className="text-[8px] font-semibold tracking-[.2em] text-gray-600 mt-0.5">SALON PLATFORM</span>
                </div>
              </Link>
              <p className="text-sm text-gray-600 max-w-sm leading-relaxed">
                منصة إدارة الصالونات الأولى في الأردن. نساعدك تدير صالونك باحترافية وتنمّي عملك.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-4">روابط</h4>
              <ul className="space-y-2.5 text-sm text-gray-600">
                <li><a href="#features" className="hover:text-[#c8a96e] transition-colors">المميزات</a></li>
                <li><a href="#pricing" className="hover:text-[#c8a96e] transition-colors">الباقات</a></li>
                <li><Link href="/login" className="hover:text-[#c8a96e] transition-colors">تسجيل الدخول</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-4">تواصل</h4>
              <ul className="space-y-2.5 text-sm text-gray-600">
                <li className="flex items-center gap-2"><Mail size={14} className="text-[#c8a96e]" /> info@maqass.app</li>
                <li className="flex items-center gap-2"><Phone size={14} className="text-[#c8a96e]" /><a href="https://wa.me/962781717990" target="_blank" rel="noopener noreferrer" className="hover:text-[#c8a96e] transition-colors" dir="ltr">+962 78 171 7990</a></li>
                <li className="flex items-center gap-2"><MapPin size={14} className="text-[#c8a96e]" /> عمّان، الأردن</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/[.04] pt-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-[11px] text-gray-700">© {new Date().getFullYear()} Maqass. جميع الحقوق محفوظة.</p>
              <div className="flex items-center gap-4 text-gray-700 text-[11px]">
                <Link href="/privacy" className="hover:text-[#c8a96e] transition-colors">سياسة الخصوصية</Link>
                <Link href="/terms" className="hover:text-[#c8a96e] transition-colors">شروط الاستخدام</Link>
                <span className="text-gray-800">|</span>
                <a href="https://wr-technologies.net/" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 opacity-40 hover:opacity-70 transition-opacity"
                  style={{ color: "#c8a96e" }}>
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
