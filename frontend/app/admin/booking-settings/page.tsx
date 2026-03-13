"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { servicesAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { FaCamera, FaCheck, FaArrowRight, FaExternalLinkAlt, FaPlus, FaTrash, FaPen, FaTimes, FaSave } from "react-icons/fa";
import axios from "axios";
import Cookies from "js-cookie";

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
}

export default function BookingSettingsPage() {
    const { user } = useAuthStore();
    const router = useRouter();
    const [services, setServices] = useState<ServiceItem[]>([]);
    const [settings, setSettings] = useState<SalonSettings | null>(null);
    const [uploading, setUploading] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [heroUploading, setHeroUploading] = useState(false);
    const heroInputRef = useRef<HTMLInputElement>(null);

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

    const loadData = async () => {
        try {
            const [servRes, settRes] = await Promise.all([
                servicesAPI.getAll(),
                axios.get(`${API_BASE}/salon/settings.php`, {
                    headers: { Authorization: `Bearer ${Cookies.get("token")}` },
                }),
            ]);
            setServices(servRes.data.data || []);
            setSettings(settRes.data.data || null);
        } catch (e) { console.error(e); }
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

    const gold = "#c8a96e";
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

    if (!settings) return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
            <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${gold} transparent ${gold} ${gold}` }} />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white" dir="rtl" style={{ fontFamily: "'Tajawal', sans-serif" }}>
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800&display=swap');
            `}</style>

            {/* Header */}
            <header className="sticky top-0 z-40 backdrop-blur-xl" style={{ background: "rgba(10,10,10,.9)", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
                <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3 md:gap-4">
                        <button onClick={() => router.push("/admin/dashboard")} className="text-white/40 hover:text-white transition-colors">
                            <FaArrowRight />
                        </button>
                        <h1 className="text-base md:text-lg font-bold">تخصيص الحجز</h1>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                        <a href={`/book/?s=${settings.slug}`} target="_blank" rel="noopener noreferrer"
                            className="hidden sm:flex items-center gap-2 text-xs text-white/40 hover:text-white transition-colors">
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

                {/* ══════ Section: Salon Info ══════ */}
                <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${gold}15`, color: gold }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                        </div>
                        <h2 className="text-xl font-bold">معلومات الصالون</h2>
                    </div>
                    <div className="rounded-2xl p-6 space-y-5" style={{ background: "#111", border: "1px solid rgba(255,255,255,.06)" }}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <InputField label="اسم الصالون" value={settings.name} onChange={v => setSettings({ ...settings, name: v })} gold={gold} />
                            <InputField label="رقم الهاتف" value={settings.owner_phone} onChange={v => setSettings({ ...settings, owner_phone: v })} gold={gold} dir="ltr" />
                            <InputField label="العنوان" value={settings.address} onChange={v => setSettings({ ...settings, address: v })} gold={gold} />
                            <InputField label="انستقرام" value={settings.instagram} onChange={v => setSettings({ ...settings, instagram: v })} gold={gold} dir="ltr" placeholder="@username" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-white/30 mb-2 block uppercase tracking-wider">وصف الصالون</label>
                            <textarea value={settings.description} onChange={e => setSettings({ ...settings, description: e.target.value })} rows={4}
                                className="w-full py-3 px-4 rounded-xl bg-[#0a0a0a] text-white outline-none resize-none text-sm transition-all"
                                style={{ border: "1.5px solid rgba(255,255,255,.06)" }}
                                onFocus={e => e.currentTarget.style.borderColor = gold}
                                onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,.06)"} />
                        </div>
                        <InputField label="رسالة بعد الحجز" value={settings.booking_message} onChange={v => setSettings({ ...settings, booking_message: v })} gold={gold} placeholder="مثال: شكراً لحجزك!" />
                    </div>
                </motion.section>

                {/* ══════ Section: Hero Image ══════ */}
                <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${gold}15`, color: gold }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                        </div>
                        <h2 className="text-xl font-bold">صورة الخلفية الرئيسية</h2>
                    </div>
                    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,.06)" }}>
                        <div className="relative h-48 md:h-64 bg-[#111] flex items-center justify-center cursor-pointer group"
                            onClick={() => heroInputRef.current?.click()}>
                            {settings.hero_image ? (
                                <img src={settings.hero_image} alt="Hero" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
                            ) : (
                                <div className="text-white/15 text-center">
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
                <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${gold}15`, color: gold }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15.5 2-8.46 8.46a2 2 0 0 0 0 2.83l3.67 3.67a2 2 0 0 0 2.83 0L22 8.5" /><path d="M2.5 21.5 9 15" /></svg>
                            </div>
                            <h2 className="text-xl font-bold">إدارة الخدمات</h2>
                            <span className="text-xs text-white/25">({services.length} خدمة)</span>
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
                                        className="flex-1 py-2.5 px-4 rounded-xl bg-[#0a0a0a] text-white outline-none text-sm"
                                        style={{ border: "1.5px solid rgba(255,255,255,.1)" }} />
                                    <input value={newPrice} onChange={e => setNewPrice(e.target.value)} placeholder="السعر" type="number" step="0.01"
                                        className="w-32 py-2.5 px-4 rounded-xl bg-[#0a0a0a] text-white outline-none text-sm" dir="ltr"
                                        style={{ border: "1.5px solid rgba(255,255,255,.1)" }} />
                                    <div className="flex gap-2">
                                        <button onClick={addService} disabled={addingService || !newName.trim()}
                                            className="h-10 px-5 rounded-xl text-xs font-bold transition-all hover:scale-105 disabled:opacity-50"
                                            style={{ background: gold, color: "#000" }}>
                                            {addingService ? "جاري الإضافة..." : "إضافة"}
                                        </button>
                                        <button onClick={() => { setShowAdd(false); setNewName(""); setNewPrice(""); }}
                                            className="h-10 px-4 rounded-xl text-xs text-white/40 hover:text-white hover:bg-white/5 transition-all">
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
                            className="rounded-2xl p-6 max-w-sm w-full text-center" style={{ background: "#151515", border: "1px solid rgba(255,255,255,.08)" }}
                            onClick={e => e.stopPropagation()}>
                            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#dc262620" }}>
                                <FaTrash className="text-red-500" />
                            </div>
                            <h3 className="text-lg font-bold mb-2">حذف الخدمة</h3>
                            <p className="text-sm text-white/40 mb-6">هل أنت متأكد من حذف &quot;{services.find(s => s.id === deleteId)?.name}&quot;؟ لا يمكن التراجع.</p>
                            <div className="flex gap-3 justify-center">
                                <button onClick={() => setDeleteId(null)} disabled={deleting}
                                    className="h-10 px-6 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/5 transition-all">إلغاء</button>
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
            <label className="text-xs font-bold text-white/30 mb-2 block uppercase tracking-wider">{label}</label>
            <input value={value} onChange={e => onChange(e.target.value)} dir={dir} placeholder={placeholder}
                className="w-full py-3 px-4 rounded-xl bg-[#0a0a0a] text-white outline-none text-sm transition-all"
                style={{ border: "1.5px solid rgba(255,255,255,.06)" }}
                onFocus={e => e.currentTarget.style.borderColor = gold}
                onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,.06)"} />
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
            style={{ background: "#111", border: isEditing ? `1px solid ${gold}40` : "1px solid rgba(255,255,255,.06)" }}>

            {/* Image Thumbnail */}
            <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 cursor-pointer group bg-[#0a0a0a]"
                onClick={() => !uploading && inputRef.current?.click()}>
                {imageUrl ? (
                    <img src={imageUrl} alt="" className="w-full h-full object-cover group-hover:opacity-40 transition-opacity" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <FaCamera className="text-white/10 group-hover:text-white/30 transition-colors" size={14} />
                    </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50">
                    {uploading ? (
                        <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${gold} transparent ${gold} ${gold}` }} />
                    ) : (
                        <FaCamera className="text-white" size={12} />
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
                            className="flex-1 py-2 px-3 rounded-lg bg-[#0a0a0a] text-white outline-none text-sm"
                            style={{ border: `1px solid ${gold}30` }}
                            onKeyDown={e => e.key === "Enter" && onSaveEdit()} />
                        <input value={editPrice} onChange={e => onEditPrice(e.target.value)} type="number" step="0.01" dir="ltr"
                            className="w-24 py-2 px-3 rounded-lg bg-[#0a0a0a] text-white outline-none text-sm text-center"
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
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/5 transition-all">
                            <FaTimes size={12} />
                        </button>
                    </>
                ) : (
                    <>
                        <button onClick={onStartEdit} title="تعديل"
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/20 hover:text-white hover:bg-white/5 transition-all">
                            <FaPen size={10} />
                        </button>
                        <button onClick={onToggle} title={service.is_active ? "تعطيل" : "تفعيل"}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all text-xs font-bold ${service.is_active ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20" : "bg-white/5 text-white/30 hover:bg-white/10"}`}>
                            {service.is_active ? "✓" : "○"}
                        </button>
                        <button onClick={onDelete} title="حذف"
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/15 hover:text-red-400 hover:bg-red-500/10 transition-all">
                            <FaTrash size={10} />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
