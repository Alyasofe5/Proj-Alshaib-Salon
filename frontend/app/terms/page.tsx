"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import MaqassLogoIcon from "@/components/ui/MaqassLogoIcon";

export default function TermsPage() {
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
                    <h1 className="text-3xl sm:text-4xl font-black mb-3" style={{ color: "var(--text-main)" }}>شروط الاستخدام</h1>
                    <p style={{ color: "var(--text-mid)" }}>باستخدامك لـ Maqass، فأنت توافق على الشروط التالية.</p>
                </div>

                <div className="space-y-5 sm:space-y-8">
                    {[
                        {
                            title: "١. القبول بالشروط",
                            content: "باستخدامك لمنصة Maqass، تؤكد أنك قرأت وفهمت ووافقت على هذه الشروط. إذا كنت تستخدم المنصة بالنيابة عن صالون أو شركة، فأنت تضمن صلاحيتك للقبول بهذه الشروط."
                        },
                        {
                            title: "٢. الخدمات المقدمة",
                            content: "توفر Maqass نظام إدارة صالونات يشمل: إدارة الحجوزات، تتبع المعاملات المالية، إدارة الموظفين والعمولات، والتقارير الإحصائية. تحتفظ Maqass بحق تعديل أو إيقاف أي ميزة في أي وقت."
                        },
                        {
                            title: "٣. حساب المستخدم",
                            content: "أنت مسؤول عن الحفاظ على سرية بيانات دخولك. يجب إخطارنا فوراً في حال الاشتباه بأي اختراق. لا يجوز مشاركة حسابك مع أطراف خارج صالونك."
                        },
                        {
                            title: "٤. الاستخدام المقبول",
                            content: "يحظر استخدام المنصة لأغراض غير مشروعة، أو محاولة اختراق النظام، أو استخدامها بطريقة تضر بالمستخدمين الآخرين. Maqass تحتفظ بالحق في إيقاف أي حساب يخالف هذه الشروط."
                        },
                        {
                            title: "٥. الأسعار والاشتراكات",
                            content: "الأسعار المعلنة على المنصة خاضعة للتغيير مع إشعار مسبق. لا يتم استرداد رسوم الاشتراك بعد بدء فترة الاشتراك. في حالات استثنائية يمكن التواصل مع الدعم للتسوية."
                        },
                        {
                            title: "٦. المسؤولية",
                            content: "لن تكون Maqass مسؤولة عن أي خسائر ناجمة عن انقطاع الخدمة، أخطاء في البيانات المُدخلة، أو أحداث خارجة عن إرادتنا. نسعى دائماً لضمان توافر الخدمة 99.9% من الوقت."
                        },
                        {
                            title: "٧. الملكية الفكرية",
                            content: "جميع حقوق ملكية المنصة والتصميمات والكود البرمجي محفوظة لـ Maqass. لا يُسمح بنسخ أو إعادة توزيع أي جزء من المنصة بدون إذن خطي مسبق."
                        },
                        {
                            title: "٨. القانون المطبّق",
                            content: "تخضع هذه الشروط لقوانين المملكة الأردنية الهاشمية. أي نزاع يُرجع إلى المحاكم الأردنية المختصة."
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
