"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { servicesAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { FaCamera, FaCheck, FaArrowRight, FaExternalLinkAlt, FaPlus, FaTrash, FaPen, FaTimes, FaSave, FaImage, FaQrcode, FaDownload } from "react-icons/fa";
import axios from "axios";
import Cookies from "js-cookie";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

interface ServiceItem {
    id: number;
    name: string;
    price: string;
    image_path: string | null;
    is_active: number;
}

interface SalonSettings {
    name: string;
    slug: string;
    description: string;
    address: string;
    instagram: string;
    owner_phone: string;
    booking_message: string;
    hero_image: string | null;
    work_start: string;
    work_end: string;
    work_interval: number;
    off_days: number[];
    booking_days: number;
}

export default function BookingSettingsPage() {
    const { user, salon, setSalon } = useAuthStore();
    const router = useRouter();
    const [services, setServices] = useState<ServiceItem[]>([]);
    const [settings, setSettings] = useState<SalonSettings | null>(null);
    const [uploading, setUploading] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [heroUploading, setHeroUploading] = useState(false);
    const heroInputRef = useRef<HTMLInputElement>(null);
    const logoInputRef = useRef<HTMLInputElement>(null);
    const [logoUploading, setLogoUploading] = useState(false);
    const [logoSaved, setLogoSaved] = useState(false);
    const [currentLogo, setCurrentLogo] = useState<string | null>(null);
    const [copiedLink, setCopiedLink] = useState(false);

    // Service editing
    const [editingService, setEditingService] = useState<number | null>(null);
    const [editName, setEditName] = useState("");
    const [editPrice, setEditPrice] = useState("");
    const [savingService, setSavingService] = useState(false);

    // Add new service
    const [showAdd, setShowAdd] = useState(false);
    const [newName, setNewName] = useState("");
    const [newPrice, setNewPrice] = useState("");
    const [addingService, setAddingService] = useState(false);

    // Delete confirmation
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    // Set current logo from store on mount
    useEffect(() => {
        if (salon?.logo) setCurrentLogo(salon.logo);
    }, [salon]);

    const loadData = async () => {
        try {
            const [servRes, settRes] = await Promise.all([
                servicesAPI.getAll(),
                axios.get(`${API_BASE}/salon/settings.php`, {
                    headers: { Authorization: `Bearer ${Cookies.get("token")}` },
                }),
            ]);
            setServices(servRes.data.data || []);
            const settData = settRes.data.data || null;
            setSettings(settData);
            if (settData?.logo) setCurrentLogo(settData.logo);
        } catch (e) { console.error(e); }
    };

    const handleLogoUpload = async (file: File) => {
        setLogoUploading(true);
        try {
            const formData = new FormData();
            formData.append("logo", file);
            const res = await axios.post(`${API_BASE}/salon/logo.php`, formData, {
                headers: {
                    Authorization: `Bearer ${Cookies.get("token")}`,
                    "Content-Type": "multipart/form-data",
                },
            });
            if (res.data.success && res.data.data?.logo) {
                const newLogoPath = res.data.data.logo;
                const protocol = window.location.protocol;
                const host = window.location.host;
                // For production, the API returns a relative path
                const fullLogoUrl = newLogoPath.startsWith("http") ? newLogoPath : `${protocol}//${host}/${newLogoPath}`;
                setCurrentLogo(fullLogoUrl);
                // Update the zustand store so that the sidebar updates immediately
                if (salon) {
                    setSalon({ ...salon, logo: fullLogoUrl });
                }
                setLogoSaved(true);
                setTimeout(() => setLogoSaved(false), 2500);
            }
        } catch (e) { console.error(e); }
        finally { setLogoUploading(false); }
    };

    const handleImageUpload = async (serviceId: number, file: File) => {
        setUploading(serviceId);
        try {
            await servicesAPI.uploadImage(serviceId, file);
            await loadData();
        } catch (e) { console.error(e); }
        finally { setUploading(null); }
    };

    const handleHeroUpload = async (file: File) => {
        setHeroUploading(true);
        try {
            const formData = new FormData();
            formData.append("image", file);
            await axios.post(`${API_BASE}/salon/hero-image.php`, formData, {
                headers: {
                    Authorization: `Bearer ${Cookies.get("token")}`,
                    "Content-Type": "multipart/form-data",
                },
            });
            await loadData();
        } catch (e) { console.error(e); }
        finally { setHeroUploading(false); }
    };

    const handleSaveSettings = async () => {
        if (!settings) return;
        setSaving(true);
        try {
            await axios.put(`${API_BASE}/salon/settings.php`, settings, {
                headers: {
                    Authorization: `Bearer ${Cookies.get("token")}`,
                    "Content-Type": "application/json",
                },
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
        } catch (e) { console.error(e); }
        finally { setSaving(false); }
    };

    const startEdit = (s: ServiceItem) => {
        setEditingService(s.id);
        setEditName(s.name);
        setEditPrice(s.price);
    };

    const cancelEdit = () => {
        setEditingService(null);
        setEditName("");
        setEditPrice("");
    };

    const saveServiceEdit = async () => {
        if (!editingService || !editName.trim()) return;
        setSavingService(true);
        try {
            await servicesAPI.update(editingService, { name: editName.trim(), price: parseFloat(editPrice) || 0 });
            cancelEdit();
            await loadData();
        } catch (e) { console.error(e); }
        finally { setSavingService(false); }
    };

    const addService = async () => {
        if (!newName.trim()) return;
        setAddingService(true);
        try {
            await servicesAPI.create({ name: newName.trim(), price: parseFloat(newPrice) || 0 });
            setNewName("");
            setNewPrice("");
            setShowAdd(false);
            await loadData();
        } catch (e) { console.error(e); }
        finally { setAddingService(false); }
    };

    const deleteService = async (id: number) => {
        setDeleting(true);
        try {
            await servicesAPI.delete(id);
            setDeleteId(null);
            await loadData();
        } catch (e) {
            alert("لا يمكن حذف هذه الخدمة — قد تكون مرتبطة بفواتير");
            console.error(e);
        }
        finally { setDeleting(false); }
    };

    const toggleService = async (id: number) => {
        try {
            await servicesAPI.toggle(id);
            await loadData();
        } catch (e) { console.error(e); }
    };

    const gold = "#E6B31E";
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

    if (!settings) return (
        <div className="min-h-screen flex items-center justify-center bg-[#343434]">
            <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${gold} transparent ${gold} ${gold}` }} />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#343434] text-[#FCFAF1]" dir="rtl" style={{ fontFamily: "'Tajawal', sans-serif" }}>
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800&display=swap');
            `}</style>

            {/* Header */}
            <header className="sticky top-0 z-40 backdrop-blur-xl" style={{ background: "rgba(45,45,45,.95)", borderBottom: "1px solid rgba(230,179,30,.12)" }}>
                <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3 md:gap-4">
                        <button onClick={() => router.push("/admin/dashboard")} className="text-[#FCFAF1]/40 hover:text-[#FCFAF1] transition-colors">
                            <FaArrowRight />
                        </button>
                        <h1 className="text-base md:text-lg font-bold">تخصيص الحجز</h1>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                        <a href={`/book/?s=${settings.slug}`} target="_blank" rel="noopener noreferrer"
                            className="hidden sm:flex items-center gap-2 text-xs text-[#FCFAF1]/40 hover:text-[#FCFAF1] transition-colors">
                            <FaExternalLinkAlt /> معاينة
                        </a>
                        <button onClick={handleSaveSettings} disabled={saving}
                            className="h-9 md:h-10 px-4 md:px-6 rounded-xl text-xs md:text-sm font-bold transition-all hover:scale-105 disabled:opacity-50 flex items-center gap-1.5 md:gap-2"
                            style={{ background: saved ? "#22c55e" : gold, color: "#000" }}>
                            {saved ? <><FaCheck /> الحفظ</> : saving ? "جاري..." : <><FaSave className="md:hidden" /> <span className="hidden md:inline">حفظ الإعدادات</span></>}
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-8 md:space-y-10">

                {/* ══════ Section: Booking Link + QR Code ══════ */}
                <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${gold}15`, color: gold }}>
                            <FaExternalLinkAlt size={13} />
                        </div>
                        <h2 className="text-xl font-bold">رابط الحجز للزبائن</h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                        {/* ── Booking Link Card ── */}
                        <div className="lg:col-span-2 rounded-2xl p-5 md:p-6" style={{ background: "linear-gradient(135deg, rgba(230,179,30,.08) 0%, rgba(230,179,30,.02) 100%)", border: "1px solid rgba(230,179,30,.2)" }}>
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(230,179,30,.15)" }}>
                                        <FaExternalLinkAlt size={14} color={gold} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[#FCFAF1] font-bold text-sm">رابط الحجز</p>
                                        <p className="text-[#8A8A8A] text-xs mt-0.5 font-mono truncate" dir="ltr">{baseUrl}/book/?s={settings.slug}</p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <button onClick={() => {
                                        navigator.clipboard.writeText(`${baseUrl}/book/?s=${settings.slug}`);
                                        setCopiedLink(true); setTimeout(() => setCopiedLink(false), 2000);
                                    }}
                                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${copiedLink ? "bg-emerald-500/20 text-emerald-400" : "bg-[#E6B31E]/15 text-[#E6B31E] hover:bg-[#E6B31E]/25"}`}
                                    >
                                        {copiedLink ? "✅ تم النسخ" : "📋 نسخ الرابط"}
                                    </button>
                                    <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`احجز موعدك الآن في ${settings.name}! 💇‍♂️\n\n${baseUrl}/book/?s=${settings.slug}`)}`, "_blank")}
                                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-all"
                                    >
                                        مشاركة واتساب 💬
                                    </button>
                                    <a href={`/book/?s=${settings.slug}`} target="_blank" rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-[#CACACA] hover:text-[#FCFAF1] hover:bg-white/10 transition-all"
                                    >
                                        <FaExternalLinkAlt size={10} /> معاينة
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* ── QR Code Card ── */}
                        <div className="rounded-2xl p-5 flex flex-col items-center gap-4" style={{ background: "#2D2D2D", border: "1px solid rgba(230,179,30,.15)" }}>
                            <div className="flex items-center gap-2 self-start">
                                <FaQrcode style={{ color: gold }} size={14} />
                                <p className="text-sm font-bold text-[#FCFAF1]">باركود الحجز</p>
                            </div>

                            {['professional', 'enterprise'].includes(salon?.plan_type || '') ? (
                                <>
                                    {/* QR Code Display */}
                                    <div className="p-3 rounded-xl" style={{ background: "#fff" }}>
                                        <QRCodeSVG
                                            id="salon-qr-svg"
                                            value={`${baseUrl}/book/?s=${settings.slug}`}
                                            size={140}
                                            bgColor="#ffffff"
                                            fgColor="#000000"
                                            level="H"
                                            includeMargin={false}
                                        />
                                    </div>

                                    {/* Hidden Canvas for Download */}
                                    <QRCodeCanvas
                                        id="salon-qr-canvas"
                                        value={`${baseUrl}/book/?s=${settings.slug}`}
                                        size={800}
                                        bgColor="#ffffff"
                                        fgColor="#000000"
                                        level="H"
                                        includeMargin={true}
                                        style={{ display: "none" }}
                                    />

                                    <p className="text-[10px] text-[#FCFAF1]/25 text-center">امسح الكود بالموبايل للحجز مباشرة</p>

                                    {/* Download Button */}
                                    <button
                                        onClick={() => {
                                            const canvas = document.getElementById("salon-qr-canvas") as HTMLCanvasElement;
                                            if (!canvas) return;
                                            const link = document.createElement("a");
                                            link.download = `qr-${settings.slug}.png`;
                                            link.href = canvas.toDataURL("image/png");
                                            link.click();
                                        }}
                                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all hover:scale-105"
                                        style={{ background: `${gold}15`, color: gold, border: `1px solid ${gold}30` }}
                                    >
                                        <FaDownload size={11} /> تنزيل الباركود
                                    </button>
                                </>
                            ) : (
                                <>
                                    {/* Locked QR — Blurred Preview */}
                                    <div className="relative p-3 rounded-xl" style={{ background: "#fff" }}>
                                        <div style={{ filter: "blur(6px)", pointerEvents: "none" }}>
                                            <QRCodeSVG
                                                value={`${baseUrl}/book/?s=${settings.slug}`}
                                                size={140}
                                                bgColor="#ffffff"
                                                fgColor="#000000"
                                                level="H"
                                                includeMargin={false}
                                            />
                                        </div>
                                        <div className="absolute inset-0 flex items-center justify-center rounded-xl"
                                            style={{ background: "rgba(0,0,0,.55)" }}>
                                            <span className="text-2xl">🔒</span>
                                        </div>
                                    </div>

                                    <p className="text-[11px] text-[#FCFAF1]/40 text-center leading-relaxed">
                                        متاحة فقط في باقة<br />
                                        <span style={{ color: gold }} className="font-bold">الاحترافي والمؤسسات</span>
                                    </p>

                                    <button
                                        onClick={() => window.location.href = "/admin/dashboard"}
                                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all hover:scale-105"
                                        style={{ background: `${gold}20`, color: gold, border: `1px solid ${gold}40` }}
                                    >
                                        ترقية الباقة ⬆️
                                    </button>
                                </>
                            )}
                        </div>

                    </div>
                </motion.section>

                {/* ══════ Section: Salon Logo ══════ */}
                <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${gold}15`, color: gold }}>
                            <FaImage size={14} />
                        </div>
                        <h2 className="text-xl font-bold">لوجو الصالون</h2>
                    </div>
                    <div className="rounded-2xl p-6" style={{ background: "#2D2D2D", border: "1px solid rgba(230,179,30,.12)" }}>
                        <div className="flex items-center gap-6">
                            {/* Logo Preview */}
                            <div className="relative group cursor-pointer flex-shrink-0" onClick={() => logoInputRef.current?.click()}>
                                <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden flex items-center justify-center transition-all"
                                    style={{ background: "#343434", border: `2px solid ${currentLogo ? `${gold}40` : "rgba(230,179,30,.15)"}` }}>
                                    {currentLogo ? (
                                        <img src={currentLogo.startsWith("http") ? currentLogo : `/${currentLogo}`} alt="Logo" className="w-full h-full object-cover group-hover:opacity-40 transition-opacity" />
                                    ) : (
                                        <div className="text-center">
                                            <span className="text-3xl font-black" style={{ color: gold }}>{settings.name?.charAt(0) || "?"}</span>
                                        </div>
                                    )}
                                </div>
                                {/* Overlay */}
                                <div className="absolute inset-0 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50">
                                    {logoUploading ? (
                                        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${gold} transparent ${gold} ${gold}` }} />
                                    ) : (
                                        <FaCamera className="text-[#FCFAF1]" size={18} />
                                    )}
                                </div>
                                {/* Success badge */}
                                <AnimatePresence>
                                    {logoSaved && (
                                        <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                                            className="absolute -top-2 -left-2 w-7 h-7 rounded-full flex items-center justify-center bg-emerald-500 text-[#FCFAF1] shadow-lg">
                                            <FaCheck size={10} />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                <input ref={logoInputRef} type="file" accept="image/*" className="hidden"
                                    onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); e.target.value = ""; }} />
                            </div>
                            {/* Logo Info */}
                            <div className="flex-1">
                                <p className="text-sm font-bold text-[#FCFAF1] mb-1">شعار الصالون</p>
                                <p className="text-xs text-[#FCFAF1]/30 mb-3 leading-relaxed">يظهر في صفحة الحجز والسايدبار. يُفضل صورة مربعة بدقة عالية (512×512 أو أكبر)</p>
                                <button onClick={() => logoInputRef.current?.click()} disabled={logoUploading}
                                    className="flex items-center gap-2 h-9 px-5 rounded-xl text-xs font-bold transition-all hover:scale-105 disabled:opacity-50"
                                    style={{ background: `${gold}15`, color: gold, border: `1px solid ${gold}30` }}>
                                    <FaCamera size={10} />
                                    {logoUploading ? "جاري الرفع..." : logoSaved ? "✓ تم الرفع" : "تغيير اللوجو"}
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.section>

                {/* ══════ Section: Salon Info ══════ */}
                <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }}>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${gold}15`, color: gold }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                        </div>
                        <h2 className="text-xl font-bold">معلومات الصالون</h2>
                    </div>
                    <div className="rounded-2xl p-6 space-y-5" style={{ background: "#2D2D2D", border: "1px solid rgba(230,179,30,.12)" }}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <InputField label="اسم الصالون" value={settings.name} onChange={v => setSettings({ ...settings, name: v })} gold={gold} />
                            <InputField label="رقم الهاتف" value={settings.owner_phone} onChange={v => setSettings({ ...settings, owner_phone: v })} gold={gold} dir="ltr" />
                            <InputField label="العنوان" value={settings.address} onChange={v => setSettings({ ...settings, address: v })} gold={gold} />
                            <InputField label="انستقرام" value={settings.instagram} onChange={v => setSettings({ ...settings, instagram: v })} gold={gold} dir="ltr" placeholder="@username" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-[#FCFAF1]/30 mb-2 block uppercase tracking-wider">وصف الصالون</label>
                            <textarea value={settings.description} onChange={e => setSettings({ ...settings, description: e.target.value })} rows={4}
                                className="w-full py-3 px-4 rounded-xl bg-[#343434] text-[#FCFAF1] outline-none resize-none text-sm transition-all"
                                style={{ border: "1.5px solid rgba(230,179,30,.12)" }}
                                onFocus={e => e.currentTarget.style.borderColor = gold}
                                onBlur={e => e.currentTarget.style.borderColor = "rgba(230,179,30,.12)"} />
                        </div>
                        <InputField label="رسالة بعد الحجز" value={settings.booking_message} onChange={v => setSettings({ ...settings, booking_message: v })} gold={gold} placeholder="مثال: شكراً لحجزك!" />
                    </div>
                </motion.section>

                {/* ══════ Section: Work Hours & Off Days ══════ */}
                <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${gold}15`, color: gold }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                        </div>
                        <h2 className="text-xl font-bold">ساعات العمل والإجازات</h2>
                    </div>
                    <div className="rounded-2xl p-6 space-y-6" style={{ background: "#2D2D2D", border: "1px solid rgba(230,179,30,.12)" }}>
                        {/* Work Hours */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <TimePicker12 label="بداية الدوام" value={settings.work_start} onChange={(v: string) => setSettings({ ...settings, work_start: v })} gold={gold} />
                            <TimePicker12 label="نهاية الدوام" value={settings.work_end} onChange={(v: string) => setSettings({ ...settings, work_end: v })} gold={gold} />
                            <div>
                                <label className="text-xs font-bold text-[#FCFAF1]/30 mb-2 block uppercase tracking-wider">الفاصل الزمني (دقيقة)</label>
                                <select value={settings.work_interval} onChange={e => setSettings({ ...settings, work_interval: Number(e.target.value) })}
                                    className="w-full py-3 px-4 rounded-xl bg-[#343434] text-[#FCFAF1] outline-none text-sm transition-all cursor-pointer appearance-none"
                                    style={{ border: "1.5px solid rgba(230,179,30,.12)" }}>
                                    <option value={15}>15 دقيقة</option>
                                    <option value={20}>20 دقيقة</option>
                                    <option value={30}>30 دقيقة</option>
                                    <option value={45}>45 دقيقة</option>
                                    <option value={60}>60 دقيقة</option>
                                </select>
                            </div>
                        </div>

                        {/* Booking Days */}
                        <div>
                            <label className="text-xs font-bold text-[#FCFAF1]/30 mb-2 block uppercase tracking-wider">عدد أيام الحجز المتاحة</label>
                            <div className="flex items-center gap-4">
                                <select value={settings.booking_days} onChange={e => setSettings({ ...settings, booking_days: Number(e.target.value) })}
                                    className="w-40 py-3 px-4 rounded-xl bg-[#343434] text-[#FCFAF1] outline-none text-sm transition-all cursor-pointer appearance-none"
                                    style={{ border: "1.5px solid rgba(230,179,30,.12)" }}>
                                    {[3, 4, 5, 6, 7, 10, 14, 21, 30].map(n => (
                                        <option key={n} value={n}>{n} أيام</option>
                                    ))}
                                </select>
                                <p className="text-xs text-[#FCFAF1]/20">عدد الأيام اللي تظهر بصفحة الحجز (بدون أيام الإجازة)</p>
                            </div>
                        </div>

                        {/* Off Days */}
                        <div>
                            <label className="text-xs font-bold text-[#FCFAF1]/30 mb-3 block uppercase tracking-wider">أيام الإجازة</label>
                            <div className="flex flex-wrap gap-2">
                                {["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"].map((dayName, dayIndex) => {
                                    const isOff = settings.off_days.includes(dayIndex);
                                    return (
                                        <button key={dayIndex}
                                            onClick={() => {
                                                const newDays = isOff
                                                    ? settings.off_days.filter(d => d !== dayIndex)
                                                    : [...settings.off_days, dayIndex];
                                                setSettings({ ...settings, off_days: newDays });
                                            }}
                                            className="px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 hover:scale-105"
                                            style={{
                                                background: isOff ? "rgba(231,76,60,.15)" : "#343434",
                                                color: isOff ? "#e74c3c" : "#888",
                                                border: `1.5px solid ${isOff ? "rgba(231,76,60,.3)" : "rgba(230,179,30,.12)"}`,
                                            }}>
                                            {isOff ? "🚫 " : ""}{dayName}
                                        </button>
                                    );
                                })}
                            </div>
                            <p className="text-xs text-[#FCFAF1]/20 mt-2">اضغط على اليوم لإضافته/إزالته من أيام الإجازة</p>
                        </div>
                    </div>
                </motion.section>

                {/* ══════ Section: Hero Image ══════ */}
                <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${gold}15`, color: gold }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                        </div>
                        <h2 className="text-xl font-bold">صورة الخلفية الرئيسية</h2>
                    </div>
                    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(230,179,30,.12)" }}>
                        <div className="relative h-48 md:h-64 bg-[#2D2D2D] flex items-center justify-center cursor-pointer group"
                            onClick={() => heroInputRef.current?.click()}>
                            {settings.hero_image ? (
                                <img src={settings.hero_image} alt="Hero" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
                            ) : (
                                <div className="text-[#FCFAF1]/15 text-center">
                                    <FaCamera className="text-4xl mx-auto mb-3" />
                                    <p className="text-sm">لا توجد صورة — اضغط لرفع صورة</p>
                                </div>
                            )}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                                <div className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold" style={{ background: gold, color: "#000" }}>
                                    <FaCamera /> {heroUploading ? "جاري الرفع..." : "تغيير الصورة"}
                                </div>
                            </div>
                            <input ref={heroInputRef} type="file" accept="image/*" className="hidden"
                                onChange={e => { const f = e.target.files?.[0]; if (f) handleHeroUpload(f); }} />
                        </div>
                    </div>
                </motion.section>

                {/* ══════ Section: Services Management ══════ */}
                <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.25 }}>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${gold}15`, color: gold }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15.5 2-8.46 8.46a2 2 0 0 0 0 2.83l3.67 3.67a2 2 0 0 0 2.83 0L22 8.5" /><path d="M2.5 21.5 9 15" /></svg>
                            </div>
                            <h2 className="text-xl font-bold">إدارة الخدمات</h2>
                            <span className="text-xs text-[#FCFAF1]/25">({services.length} خدمة)</span>
                        </div>
                        <button onClick={() => setShowAdd(true)}
                            className="flex items-center gap-2 h-9 px-5 rounded-xl text-xs font-bold transition-all hover:scale-105"
                            style={{ background: `${gold}15`, color: gold, border: `1px solid ${gold}30` }}>
                            <FaPlus size={10} /> إضافة خدمة
                        </button>
                    </div>

                    {/* Add New Service */}
                    <AnimatePresence>
                        {showAdd && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                                className="rounded-2xl p-5 mb-4 overflow-hidden" style={{ background: `${gold}08`, border: `1px solid ${gold}20` }}>
                                <p className="text-sm font-bold mb-4" style={{ color: gold }}>إضافة خدمة جديدة</p>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="اسم الخدمة"
                                        className="flex-1 py-2.5 px-4 rounded-xl bg-[#343434] text-[#FCFAF1] outline-none text-sm"
                                        style={{ border: "1.5px solid rgba(230,179,30,.18)" }} />
                                    <input value={newPrice} onChange={e => setNewPrice(e.target.value)} placeholder="السعر" type="number" step="0.01"
                                        className="w-32 py-2.5 px-4 rounded-xl bg-[#343434] text-[#FCFAF1] outline-none text-sm" dir="ltr"
                                        style={{ border: "1.5px solid rgba(230,179,30,.18)" }} />
                                    <div className="flex gap-2">
                                        <button onClick={addService} disabled={addingService || !newName.trim()}
                                            className="h-10 px-5 rounded-xl text-xs font-bold transition-all hover:scale-105 disabled:opacity-50"
                                            style={{ background: gold, color: "#000" }}>
                                            {addingService ? "جاري الإضافة..." : "إضافة"}
                                        </button>
                                        <button onClick={() => { setShowAdd(false); setNewName(""); setNewPrice(""); }}
                                            className="h-10 px-4 rounded-xl text-xs text-[#FCFAF1]/40 hover:text-[#FCFAF1] hover:bg-white/5 transition-all">
                                            <FaTimes />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Services List */}
                    <div className="space-y-3">
                        {services.map(service => (
                            <ServiceRow
                                key={service.id}
                                service={service}
                                isEditing={editingService === service.id}
                                editName={editName}
                                editPrice={editPrice}
                                onEditName={setEditName}
                                onEditPrice={setEditPrice}
                                onStartEdit={() => startEdit(service)}
                                onCancelEdit={cancelEdit}
                                onSaveEdit={saveServiceEdit}
                                savingEdit={savingService}
                                uploading={uploading === service.id}
                                onImageUpload={(file) => handleImageUpload(service.id, file)}
                                onToggle={() => toggleService(service.id)}
                                onDelete={() => setDeleteId(service.id)}
                                gold={gold}
                                baseUrl={baseUrl}
                            />
                        ))}
                    </div>
                </motion.section>
            </div>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteId && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
                        onClick={() => !deleting && setDeleteId(null)}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="rounded-2xl p-6 max-w-sm w-full text-center" style={{ background: "#2D2D2D", border: "1px solid rgba(230,179,30,.15)" }}
                            onClick={e => e.stopPropagation()}>
                            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#dc262620" }}>
                                <FaTrash className="text-red-500" />
                            </div>
                            <h3 className="text-lg font-bold mb-2">حذف الخدمة</h3>
                            <p className="text-sm text-[#FCFAF1]/40 mb-6">هل أنت متأكد من حذف &quot;{services.find(s => s.id === deleteId)?.name}&quot;؟ لا يمكن التراجع.</p>
                            <div className="flex gap-3 justify-center">
                                <button onClick={() => setDeleteId(null)} disabled={deleting}
                                    className="h-10 px-6 rounded-xl text-sm text-[#FCFAF1]/50 hover:text-[#FCFAF1] hover:bg-white/5 transition-all">إلغاء</button>
                                <button onClick={() => deleteService(deleteId)} disabled={deleting}
                                    className="h-10 px-6 rounded-xl text-sm font-bold bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all disabled:opacity-50">
                                    {deleting ? "جاري الحذف..." : "حذف نهائياً"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ═══════ Input Field Component ═══════ */
function InputField({ label, value, onChange, gold, dir, placeholder }: {
    label: string; value: string; onChange: (v: string) => void; gold: string; dir?: string; placeholder?: string;
}) {
    return (
        <div>
            <label className="text-xs font-bold text-[#FCFAF1]/30 mb-2 block uppercase tracking-wider">{label}</label>
            <input value={value} onChange={e => onChange(e.target.value)} dir={dir} placeholder={placeholder}
                className="w-full py-3 px-4 rounded-xl bg-[#343434] text-[#FCFAF1] outline-none text-sm transition-all"
                style={{ border: "1.5px solid rgba(230,179,30,.12)" }}
                onFocus={e => e.currentTarget.style.borderColor = gold}
                onBlur={e => e.currentTarget.style.borderColor = "rgba(230,179,30,.12)"} />
        </div>
    );
}

/* ═══════ Service Row Component ═══════ */
function ServiceRow({ service, isEditing, editName, editPrice, onEditName, onEditPrice, onStartEdit, onCancelEdit, onSaveEdit, savingEdit, uploading, onImageUpload, onToggle, onDelete, gold, baseUrl }: {
    service: ServiceItem; isEditing: boolean; editName: string; editPrice: string;
    onEditName: (v: string) => void; onEditPrice: (v: string) => void;
    onStartEdit: () => void; onCancelEdit: () => void; onSaveEdit: () => void; savingEdit: boolean;
    uploading: boolean; onImageUpload: (file: File) => void;
    onToggle: () => void; onDelete: () => void;
    gold: string; baseUrl: string;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const imageUrl = service.image_path ? `${baseUrl}/${service.image_path}` : null;

    return (
        <div className={`rounded-2xl p-3 md:p-4 flex flex-row items-center gap-3 md:gap-4 transition-all ${!service.is_active ? "opacity-40" : ""}`}
            style={{ background: "#2D2D2D", border: isEditing ? `1px solid ${gold}40` : "1px solid rgba(230,179,30,.12)" }}>

            {/* Image Thumbnail */}
            <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 cursor-pointer group bg-[#343434]"
                onClick={() => !uploading && inputRef.current?.click()}>
                {imageUrl ? (
                    <img src={imageUrl} alt="" className="w-full h-full object-cover group-hover:opacity-40 transition-opacity" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <FaCamera className="text-[#FCFAF1]/10 group-hover:text-[#FCFAF1]/30 transition-colors" size={14} />
                    </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50">
                    {uploading ? (
                        <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${gold} transparent ${gold} ${gold}` }} />
                    ) : (
                        <FaCamera className="text-[#FCFAF1]" size={12} />
                    )}
                </div>
                <input ref={inputRef} type="file" accept="image/*" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) onImageUpload(f); e.target.value = ""; }} />
            </div>

            {/* Name & Price */}
            <div className="flex-1 min-w-0">
                {isEditing ? (
                    <div className="flex flex-col sm:flex-row gap-2">
                        <input value={editName} onChange={e => onEditName(e.target.value)} autoFocus
                            className="flex-1 py-2 px-3 rounded-lg bg-[#343434] text-[#FCFAF1] outline-none text-sm"
                            style={{ border: `1px solid ${gold}30` }}
                            onKeyDown={e => e.key === "Enter" && onSaveEdit()} />
                        <input value={editPrice} onChange={e => onEditPrice(e.target.value)} type="number" step="0.01" dir="ltr"
                            className="w-24 py-2 px-3 rounded-lg bg-[#343434] text-[#FCFAF1] outline-none text-sm text-center"
                            style={{ border: `1px solid ${gold}30` }}
                            onKeyDown={e => e.key === "Enter" && onSaveEdit()} />
                    </div>
                ) : (
                    <div>
                        <p className="text-sm font-bold truncate">{service.name}</p>
                        <p className="text-xs mt-1" style={{ color: gold }}>{Number(service.price).toFixed(2)} د.أ</p>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
                {isEditing ? (
                    <>
                        <button onClick={onSaveEdit} disabled={savingEdit}
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110 disabled:opacity-50"
                            style={{ background: `${gold}15`, color: gold }}>
                            <FaSave size={12} />
                        </button>
                        <button onClick={onCancelEdit}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#FCFAF1]/30 hover:text-[#FCFAF1] hover:bg-white/5 transition-all">
                            <FaTimes size={12} />
                        </button>
                    </>
                ) : (
                    <>
                        <button onClick={onStartEdit} title="تعديل"
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#FCFAF1]/20 hover:text-[#FCFAF1] hover:bg-white/5 transition-all">
                            <FaPen size={10} />
                        </button>
                        <button onClick={onToggle} title={service.is_active ? "تعطيل" : "تفعيل"}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all text-xs font-bold ${service.is_active ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20" : "bg-white/5 text-[#FCFAF1]/30 hover:bg-white/10"}`}>
                            {service.is_active ? "✓" : "○"}
                        </button>
                        <button onClick={onDelete} title="حذف"
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#FCFAF1]/15 hover:text-red-400 hover:bg-red-500/10 transition-all">
                            <FaTrash size={10} />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

/* ═══════ 12-Hour Time Picker Component ═══════ */
function TimePicker12({ label, value, onChange, gold }: {
    label: string; value: string; onChange: (v: string) => void; gold: string;
}) {
    // Parse 24h value (HH:MM) → 12h parts
    const [h24, m] = (value || "09:00").split(":").map(Number);
    const period = h24 >= 12 ? "م" : "ص";
    const h12 = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24;

    const update = (newH12: number, newM: number, newPeriod: string) => {
        let h = newH12;
        if (newPeriod === "م" && h !== 12) h += 12;
        if (newPeriod === "ص" && h === 12) h = 0;
        onChange(`${String(h).padStart(2, "0")}:${String(newM).padStart(2, "0")}`);
    };

    const selectStyle = { background: "#343434", border: "1.5px solid rgba(230,179,30,.12)" };

    return (
        <div>
            <label className="text-xs font-bold text-[#FCFAF1]/30 mb-2 block uppercase tracking-wider">{label}</label>
            <div className="flex gap-2" dir="ltr">
                <select value={h12} onChange={e => update(Number(e.target.value), m, period)}
                    className="flex-1 py-3 px-2 rounded-xl text-[#FCFAF1] outline-none text-sm text-center transition-all cursor-pointer appearance-none"
                    style={selectStyle}>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                        <option key={h} value={h}>{h}</option>
                    ))}
                </select>
                <span className="flex items-center text-[#FCFAF1]/20 text-lg font-bold">:</span>
                <select value={m} onChange={e => update(h12, Number(e.target.value), period)}
                    className="flex-1 py-3 px-2 rounded-xl text-[#FCFAF1] outline-none text-sm text-center transition-all cursor-pointer appearance-none"
                    style={selectStyle}>
                    {[0, 15, 30, 45].map(min => (
                        <option key={min} value={min}>{String(min).padStart(2, "0")}</option>
                    ))}
                </select>
                <select value={period} onChange={e => update(h12, m, e.target.value)}
                    className="w-16 py-3 px-1 rounded-xl text-[#FCFAF1] outline-none text-sm text-center transition-all cursor-pointer appearance-none font-bold"
                    style={{ ...selectStyle, color: gold }}>
                    <option value="ص">ص</option>
                    <option value="م">م</option>
                </select>
            </div>
        </div>
    );
}
