"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Phone, Building2, User, MapPin, Users, MessageSquare, ArrowLeft, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import MaqassLogoIcon from "@/components/ui/MaqassLogoIcon";
import api from "@/lib/api";

type FormFields = "salon_name" | "owner_name" | "phone";

const RULES: Record<FormFields, { label: string; validate: (v: string) => string | null }> = {
    salon_name: { label: "اسم الصالون", validate: (v) => !v.trim() ? "اسم الصالون مطلوب" : v.trim().length < 2 ? "الاسم قصير جداً" : null },
    owner_name: { label: "اسم صاحب الصالون", validate: (v) => !v.trim() ? "اسم صاحب الصالون مطلوب" : v.trim().length < 2 ? "الاسم قصير جداً" : null },
    phone: { label: "رقم الجوال", validate: (v) => !v.trim() ? "رقم الجوال مطلوب" : !/^07\d{8}$/.test(v) ? "الرقم يجب أن يكون أردنياً من 10 أرقام (يبدأ بـ 07)" : null },
};

export default function ContactPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="spinner" /></div>}>
            <ContactPageInner />
        </Suspense>
    );
}

function ContactPageInner() {
    const searchParams = useSearchParams();
    const planName = searchParams.get("plan");    // e.g. "احترافي"
    const fromCtx  = searchParams.get("from");    // "free" | "cta" | null

    // Context-aware badge + subtitle
    const isFreeCtx = fromCtx === "free";
    const badge = isFreeCtx
        ? "ابدأ رحلتك مجاناً"
        : planName
        ? `اشتراك باقة ${planName}`
        : "ابدأ رحلتك مع Maqass";
    const subtitle = isFreeCtx
        ? "سيتواصل معك فريقنا خلال 24 ساعة لمساعدتك في تفعيل باقتك المجانية"
        : planName
        ? `سيتواصل معك فريقنا خلال 24 ساعة لإعداد اشتراك باقة ${planName} وتفعيل جميع المميزات`
        : "سيتواصل معك فريقنا خلال 24 ساعة لمساعدتك في اختيار أفضل باقة لصالونك";
    const [form, setForm] = useState({ salon_name: "", owner_name: "", phone: "", city: "", employees: "1", message: "" });
    const [errors, setErrors] = useState<Partial<Record<FormFields, string>>>({});
    const [touched, setTouched] = useState<Partial<Record<FormFields, boolean>>>({});
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [submitError, setSubmitError] = useState("");

    const validateField = (field: FormFields, value: string) => {
        const msg = RULES[field].validate(value);
        setErrors(prev => ({ ...prev, [field]: msg ?? undefined }));
        return !msg;
    };

    const handleBlur = (field: FormFields) => {
        setTouched(prev => ({ ...prev, [field]: true }));
        validateField(field, form[field]);
    };

    const handleChange = (field: FormFields, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
        if (touched[field]) validateField(field, value);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError("");
        const allTouched = { salon_name: true, owner_name: true, phone: true };
        setTouched(allTouched);
        const newErrors: Partial<Record<FormFields, string>> = {};
        let valid = true;
        (Object.keys(RULES) as FormFields[]).forEach(field => {
            const msg = RULES[field].validate(form[field]);
            if (msg) { newErrors[field] = msg; valid = false; }
        });
        if (!valid) { setErrors(newErrors); return; }
        setLoading(true);
        try {
            await api.post("/public/contact.php", { ...form, employees: parseInt(form.employees.split("-")[0]) });
            setSuccess(true);
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            setSubmitError(e.response?.data?.message || "حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى");
        } finally {
            setLoading(false);
        }
    };

    const inputBase = { background: "var(--off-white)", border: "1px solid var(--border)", color: "var(--text-main)", transition: "border-color .2s, box-shadow .2s" };
    const inputErr  = (field: FormFields) => errors[field] && touched[field] ? { ...inputBase, border: "1px solid rgba(231,76,60,.5)" } : inputBase;
    const onFocusInput = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        e.target.style.borderColor = "#C3D809";
        e.target.style.boxShadow   = "0 0 0 3px rgba(200,168,75,.12)";
    };
    const onBlurInput = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>, field: FormFields) => {
        handleBlur(field);
        e.target.style.borderColor = (errors[field] && touched[field]) ? "rgba(231,76,60,.5)" : "var(--border)";
        e.target.style.boxShadow   = "none";
    };
    const onBlurFree = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        e.target.style.borderColor = "var(--border)";
        e.target.style.boxShadow   = "none";
    };

    return (
        <div className="min-h-screen" style={{ background: "var(--off-white)", color: "var(--text-main)", fontFamily: "'Noto Sans Arabic', 'Noto Sans Arabic', sans-serif" }} dir="rtl">

            {/* Navbar */}
            <nav style={{ background: "var(--white)", borderBottom: "1px solid var(--border)" }} className="px-6 py-4 sticky top-0 z-50">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="relative flex-shrink-0 transition-all duration-700 group-hover:scale-110 group-hover:rotate-[5deg]">
                            <div className="absolute inset-0 rounded-full blur-xl opacity-20 bg-[var(--color-accent)] animate-pulse" />
                            <div className="relative w-11 h-11 rounded-full flex items-center justify-center p-[2px] overflow-hidden" 
                                 style={{ background: "linear-gradient(135deg, #C3D809 0%, rgba(195,216,9,0.1) 100%)" }}>
                                <div className="w-full h-full rounded-full bg-black flex items-center justify-center p-0.5 shadow-inner overflow-hidden">
                                    <MaqassLogoIcon size={32} />
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[16px] font-black tracking-wider leading-none maqass-brand">MAQASS</span>
                            <span className="text-[7px] font-semibold tracking-[.2em] mt-0.5 uppercase" style={{ color: "rgba(195,216,9,0.6)" }}>Salon Platform</span>
                        </div>
                    </Link>
                    <Link href="/" className="flex items-center gap-1.5 text-sm font-semibold transition-colors hover:opacity-70"
                        style={{ color: "#C3D809" }}>
                        العودة للرئيسية
                        <ArrowLeft size={14} />
                    </Link>
                </div>
            </nav>

            <div className="max-w-5xl mx-auto px-4 md:px-6 py-12 md:py-16">

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-6"
                        style={{ background: "var(--gold-bg)", border: "1px solid #D4EC0A", color: "var(--color-accent)" }}>
                        {badge}
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black mb-4" style={{ color: "var(--text-main)" }}>
                        أخبرنا عن <span style={{ color: "#C3D809" }}>صالونك</span>
                    </h1>
                    <p className="text-lg max-w-xl mx-auto" style={{ color: "var(--text-mid)" }}>
                        {subtitle}
                    </p>
                </motion.div>

                <AnimatePresence mode="wait">
                    {success ? (
                        <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-20">
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5, delay: 0.1 }}
                                className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center"
                                style={{ background: "rgba(46,204,113,.12)", border: "2px solid rgba(46,204,113,.3)" }}>
                                <CheckCircle size={48} style={{ color: "var(--success)" }} />
                            </motion.div>
                            <h2 className="text-3xl font-black mb-4" style={{ color: "var(--text-main)" }}>تم الإرسال بنجاح! 🎉</h2>
                            <p className="text-lg mb-8" style={{ color: "var(--text-mid)" }}>
                                شكراً {form.owner_name}! سيتواصل معك فريقنا قريباً على رقم{" "}
                                <span className="font-bold" style={{ color: "var(--text-main)" }}>{form.phone}</span>
                            </p>
                            <Link href="/"
                                className="inline-flex items-center gap-2 px-8 py-3 rounded-full font-bold text-sm transition-all hover:scale-105"
                                style={{ background: "linear-gradient(135deg, #C3D809, #D4EC0A)", color: "var(--color-background)", boxShadow: "0 8px 24px rgba(195,216,9,0.25)" }}>
                                العودة للرئيسية
                                <ArrowRight size={16} />
                            </Link>
                        </motion.div>
                    ) : (
                        <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            className="grid grid-cols-1 lg:grid-cols-5 gap-10">

                            {/* Form */}
                            <form onSubmit={handleSubmit} noValidate className="lg:col-span-3 space-y-5">
                                <div className="rounded-2xl p-6 space-y-5"
                                    style={{ background: "var(--white)", border: "1px solid var(--border)" }}>
                                    <h3 className="text-lg font-bold pb-3" style={{ borderBottom: "1px solid var(--border)", color: "var(--text-main)" }}>
                                        معلومات الصالون
                                    </h3>

                                    {/* Salon Name */}
                                    <div data-field="salon_name">
                                        <label className="block text-sm font-semibold mb-2 flex items-center gap-1.5" style={{ color: "var(--text-mid)" }}>
                                            <Building2 size={14} style={{ color: "#C3D809" }} /> اسم الصالون <span style={{ color: "var(--error)" }}>*</span>
                                        </label>
                                        <input type="text" value={form.salon_name}
                                            onChange={e => handleChange("salon_name", e.target.value)}
                                            onFocus={onFocusInput}
                                            onBlur={e => onBlurInput(e, "salon_name")}
                                            placeholder="مثال: صالون النجم"
                                            className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                                            style={inputErr("salon_name")} />
                                        <AnimatePresence>
                                            {errors.salon_name && touched.salon_name && (
                                                <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                                                    className="flex items-center gap-1.5 text-xs mt-1.5" style={{ color: "var(--error)" }}>
                                                    <AlertCircle size={12} /> {errors.salon_name}
                                                </motion.p>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Owner Name */}
                                    <div data-field="owner_name">
                                        <label className="block text-sm font-semibold mb-2 flex items-center gap-1.5" style={{ color: "var(--text-mid)" }}>
                                            <User size={14} style={{ color: "#C3D809" }} /> اسم صاحب الصالون <span style={{ color: "var(--error)" }}>*</span>
                                        </label>
                                        <input type="text" value={form.owner_name}
                                            onChange={e => handleChange("owner_name", e.target.value)}
                                            onFocus={onFocusInput}
                                            onBlur={e => onBlurInput(e, "owner_name")}
                                            placeholder="الاسم الكامل"
                                            className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                                            style={inputErr("owner_name")} />
                                        <AnimatePresence>
                                            {errors.owner_name && touched.owner_name && (
                                                <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                                                    className="flex items-center gap-1.5 text-xs mt-1.5" style={{ color: "var(--error)" }}>
                                                    <AlertCircle size={12} /> {errors.owner_name}
                                                </motion.p>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Phone + City */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div data-field="phone">
                                            <label className="block text-sm font-semibold mb-2 flex items-center gap-1.5" style={{ color: "var(--text-mid)" }}>
                                                <Phone size={14} style={{ color: "#C3D809" }} /> رقم الجوال <span style={{ color: "var(--error)" }}>*</span>
                                            </label>
                                            <input type="tel" value={form.phone}
                                                onChange={e => handleChange("phone", e.target.value)}
                                                onFocus={onFocusInput}
                                                onBlur={e => onBlurInput(e, "phone")}
                                                placeholder="0791234567"
                                                maxLength={10}
                                                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                                                style={{ ...inputErr("phone"), direction: "ltr", textAlign: "right" }} />
                                            <AnimatePresence>
                                                {errors.phone && touched.phone && (
                                                    <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                                                        className="flex items-center gap-1.5 text-xs mt-1.5" style={{ color: "var(--error)" }}>
                                                        <AlertCircle size={12} /> {errors.phone}
                                                    </motion.p>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold mb-2 flex items-center gap-1.5" style={{ color: "var(--text-mid)" }}>
                                                <MapPin size={14} style={{ color: "#C3D809" }} /> المدينة
                                            </label>
                                            <input type="text" value={form.city}
                                                onChange={e => setForm({ ...form, city: e.target.value })}
                                                placeholder="عمّان، إربد..."
                                                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                                                style={inputBase}
                                                onFocus={onFocusInput}
                                                onBlur={onBlurFree} />
                                        </div>
                                    </div>

                                    {/* Employees Count */}
                                    <div>
                                        <label className="block text-sm font-semibold mb-3 flex items-center gap-1.5" style={{ color: "var(--text-mid)" }}>
                                            <Users size={14} style={{ color: "#C3D809" }} /> عدد الموظفين
                                        </label>
                                        <div className="grid grid-cols-4 gap-2">
                                            {["1", "2-3", "4-6", "7+"].map((opt) => (
                                                <button key={opt} type="button" onClick={() => setForm({ ...form, employees: opt })}
                                                    className="py-2.5 rounded-xl text-sm font-bold transition-all"
                                                    style={{
                                                        background: form.employees === opt ? "var(--gold-bg)" : "var(--off-white)",
                                                        border: `1px solid ${form.employees === opt ? "#C3D809" : "var(--border)"}`,
                                                        color: form.employees === opt ? "var(--color-accent)" : "var(--text-muted)",
                                                    }}>
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Message */}
                                    <div>
                                        <label className="block text-sm font-semibold mb-2 flex items-center gap-1.5" style={{ color: "var(--text-mid)" }}>
                                            <MessageSquare size={14} style={{ color: "#C3D809" }} /> ملاحظات إضافية (اختياري)
                                        </label>
                                        <textarea value={form.message}
                                            onChange={e => setForm({ ...form, message: e.target.value })}
                                            placeholder="أي تفاصيل إضافية تود إضافتها..."
                                            rows={3}
                                            className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all resize-none"
                                            style={inputBase}
                                            onFocus={onFocusInput}
                                            onBlur={onBlurFree} />
                                    </div>
                                </div>

                                {/* Submit Error */}
                                <AnimatePresence>
                                    {submitError && (
                                        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                            className="flex items-start gap-3 p-4 rounded-xl text-sm"
                                            style={{ background: "rgba(231,76,60,.06)", border: "1px solid rgba(231,76,60,.2)", color: "var(--error)" }}>
                                            <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                            {submitError}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <button type="submit" disabled={loading}
                                    className="w-full py-3.5 md:py-4 rounded-xl md:rounded-2xl font-bold text-sm md:text-base transition-all hover:scale-[1.02] disabled:opacity-60 disabled:scale-100 flex items-center justify-center gap-2 group overflow-hidden relative"
                                    style={{ background: "linear-gradient(135deg, #C3D809, #D4EC0A)", color: "var(--color-cta-text)", boxShadow: "0 8px 30px rgba(195,216,9,0.25)" }}>
                                    {loading ? <Loader2 size={18} className="animate-spin relative z-10" /> : null}
                                    {loading ? <span className="relative z-10">جاري الإرسال...</span> : (
                                        <>
                                            <span className="relative z-10 font-bold">أرسل الطلب — مجاناً</span>
                                            <span className="relative z-10 font-sans text-base md:text-xl group-hover:-translate-x-1 transition-transform">←</span>
                                        </>
                                    )}
                                    <div className="absolute inset-0 bg-white/30 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12 z-0" />
                                </button>

                                <p className="text-center text-xs" style={{ color: "var(--text-muted)" }}>
                                    الحقول المحددة بـ <span style={{ color: "var(--error)" }}>*</span> إلزامية
                                </p>
                            </form>

                            {/* Side Info */}
                            <div className="lg:col-span-2 space-y-5">
                                {/* Why Maqass */}
                                <div className="rounded-2xl p-6" style={{ background: "var(--gold-bg)", border: "1px solid #D4EC0A" }}>
                                    <h3 className="font-bold mb-4" style={{ color: "var(--color-accent)" }}>لماذا Maqass؟</h3>
                                    <ul className="space-y-3 text-sm" style={{ color: "var(--text-mid)" }}>
                                        {["إعداد الحساب مجاناً", "رابط حجز فوري لزبائنك", "تقارير يومية وشهرية وسنوية", "إدارة الموظفين والعمولات", "دعم فني متواصل"].map((item, i) => (
                                            <li key={i} className="flex items-center gap-2">
                                                <span className="text-xs font-bold" style={{ color: "#C3D809" }}>✓</span>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* WhatsApp Direct */}
                                <div className="rounded-2xl p-6" style={{ background: "var(--white)", border: "1px solid var(--border)" }}>
                                    <h3 className="font-bold mb-4" style={{ color: "var(--text-main)" }}>أو تواصل مباشرة</h3>
                                    <a href="https://wa.me/962781717990" target="_blank" rel="noopener noreferrer"
                                        className="flex items-center gap-3 p-4 rounded-xl transition-all hover:scale-[1.02]"
                                        style={{ background: "rgba(37,211,102,.08)", border: "1px solid rgba(37,211,102,.25)" }}>
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                                            style={{ background: "rgba(37,211,102,.15)" }}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" /><path d="M11.992 0C5.374 0 0 5.373 0 11.99c0 2.117.554 4.099 1.522 5.819L.057 24l6.304-1.654A11.945 11.945 0 0011.992 24c6.618 0 11.992-5.373 11.992-11.99C23.984 5.373 18.61 0 11.992 0z" /></svg>
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm" style={{ color: "#25D366" }}>واتساب</p>
                                            <p className="text-xs" dir="ltr" style={{ color: "var(--text-mid)" }}>+962 78 171 7990</p>
                                        </div>
                                    </a>
                                </div>

                                {/* Response time */}
                                <div className="rounded-2xl p-5 flex flex-col items-center gap-1 text-center"
                                    style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                                    <p className="text-4xl font-black" style={{ color: "var(--text-main)" }}>24h</p>
                                    <p className="text-xs font-bold" style={{ color: "#C3D809" }}>الاستجابة المضمونة</p>
                                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>وقت الرد خلال 24 ساعة</p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
