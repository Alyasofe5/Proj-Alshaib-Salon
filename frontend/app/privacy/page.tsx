"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import MaqassLogoIcon from "@/components/ui/MaqassLogoIcon";

export default function PrivacyPage() {
    return (
        <div className="min-h-screen" style={{ background: "var(--off-white)", color: "var(--text-main)", fontFamily: "'Cairo', 'Tajawal', sans-serif" }} dir="rtl">
            {/* Navbar */}
            <nav className="px-6 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2.5">
                        <MaqassLogoIcon size={36} />
                        <span className="text-[18px] font-black tracking-wider" style={{ color: "var(--gold)" }}>MAQASS</span>
                    </Link>
                    <Link href="/" className="flex items-center gap-1.5 text-sm font-semibold transition-colors hover:opacity-70"
                        style={{ color: "var(--gold)" }}>
                        العودة للرئيسية
                        <ArrowLeft size={14} />
                    </Link>
                </div>
            </nav>

            <div className="max-w-3xl mx-auto px-6 py-12 sm:py-16">
                <div className="mb-8 sm:mb-10">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-4"
                        style={{ background: "rgba(230,179,30,.08)", border: "1px solid rgba(230,179,30,.15)", color: "var(--gold)" }}>
                        آخر تحديث: مارس 2026
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black mb-3" style={{ color: "var(--text-main)" }}>سياسة الخصوصية</h1>
                    <p style={{ color: "var(--text-mid)" }}>نحن في Maqass نلتزم بحماية خصوصيتك وبياناتك الشخصية.</p>
                </div>

                <div className="space-y-5 sm:space-y-8">
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
                            content: "لأي استفسار حول هذه السياسة، تواصل معنا على: info@maqas.site أو +962781717990"
                        },
                    ].map((section, i) => (
                        <div key={i} className="rounded-2xl p-5 sm:p-6" style={{ background: "var(--white)", border: "1px solid var(--border)", boxShadow: "0 2px 12px var(--shadow)" }}>
                            <h2 className="text-base sm:text-lg font-bold mb-3" style={{ color: "var(--gold)" }}>{section.title}</h2>
                            <p className="text-sm sm:text-base leading-relaxed" style={{ color: "var(--text-mid)" }}>{section.content}</p>
                        </div>
                    ))}
                </div>
            </div>

            <footer className="py-8 px-6 text-center text-sm" style={{ borderTop: "1px solid var(--border)", color: "var(--text-muted)" }}>
                © {new Date().getFullYear()} Maqass. جميع الحقوق محفوظة.
            </footer>
        </div>
    );
}
