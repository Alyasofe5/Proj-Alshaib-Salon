"use client";

import Link from "next/link";
import { Scissors, ArrowRight } from "lucide-react";

export default function TermsPage() {
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
                    <h1 className="text-4xl font-black mb-3">شروط الاستخدام</h1>
                    <p className="text-gray-500">باستخدامك لـ Maqass، فأنت توافق على الشروط التالية.</p>
                </div>

                <div className="space-y-8">
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
                        <div key={i} className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.05)" }}>
                            <h2 className="text-lg font-bold mb-3" style={{ color: "#c8a96e" }}>{section.title}</h2>
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
