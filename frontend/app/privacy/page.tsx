"use client";

import Link from "next/link";
import { Scissors, ArrowRight } from "lucide-react";

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-[#040404] text-white" style={{ fontFamily: "'Tajawal', sans-serif" }} dir="rtl">
            {/* Navbar */}
            <nav className="border-b border-white/[.04] px-6 py-4">
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #c8a96e, #e8c96a)" }}>
                            <Scissors size={16} className="text-[#0a0a0a]" />
                        </div>
                        <span className="text-[18px] font-black text-white">MAQASS</span>
                    </Link>
                    <Link href="/" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors">
                        <ArrowRight size={14} /> العودة للرئيسية
                    </Link>
                </div>
            </nav>

            <div className="max-w-3xl mx-auto px-6 py-16">
                <div className="mb-10">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-4"
                        style={{ background: "rgba(200,169,110,.08)", border: "1px solid rgba(200,169,110,.15)", color: "#c8a96e" }}>
                        آخر تحديث: مارس 2026
                    </div>
                    <h1 className="text-4xl font-black mb-3">سياسة الخصوصية</h1>
                    <p className="text-gray-500">نحن في Maqass نلتزم بحماية خصوصيتك وبياناتك الشخصية.</p>
                </div>

                <div className="space-y-8 text-gray-300 leading-relaxed">
                    {[
                        {
                            title: "١. البيانات التي نجمعها",
                            content: "نجمع المعلومات التي تقدمها عند التسجيل مثل اسم الصالون، بيانات المالك، معلومات الاتصال. نجمع أيضاً بيانات الاستخدام مثل سجلات المعاملات والحجوزات وأداء الموظفين الخاصة بصالونك."
                        },
                        {
                            title: "٢. كيف نستخدم بياناتك",
                            content: "تُستخدم بياناتك حصراً لتشغيل الخدمة وتقديم التقارير والتحليلات الخاصة بصالونك. لن نشارك بياناتك مع أطراف ثالثة بدون إذنك الصريح، إلا في حالات يتطلبها القانون."
                        },
                        {
                            title: "٣. تخزين البيانات وأمانها",
                            content: "بياناتك مخزّنة على خوادم آمنة. نستخدم تشفير SSL لحماية البيانات أثناء الإرسال. لا يمكن لأي صالون آخر الوصول إلى بياناتك — كل صالون معزول تماماً."
                        },
                        {
                            title: "٤. حقوقك",
                            content: "يحق لك في أي وقت: طلب نسخة من بياناتك، تصحيح أي معلومات غير دقيقة، أو طلب حذف حسابك وبياناتك نهائياً. للتواصل: +962781717990"
                        },
                        {
                            title: "٥. ملفات تعريف الارتباط (Cookies)",
                            content: "نستخدم Cookies ضرورية للتشغيل فقط مثل حفظ جلسة تسجيل الدخول. لا نستخدم ملفات تتبع الإعلانات."
                        },
                        {
                            title: "٦. التغييرات على هذه السياسة",
                            content: "سنُعلمك بأي تغييرات جوهرية على سياسة الخصوصية عبر البريد الإلكتروني أو لوحة التحكم. استمرارك في استخدام الخدمة بعد التحديث يعني موافقتك على التغييرات."
                        },
                        {
                            title: "٧. التواصل معنا",
                            content: "لأي استفسار حول هذه السياسة، تواصل معنا على: info@maqass.app أو +962781717990"
                        },
                    ].map((section, i) => (
                        <div key={i} className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.05)" }}>
                            <h2 className="text-lg font-bold text-white mb-3" style={{ color: "#c8a96e" }}>{section.title}</h2>
                            <p className="text-gray-400 leading-relaxed">{section.content}</p>
                        </div>
                    ))}
                </div>
            </div>

            <footer className="border-t border-white/[.04] py-8 px-6 text-center text-sm text-gray-600">
                © {new Date().getFullYear()} Maqass. جميع الحقوق محفوظة.
            </footer>
        </div>
    );
}
