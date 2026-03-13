"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Scissors, CheckCircle, Phone, Building2, User, MapPin, Users, MessageSquare, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import api from "@/lib/api";

type FormFields = "salon_name" | "owner_name" | "phone";

const RULES: Record<FormFields, { label: string; validate: (v: string) => string | null }> = {
    salon_name: {
        label: "اسم الصالون",
        validate: (v) => !v.trim() ? "اسم الصالون مطلوب" : v.trim().length < 2 ? "الاسم قصير جداً" : null,
    },
    owner_name: {
        label: "اسم صاحب الصالون",
        validate: (v) => !v.trim() ? "اسم صاحب الصالون مطلوب" : v.trim().length < 2 ? "الاسم قصير جداً" : null,
    },
    phone: {
        label: "رقم الجوال",
        validate: (v) => !v.trim() ? "رقم الجوال مطلوب" : !/^[\d\s\+\-\(\)]{7,}$/.test(v) ? "رقم الجوال غير صحيح" : null,
    },
};

export default function ContactPage() {
    const [form, setForm] = useState({
        salon_name: "", owner_name: "", phone: "", city: "", employees: "1", message: "",
    });
    const [errors, setErrors] = useState<Partial<Record<FormFields, string>>>({});
    const [touched, setTouched] = useState<Partial<Record<FormFields, boolean>>>({});
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [submitError, setSubmitError] = useState("");

    /* Validate a single field */
    const validateField = (field: FormFields, value: string) => {
        const msg = RULES[field].validate(value);
        setErrors(prev => ({ ...prev, [field]: msg ?? undefined }));
        return !msg;
    };

    /* Mark field as touched on blur */
    const handleBlur = (field: FormFields) => {
        setTouched(prev => ({ ...prev, [field]: true }));
        validateField(field, form[field]);
    };

    /* Handle change */
    const handleChange = (field: FormFields, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
        if (touched[field]) validateField(field, value);
    };

    /* Submit — validate all required fields first */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError("");

        // Touch all required fields
        const allTouched = { salon_name: true, owner_name: true, phone: true };
        setTouched(allTouched);

        // Validate all
        const newErrors: Partial<Record<FormFields, string>> = {};
        let valid = true;
        (Object.keys(RULES) as FormFields[]).forEach(field => {
            const msg = RULES[field].validate(form[field]);
            if (msg) { newErrors[field] = msg; valid = false; }
        });

        if (!valid) {
            setErrors(newErrors);
            // Scroll to first error
            const firstErrorEl = document.querySelector("[data-field-error]") as HTMLElement;
            firstErrorEl?.closest("[data-field]")?.scrollIntoView({ behavior: "smooth", block: "center" });
            return;
        }

        setLoading(true);
        try {
            await api.post("/public/contact.php", {
                ...form,
                employees: parseInt(form.employees.split("-")[0]),
            });
            setSuccess(true);
        } catch (err: any) {
            setSubmitError(err.response?.data?.message || "حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى");
        } finally {
            setLoading(false);
        }
    };

    /* Field input style based on error state */
    const inputStyle = (field: FormFields) => ({
        background: "rgba(255,255,255,.04)",
        border: `1px solid ${errors[field] && touched[field] ? "rgba(231,76,60,.5)" : "rgba(255,255,255,.08)"}`,
        color: "#fff",
        transition: "border-color .2s",
    });

    const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>, field?: FormFields) => {
        if (field && errors[field]) {
            e.target.style.borderColor = "rgba(231,76,60,.8)";
        } else {
            e.target.style.borderColor = "#c8a96e";
        }
    };

    const onBlurInput = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>, field: FormFields) => {
        handleBlur(field);
        e.target.style.borderColor = errors[field] ? "rgba(231,76,60,.5)" : "rgba(255,255,255,.08)";
    };

    return (
        <div className="min-h-screen bg-[#040404] text-white" style={{ fontFamily: "'Tajawal', sans-serif" }} dir="rtl">

            {/* Navbar */}
            <nav className="border-b border-white/[.04] px-6 py-4">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #c8a96e, #e8c96a)" }}>
                            <Scissors size={16} className="text-[#0a0a0a]" />
                        </div>
                        <span className="text-[18px] font-black tracking-wider text-white">MAQASS</span>
                    </Link>
                    <Link href="/" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors">
                        <ArrowRight size={14} />
                        العودة للرئيسية
                    </Link>
                </div>
            </nav>

            <div className="max-w-5xl mx-auto px-6 py-16">

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-6"
                        style={{ background: "rgba(200,169,110,.08)", border: "1px solid rgba(200,169,110,.15)", color: "#c8a96e" }}>
                        ابدأ رحلتك مع Maqass
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black mb-4">
                        أخبرنا عن <span style={{ color: "#c8a96e" }}>صالونك</span>
                    </h1>
                    <p className="text-gray-500 text-lg max-w-xl mx-auto">
                        سيتواصل معك فريقنا خلال 24 ساعة لإعداد الحساب وبدء الاشتراك مجاناً
                    </p>
                </motion.div>

                <AnimatePresence mode="wait">
                    {success ? (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-20"
                        >
                            <motion.div
                                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5, delay: 0.1 }}
                                className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center"
                                style={{ background: "rgba(46, 204, 113, 0.15)", border: "2px solid rgba(46, 204, 113, 0.3)" }}>
                                <CheckCircle size={48} className="text-emerald-400" />
                            </motion.div>
                            <h2 className="text-3xl font-black mb-4">تم الإرسال بنجاح! 🎉</h2>
                            <p className="text-gray-400 text-lg mb-8">
                                شكراً {form.owner_name}! سيتواصل معك فريقنا قريباً على رقم <span className="text-white font-bold">{form.phone}</span>
                            </p>
                            <Link href="/"
                                className="inline-flex items-center gap-2 px-8 py-3 rounded-full font-bold text-sm transition-all hover:scale-105"
                                style={{ background: "linear-gradient(135deg, #c8a96e, #e8c96a)", color: "#0a0a0a" }}>
                                العودة للرئيسية
                                <ArrowRight size={16} />
                            </Link>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="grid grid-cols-1 lg:grid-cols-5 gap-10"
                        >
                            {/* Form */}
                            <form onSubmit={handleSubmit} noValidate className="lg:col-span-3 space-y-5">
                                <div className="rounded-2xl p-6 space-y-5"
                                    style={{ background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.06)" }}>

                                    <h3 className="text-lg font-bold text-white mb-2"
                                        style={{ borderBottom: "1px solid rgba(255,255,255,.06)", paddingBottom: "12px" }}>
                                        معلومات الصالون
                                    </h3>

                                    {/* Salon Name */}
                                    <div data-field="salon_name">
                                        <label className="block text-sm text-gray-400 mb-2 flex items-center gap-1.5">
                                            <Building2 size={14} className="text-[#c8a96e]" /> اسم الصالون <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={form.salon_name}
                                            onChange={e => handleChange("salon_name", e.target.value)}
                                            onFocus={e => onFocus(e, "salon_name")}
                                            onBlur={e => onBlurInput(e, "salon_name")}
                                            placeholder="مثال: صالون النجم"
                                            className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                                            style={inputStyle("salon_name")}
                                        />
                                        <AnimatePresence>
                                            {errors.salon_name && touched.salon_name && (
                                                <motion.p data-field-error initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                                                    className="flex items-center gap-1.5 text-xs mt-1.5" style={{ color: "#e74c3c" }}>
                                                    <AlertCircle size={12} /> {errors.salon_name}
                                                </motion.p>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Owner Name */}
                                    <div data-field="owner_name">
                                        <label className="block text-sm text-gray-400 mb-2 flex items-center gap-1.5">
                                            <User size={14} className="text-[#c8a96e]" /> اسم صاحب الصالون <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={form.owner_name}
                                            onChange={e => handleChange("owner_name", e.target.value)}
                                            onFocus={e => onFocus(e, "owner_name")}
                                            onBlur={e => onBlurInput(e, "owner_name")}
                                            placeholder="الاسم الكامل"
                                            className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                                            style={inputStyle("owner_name")}
                                        />
                                        <AnimatePresence>
                                            {errors.owner_name && touched.owner_name && (
                                                <motion.p data-field-error initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                                                    className="flex items-center gap-1.5 text-xs mt-1.5" style={{ color: "#e74c3c" }}>
                                                    <AlertCircle size={12} /> {errors.owner_name}
                                                </motion.p>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Phone + City */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div data-field="phone">
                                            <label className="block text-sm text-gray-400 mb-2 flex items-center gap-1.5">
                                                <Phone size={14} className="text-[#c8a96e]" /> رقم الجوال <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="tel"
                                                value={form.phone}
                                                onChange={e => handleChange("phone", e.target.value)}
                                                onFocus={e => onFocus(e, "phone")}
                                                onBlur={e => onBlurInput(e, "phone")}
                                                placeholder="+962781717990"
                                                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                                                style={{ ...inputStyle("phone"), direction: "ltr", textAlign: "right" }}
                                            />
                                            <AnimatePresence>
                                                {errors.phone && touched.phone && (
                                                    <motion.p data-field-error initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                                                        className="flex items-center gap-1.5 text-xs mt-1.5" style={{ color: "#e74c3c" }}>
                                                        <AlertCircle size={12} /> {errors.phone}
                                                    </motion.p>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-2 flex items-center gap-1.5">
                                                <MapPin size={14} className="text-[#c8a96e]" /> المدينة
                                            </label>
                                            <input
                                                type="text"
                                                value={form.city}
                                                onChange={e => setForm({ ...form, city: e.target.value })}
                                                placeholder="عمّان، إربد..."
                                                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                                                style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", color: "#fff" }}
                                                onFocus={e => e.target.style.borderColor = "#c8a96e"}
                                                onBlur={e => e.target.style.borderColor = "rgba(255,255,255,.08)"}
                                            />
                                        </div>
                                    </div>

                                    {/* Employees Count */}
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-3 flex items-center gap-1.5">
                                            <Users size={14} className="text-[#c8a96e]" /> عدد الموظفين
                                        </label>
                                        <div className="grid grid-cols-4 gap-2">
                                            {["1", "2-3", "4-6", "7+"].map((opt) => (
                                                <button
                                                    key={opt}
                                                    type="button"
                                                    onClick={() => setForm({ ...form, employees: opt })}
                                                    className="py-2.5 rounded-xl text-sm font-bold transition-all"
                                                    style={{
                                                        background: form.employees === opt ? "rgba(200,169,110,.15)" : "rgba(255,255,255,.03)",
                                                        border: `1px solid ${form.employees === opt ? "#c8a96e" : "rgba(255,255,255,.06)"}`,
                                                        color: form.employees === opt ? "#c8a96e" : "#888",
                                                    }}
                                                >
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Message */}
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-2 flex items-center gap-1.5">
                                            <MessageSquare size={14} className="text-[#c8a96e]" /> ملاحظات إضافية (اختياري)
                                        </label>
                                        <textarea
                                            value={form.message}
                                            onChange={e => setForm({ ...form, message: e.target.value })}
                                            placeholder="أي تفاصيل إضافية تود إضافتها..."
                                            rows={3}
                                            className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all resize-none"
                                            style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", color: "#fff" }}
                                            onFocus={e => e.target.style.borderColor = "#c8a96e"}
                                            onBlur={e => e.target.style.borderColor = "rgba(255,255,255,.08)"}
                                        />
                                    </div>
                                </div>

                                {/* Server/Submit Error */}
                                <AnimatePresence>
                                    {submitError && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                            className="flex items-start gap-3 p-4 rounded-xl text-sm"
                                            style={{ background: "rgba(231,76,60,.1)", border: "1px solid rgba(231,76,60,.25)", color: "#e74c3c" }}>
                                            <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                            {submitError}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3.5 md:py-4 rounded-xl md:rounded-2xl font-bold text-sm md:text-base transition-all hover:scale-[1.02] disabled:opacity-60 disabled:scale-100 flex items-center justify-center gap-2 group overflow-hidden relative"
                                    style={{ background: "linear-gradient(135deg, #c8a96e, #e8c96a)", color: "#0a0a0a", boxShadow: "0 8px 30px rgba(200,169,110,.25)" }}
                                >
                                    {loading ? <Loader2 size={18} className="animate-spin relative z-10" /> : null}
                                    {loading ? <span className="relative z-10">جاري الإرسال...</span> : (
                                        <>
                                            <span className="relative z-10 font-bold">أرسل الطلب — مجاناً</span>
                                            <span className="relative z-10 font-sans text-base md:text-xl group-hover:-translate-x-1 transition-transform">←</span>
                                        </>
                                    )}
                                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12 z-0" />
                                </button>

                                <p className="text-center text-xs text-gray-600">
                                    الحقول المحددة بـ <span className="text-red-400">*</span> إلزامية
                                </p>
                            </form>

                            {/* Side Info */}
                            <div className="lg:col-span-2 space-y-5">
                                {/* Why Maqass */}
                                <div className="rounded-2xl p-6" style={{ background: "rgba(200,169,110,.06)", border: "1px solid rgba(200,169,110,.15)" }}>
                                    <h3 className="font-bold text-[#c8a96e] mb-4">لماذا Maqass؟</h3>
                                    <ul className="space-y-3 text-sm text-gray-400">
                                        {[
                                            "إعداد الحساب مجاناً",
                                            "رابط حجز فوري لزبائنك",
                                            "تقارير يومية وشهرية وسنوية",
                                            "إدارة الموظفين والعمولات",
                                            "دعم فني متواصل",
                                        ].map((item, i) => (
                                            <li key={i} className="flex items-center gap-2">
                                                <span className="text-[#c8a96e] text-xs">✓</span>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Contact Direct */}
                                <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.06)" }}>
                                    <h3 className="font-bold text-white mb-4">أو تواصل مباشرة</h3>
                                    <a
                                        href="https://wa.me/962781717990"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 p-4 rounded-xl transition-all hover:scale-[1.02]"
                                        style={{ background: "rgba(37, 211, 102, 0.1)", border: "1px solid rgba(37, 211, 102, 0.25)" }}
                                    >
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(37, 211, 102, 0.15)" }}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                                        </div>
                                        <div>
                                            <p className="text-emerald-400 font-bold text-sm">واتساب</p>
                                            <p className="text-gray-400 text-xs" dir="ltr">+962 78 171 7990</p>
                                        </div>
                                    </a>
                                </div>

                                {/* Response time */}
                                <div className="rounded-2xl p-5 flex flex-col items-center gap-1" style={{ background: "rgba(255,255,255,.015)", border: "1px solid rgba(255,255,255,.04)" }}>
                                    <p className="text-4xl font-black text-white">24h</p>
                                    <p className="text-xs font-bold" style={{ color: "#c8a96e" }}>الاستجابة المضمونة</p>
                                    <p className="text-sm text-gray-500">وقت الرد خلال 24 ساعة</p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
