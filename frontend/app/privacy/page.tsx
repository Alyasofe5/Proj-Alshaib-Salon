"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Scissors, ArrowLeft, Clock, Phone, MapPin, Instagram, Facebook } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

function PrivacyContent() {
    const searchParams = useSearchParams();
    const slug = searchParams.get("s") || "";
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const h = () => setScrolled(window.scrollY > 50);
        window.addEventListener("scroll", h);
        return () => window.removeEventListener("scroll", h);
    }, []);

    return (
        <div className="min-h-screen bg-[#050505] text-[#F5F2EC] selection:bg-[#C3D809] selection:text-black" dir="rtl" style={{ fontFamily: "'Noto Sans Arabic', sans-serif" }}>
            {/* GOOGLE FONTS */}
            <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700;1,900&family=Noto+Sans+Arabic:wght@100;400;700;900&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />

            {/* HEADER */}
            <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-700 border-b border-transparent" style={{
                padding: scrolled ? "12px 24px" : "24px 24px",
                background: scrolled ? "rgba(5,5,5,0.85)" : "transparent",
                backdropFilter: scrolled ? "blur(24px)" : "none",
            }}>
                <div className="max-w-[1500px] mx-auto flex justify-between items-center">
                    <a href={`/book?s=${slug}`} className="flex items-center gap-3 transition-transform hover:scale-105">
                        <div className="w-8 h-8 rounded-lg bg-[#C3D809] flex items-center justify-center transform rotate-12">
                            <Scissors size={18} className="text-black -rotate-12" />
                        </div>
                        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.5rem", fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.04em", color: "#F5F2EC" }}>
                            AL SHAYEB SALON<span className="text-[#C3D809]">.</span>
                        </span>
                    </a>

                    <button 
                        onClick={() => window.history.back()}
                        className="px-6 py-2.5 rounded-full bg-white text-black text-[13px] font-black hover:bg-[#C3D809] transition-all flex items-center gap-2 group"
                    >
                        <span>العودة للحجز</span>
                        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                    </button>
                </div>
            </header>

            <main className="pt-40 pb-24 px-6 lg:px-12">
                <div className="max-w-4xl mx-auto">
                    {/* Hero Text */}
                    <div className="mb-20">
                        <div className="flex items-center gap-4 mb-5">
                            <div className="w-12 h-[1px] bg-[#C3D809]" />
                            <span className="text-[#C3D809] text-[10px] uppercase font-bold tracking-[0.3em]" style={{ fontFamily: "'Space Mono', monospace" }}>
                                الوثائق القانونية
                            </span>
                        </div>
                        <h1 className="text-white text-4xl sm:text-6xl lg:text-7xl font-black tracking-tighter mb-8" style={{ fontFamily: "'Noto Sans Arabic', sans-serif" }}>
                            سياسة <span className="text-[#C3D809]" style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontWeight: 700 }}>الخصوصية</span>
                        </h1>
                        <p className="text-white/40 leading-relaxed max-w-2xl">توضح هذه الصفحة كيفية جمع واستخدام وحماية بياناتك الشخصية عند استخدام خدمات صالون الشايب وحجز المواعيد عبر موقعنا.</p>
                    </div>

                    {/* Content Sections */}
                    <div className="space-y-16 lg:space-y-24">
                        <section className="space-y-6">
                            <h2 className="text-2xl font-bold text-white border-b border-white/5 pb-4">١. جمع المعلومات</h2>
                            <p className="text-white/60 leading-[1.8]">نجمع فقط المعلومات الضرورية لإتمام عملية الحجز الخاصة بك، وتشمل: الاسم الكامل، رقم الهاتف، والخدمات المختارة. لا نقوم بمشاركة هذه البيانات مع أي أطراف ثالثة خارج نطاق إدارة المواعيد.</p>
                        </section>

                        <section className="space-y-6">
                            <h2 className="text-2xl font-bold text-white border-b border-white/5 pb-4">٢. استخدام البيانات</h2>
                            <p className="text-white/60 leading-[1.8]">تُستخدم البيانات التي تقدمها لغرض تأكيد المواعيد، إرسال تذكيرات عبر الرسائل أو الواتساب، وتوفير تجربة مخصصة لك عند زيارة الصالون.</p>
                        </section>

                        <section className="space-y-6">
                            <h2 className="text-2xl font-bold text-white border-b border-white/5 pb-4">٣. حماية المعلومات</h2>
                            <p className="text-white/60 leading-[1.8]">نحن نطبق إجراءات أمنية صارمة لحماية بياناتك من الوصول غير المصرح به. يتم تشفير كافة البيانات المرسلة عبر الموقع لضمان أقصى درجات الأمان.</p>
                        </section>

                        <section className="space-y-6">
                            <h2 className="text-2xl font-bold text-white border-b border-white/5 pb-4">٤. ملفات التعريف (Cookies)</h2>
                            <p className="text-white/60 leading-[1.8]">نستخدم ملفات التعريف لتحسين أداء الموقع وتذكر تفضيلاتك في الزيارات القادمة. يمكنك التحكم في إعدادات ملفات التعريف من خلال متصفحك.</p>
                        </section>
                    </div>
                </div>
            </main>

            {/* FOOTER */}
            <footer className="py-16 sm:py-20 px-6 lg:px-12 bg-[#050505] border-t border-white/[0.03]">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16 lg:gap-12 text-right">
                        <div className="space-y-8">
                            <h3 className="text-white font-black italic tracking-tighter" style={{ fontFamily: "'Playfair Display', serif", fontSize: "2.2rem" }}>
                                AL SHAYEB<span className="text-[#C3D809]">.</span>
                            </h3>
                            <p className="text-white/40 leading-relaxed text-sm max-w-xs">
                                تجربة استثنائية تجمع بين الفن العريق والأسلوب المعاصر في قلب العاصمة.
                            </p>
                        </div>
                        
                        <div>
                            <span className="text-[#C3D809] text-[9px] uppercase font-bold tracking-[0.4em] mb-8 block" style={{ fontFamily: "'Space Mono', monospace" }}>تواصل معنا</span>
                            <div className="space-y-8">
                                <a href="tel:0785295125" className="block group">
                                    <p className="text-white text-lg font-black group-hover:text-[#C3D809] transition-colors" dir="ltr">0785295125</p>
                                    <p className="text-white/20 text-[0.7rem] uppercase tracking-widest font-bold mt-1">اتصل بنا</p>
                                </a>
                                <div className="flex gap-4">
                                    <div className="relative group cursor-pointer">
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-gradient-to-tr from-[#405DE6] to-[#F56040] text-[10px] text-white font-bold tracking-widest opacity-0 group-hover:opacity-100 transition-all duration-300 scale-50 group-hover:scale-100 pointer-events-none z-20">
                                            INSTAGRAM
                                        </div>
                                        <a href="https://instagram.com/salon_t" target="_blank" className="w-12 h-12 rounded-full border border-white/5 bg-white/[0.02] flex items-center justify-center relative overflow-hidden group/icon">
                                            <div className="absolute bottom-0 left-0 w-full h-0 group-hover/icon:h-full transition-all duration-500 bg-gradient-to-tr from-[#405DE6] via-[#E1306C] to-[#FFDC80] z-0" />
                                            <Instagram size={20} className="relative z-10 text-white/40 group-hover/icon:text-white transition-colors duration-300" />
                                        </a>
                                    </div>
                                    <div className="relative group cursor-pointer">
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-[#25D366] text-[10px] text-white font-bold tracking-widest opacity-0 group-hover:opacity-100 transition-all duration-300 scale-50 group-hover:scale-100 pointer-events-none z-20">
                                            WHATSAPP
                                        </div>
                                        <a href="https://wa.me/0785295125" target="_blank" className="w-12 h-12 rounded-full border border-white/5 bg-white/[0.02] flex items-center justify-center relative overflow-hidden group/icon">
                                            <div className="absolute bottom-0 left-0 w-full h-0 group-hover/icon:h-full transition-all duration-500 bg-[#25D366] z-0" />
                                            <FaWhatsapp size={20} className="relative z-10 text-white/40 group-hover/icon:text-white transition-colors duration-300" />
                                        </a>
                                    </div>
                                    <div className="relative group cursor-pointer">
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-[#1877F2] text-[10px] text-white font-bold tracking-widest opacity-0 group-hover:opacity-100 transition-all duration-300 scale-50 group-hover:scale-100 pointer-events-none z-20">
                                            FACEBOOK
                                        </div>
                                        <a href="https://www.facebook.com/?locale=ar_AR" target="_blank" className="w-12 h-12 rounded-full border border-white/5 bg-white/[0.02] flex items-center justify-center relative overflow-hidden group/icon">
                                            <div className="absolute bottom-0 left-0 w-full h-0 group-hover/icon:h-full transition-all duration-500 bg-[#1877F2] z-0" />
                                            <Facebook size={20} className="relative z-10 text-white/40 group-hover/icon:text-white transition-colors duration-300" />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col justify-end">
                            <div className="flex items-center gap-4 text-white/20 font-bold tracking-[0.1em]" style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.65rem" }}>
                                <a href="https://maqas.site/" target="_blank" className="text-[#C3D809] hover:opacity-80 transition-opacity">MAQAS.SITE</a>
                                <span>/</span>
                                <span className="uppercase">© {new Date().getFullYear()} AL SHAYEB SALON . ALL RIGHTS RESERVED</span>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default function PrivacyPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#050505]" />}>
            <PrivacyContent />
        </Suspense>
    );
}
