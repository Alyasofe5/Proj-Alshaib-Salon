"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import {
    FaBuilding, FaChartLine, FaExclamationTriangle, FaCogs,
    FaSignOutAlt, FaPause, FaCheck, FaBan, FaPlus, FaCrown,
    FaEnvelope, FaPhone, FaMapMarkerAlt, FaUsers, FaTimes,
    FaMoneyBillWave, FaTrash, FaInfoCircle, FaChevronDown,
    FaInstagram, FaFacebook, FaTiktok, FaWhatsapp, FaEye, FaEyeSlash
} from "react-icons/fa";
import api from "@/lib/api";
import { useBrandUI } from "@/components/ui/BrandUI";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Salon {
    id: number; name: string; slug: string;
    owner_name: string; owner_email: string; owner_phone: string;
    status: "active" | "suspended" | "expired";
    plan_name: string; plan_type?: string; emp_count: number; month_tx: number;
    month_revenue: number; subscription_expires_at: string;
    subscription_starts_at: string; created_at: string;
    settings?: string | Record<string, string>;
    subscription_plan_id?: number;
}
interface FeaturesConfig {
    has_booking_page?: boolean;
    has_advanced_reports?: boolean;
    has_whatsapp?: boolean;
    has_multi_branch?: boolean;
    has_custom_api?: boolean;
    has_priority_support?: boolean;
    has_full_customize?: boolean;
    max_bookings_month?: number;
}
interface Plan {
    id: number; name: string; name_ar: string;
    price: number; duration_days: number;
    max_employees: number; max_services: number;
    plan_type?: string; features_config?: FeaturesConfig;
    features: string[]; is_popular: boolean; is_active: boolean;
    salons_count?: number;
}
interface ContactRequest {
    id: number; salon_name: string; owner_name: string; phone: string;
    city: string; employees: number; message: string;
    status: "new" | "contacted" | "done"; notes: string; created_at: string;
}
interface Revenue {
    id: number; salon_id: number | null; salon_name: string;
    amount: number; description: string; payment_date: string; created_at: string;
}
interface Stats {
    salons: { total: number; active: number; suspended: number; expired: number; expiring_soon: number };
    users: { total: number; employees: number };
    revenue: { this_month: number; chart: { month: string; revenue: number }[] };
    recent_salons: Salon[];
}

function getDaysLeft(expiresAt: string): number | null {
    if (!expiresAt) return null;
    return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000));
}

// ─── Salon Details Popup ──────────────────────────────────────────────────────
function SalonDetailsPopup({ salon, plans, onClose, onStatusChange, onUpdatePlan, onSaveSalonInfo }: {
    salon: Salon; plans: Plan[]; onClose: () => void;
    onStatusChange: (id: number, status: string, days?: number) => void;
    onUpdatePlan: (salonId: number, planId: number, days: number) => void;
    onSaveSalonInfo: (id: number, data: any) => Promise<void>;
}) {
    const dLeft = getDaysLeft(salon.subscription_expires_at);
    const [customDays, setCustomDays] = useState("");
    const [savingInfo, setSavingInfo] = useState(false);
    const [salonSettings, setSalonSettings] = useState(() => {
        try {
            const s = typeof salon.settings === 'string' ? JSON.parse(salon.settings) : (salon.settings || {});
            return {
                email: s.email || "",
                phone: s.phone || "",
                whatsapp: s.whatsapp || "",
                instagram: s.instagram || "",
                facebook: s.facebook || "",
                tiktok: s.tiktok || ""
            };
        } catch { return { email: "", phone: "", whatsapp: "", instagram: "", facebook: "", tiktok: "" }; }
    });

    const handleSave = async () => {
        setSavingInfo(true);
        await onSaveSalonInfo(salon.id, {
            name: salon.name,
            owner_name: salon.owner_name || '',
            owner_email: salon.owner_email || '',
            owner_phone: salon.owner_phone || '',
            subscription_plan_id: salon.subscription_plan_id ?? 1,
            settings: JSON.stringify(salonSettings),
        });
        setSavingInfo(false);
    };
    const [selectedPlanId, setSelectedPlanId] = useState(0);
    const planTypeLabels: Record<string, { label: string; color: string }> = {
        free: { label: "مجاني", color: "bg-gray-500/15 text-gray-400 border-gray-500/30" },
        basic: { label: "أساسي", color: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
        professional: { label: "احترافي", color: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
        enterprise: { label: "مؤسسات", color: "bg-accent-lime/15 text-accent-lime border-accent-lime/30" },
    };
    const pt = planTypeLabels[salon.plan_type || "basic"] || planTypeLabels.basic;

    return (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-card-dark border border-[var(--border-subtle)] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-5 border-b border-[var(--border-subtle)] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-[var(--color-surface)] border border-[var(--border-subtle)] flex items-center justify-center text-accent-lime font-bold text-xl">
                            {salon.name?.charAt(0) || '?'}
                        </div>
                        <div>
                            <h3 className="font-bold text-[var(--color-text-primary)] text-lg">{salon.name || 'بدون اسم'}</h3>
                            <div className="flex items-center gap-2">
                                <p className="text-xs text-[var(--color-text-muted)] dir-ltr">/{salon.slug}</p>
                                <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${pt.color}`}>{pt.label}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors p-1"><FaTimes /></button>
                </div>

                {/* Body */}
                <div className="p-5 space-y-4">
                    {/* Status */}
                    <div className="flex items-center gap-3 p-3 bg-card-dark rounded-xl border border-[var(--color-surface)]">
                        <span className="text-xs text-[var(--color-text-muted)]">الحالة:</span>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${salon.status === "active" ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/20" : salon.status === "suspended" ? "bg-white/5 text-gray-400 border border-white/10" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
                            {salon.status === "active" ? <><FaCheck size={9} /> نشط</> : salon.status === "suspended" ? <><FaPause size={9} /> موقف</> : <><FaBan size={9} /> منتهي</>}
                        </span>
                        {dLeft !== null && salon.status === "active" && (
                            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${dLeft <= 7 ? "bg-red-500/15 text-red-400 border border-red-500/20" : "bg-white/5 text-gray-400 border border-white/10"}`}>
                                {dLeft === 0 ? "ينتهي اليوم!" : `${dLeft} يوم متبقي`}
                            </span>
                        )}
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                            { label: "اسم المالك", value: salon.owner_name || "—" },
                            { label: "رقم الهاتف", value: salon.owner_phone || "—", ltr: true },
                            { label: "البريد الإلكتروني", value: salon.owner_email || "—", ltr: true },
                            { label: "الباقة", value: salon.plan_name || "—" },
                            { label: "عدد الموظفين", value: salon.emp_count?.toString() || "0" },
                            { label: "عمليات الشهر", value: salon.month_tx?.toString() || "0" },
                            { label: "إيرادات الشهر", value: `${Number(salon.month_revenue || 0).toFixed(3)} د.أ`, gold: true },
                            { label: "تاريخ الإنشاء", value: salon.created_at ? new Date(salon.created_at).toLocaleDateString("ar-JO") : "—" },
                        ].map((item, i) => (
                            <div key={i} className="bg-card-dark rounded-xl p-3 border border-[var(--color-surface)]">
                                <p className="text-[10px] text-gray-600 mb-0.5">{item.label}</p>
                                <p className={`text-sm font-medium ${item.gold ? "text-accent-lime" : "text-[var(--color-text-primary)]"} ${item.ltr ? "dir-ltr text-left" : ""}`}>{item.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Contact & Social Links */}
                    <div className="space-y-4 pt-4 border-t border-[var(--border-subtle)]">
                        <p className="text-sm font-bold text-accent-lime flex items-center gap-2">
                            <FaEnvelope /> معلومات التواصل والروابط
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-3">
                                <div>
                                    <label className="text-[10px] text-[var(--color-text-muted)] block mb-1">البريد الإلكتروني</label>
                                    <input value={salonSettings.email} onChange={e => setSalonSettings({...salonSettings, email: e.target.value})} 
                                        className="w-full bg-card-dark border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-xs focus:border-accent-lime outline-none" placeholder="salon@email.com" />
                                </div>
                                <div>
                                    <label className="text-[10px] text-[var(--color-text-muted)] block mb-1">رقم الهاتف</label>
                                    <input value={salonSettings.phone} onChange={e => setSalonSettings({...salonSettings, phone: e.target.value})} 
                                        className="w-full bg-card-dark border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-xs focus:border-accent-lime outline-none" placeholder="+962..." dir="ltr" />
                                </div>
                                <div>
                                    <label className="text-[10px] text-[var(--color-text-muted)] block mb-1">واتساب (أرقام فقط)</label>
                                    <input value={salonSettings.whatsapp} onChange={e => setSalonSettings({...salonSettings, whatsapp: e.target.value})} 
                                        className="w-full bg-card-dark border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-xs focus:border-accent-lime outline-none" placeholder="962..." dir="ltr" />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-[10px] text-[var(--color-text-muted)] block mb-1">إنستجرام (رابط كامل)</label>
                                    <input value={salonSettings.instagram} onChange={e => setSalonSettings({...salonSettings, instagram: e.target.value})} 
                                        className="w-full bg-card-dark border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-xs focus:border-accent-lime outline-none" placeholder="https://..." dir="ltr" />
                                </div>
                                <div>
                                    <label className="text-[10px] text-[var(--color-text-muted)] block mb-1">فيسبوك (رابط كامل)</label>
                                    <input value={salonSettings.facebook} onChange={e => setSalonSettings({...salonSettings, facebook: e.target.value})} 
                                        className="w-full bg-card-dark border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-xs focus:border-accent-lime outline-none" placeholder="https://..." dir="ltr" />
                                </div>
                                <div>
                                    <label className="text-[10px] text-[var(--color-text-muted)] block mb-1">تيك توك (رابط كامل)</label>
                                    <input value={salonSettings.tiktok} onChange={e => setSalonSettings({...salonSettings, tiktok: e.target.value})} 
                                        className="w-full bg-card-dark border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-xs focus:border-accent-lime outline-none" placeholder="https://..." dir="ltr" />
                                </div>
                            </div>
                        </div>
                        <button onClick={handleSave} disabled={savingInfo}
                            className="w-full py-2 rounded-xl text-xs font-bold bg-white/5 text-accent-lime border border-accent-lime/20 hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                            {savingInfo ? "جاري الحفظ..." : <><FaCheck size={10} /> حفظ معلومات التواصل</>}
                        </button>
                    </div>

                    {/* Subscription Dates */}
                    {(salon.subscription_starts_at || salon.subscription_expires_at) && (
                        <div className="bg-card-dark rounded-xl p-3 border border-[var(--color-surface)] space-y-2">
                            <p className="text-xs text-[var(--color-text-muted)] font-bold mb-2">تفاصيل الاشتراك</p>
                            {salon.subscription_starts_at && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-[var(--color-text-muted)]">تاريخ البداية</span>
                                    <span className="text-[var(--color-text-primary)]">{new Date(salon.subscription_starts_at).toLocaleDateString("ar-JO")}</span>
                                </div>
                            )}
                            {salon.subscription_expires_at && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-[var(--color-text-muted)]">تاريخ الانتهاء</span>
                                    <span className={dLeft !== null && dLeft <= 7 ? "text-accent-lime font-bold" : "text-[var(--color-text-primary)]"}>
                                        {new Date(salon.subscription_expires_at).toLocaleDateString("ar-JO")}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── تغيير الباقة ── */}
                    <div className="bg-card-dark rounded-xl p-4 border border-accent-lime/20 space-y-3">
                        <p className="text-sm text-accent-lime font-bold flex items-center gap-2">
                            <FaCogs size={12} /> تغيير الباقة والاشتراك
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] text-[var(--color-text-muted)] mb-1 block">الباقة الجديدة</label>
                                <select value={selectedPlanId}
                                    onChange={e => setSelectedPlanId(Number(e.target.value))}
                                    className="w-full bg-card-dark border border-[var(--border-subtle)] rounded-lg px-2 py-2 text-xs focus:border-accent-lime outline-none">
                                    <option value={0}>بدون تغيير</option>
                                    {plans.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.name_ar} — {p.price > 0 ? `${p.price} د.أ` : "مجاني"}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] text-[var(--color-text-muted)] mb-1 block">مدة مخصصة (أيام)</label>
                                <input type="number" min="1" max="3650" placeholder="مثال: 7"
                                    value={customDays}
                                    onChange={e => setCustomDays(e.target.value)}
                                    className="w-full bg-card-dark border border-[var(--border-subtle)] rounded-lg px-2 py-2 text-xs focus:border-accent-lime outline-none" dir="ltr" />
                            </div>
                        </div>
                        {(selectedPlanId > 0 || customDays) && (
                            <button
                                onClick={() => {
                                    const days = customDays ? parseInt(customDays) : 30;
                                    if (selectedPlanId > 0) {
                                        onUpdatePlan(salon.id, selectedPlanId, days);
                                    } else if (customDays) {
                                        onStatusChange(salon.id, "active", days);
                                    }
                                }}
                                className="w-full py-2.5 rounded-xl text-sm font-bold bg-accent-lime text-black hover:bg-[#C3D809] transition-all">
                                {selectedPlanId > 0 ? `تغيير الباقة وتجديد ${customDays || 30} يوم` : `تجديد ${customDays} يوم`}
                            </button>
                        )}
                    </div>

                    {/* Quick Actions */}
                    <div className="space-y-2">
                        <p className="text-xs text-[var(--color-text-muted)] font-bold">إجراءات سريعة</p>
                        <div className="flex flex-wrap gap-2">
                            <button onClick={() => onStatusChange(salon.id, "active", 1)}
                                className="px-3 py-2 rounded-lg text-xs font-bold bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 transition-all border border-white/5">+ يوم</button>
                            <button onClick={() => onStatusChange(salon.id, "active", 3)}
                                className="px-3 py-2 rounded-lg text-xs font-bold bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 transition-all border border-white/5">+ 3 أيام</button>
                            <button onClick={() => onStatusChange(salon.id, "active", 7)}
                                className="px-3 py-2 rounded-lg text-xs font-bold bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 transition-all border border-white/5">+ أسبوع</button>
                            <button onClick={() => onStatusChange(salon.id, "active", 30)}
                                className="px-3 py-2 rounded-lg text-xs font-bold bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 transition-all border border-white/5">+ شهر</button>
                            <button onClick={() => onStatusChange(salon.id, "active", 180)}
                                className="px-3 py-2 rounded-lg text-xs font-bold bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 transition-all border border-white/5">+ 6 أشهر</button>
                            <button onClick={() => onStatusChange(salon.id, "active", 365)}
                                className="px-3 py-2 rounded-lg text-xs font-bold bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 transition-all border border-white/5">+ سنة</button>
                        </div>
                    </div>

                    {/* Suspend / Activate */}
                    <div className="flex gap-2 pt-1">
                        {salon.status === "active" ? (
                            <button onClick={() => onStatusChange(salon.id, "suspended")}
                                className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-white/10 text-white hover:bg-white/20 transition-all border border-white/10">
                                إيقاف الصالون
                            </button>
                        ) : (
                            <button onClick={() => onStatusChange(salon.id, "active", 30)}
                                className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-[var(--color-accent)]/15 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/25 transition-all border border-[var(--color-accent)]/20">
                                تفعيل (شهر)
                            </button>
                        )}
                        {salon.owner_phone && (
                            <a href={`https://wa.me/${salon.owner_phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                                className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-green-500/15 text-green-400 hover:bg-green-500/25 transition-all text-center border border-green-500/20">
                                واتساب
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function SuperAdminDashboard() {
    const router = useRouter();
    const { user, logout, _hydrated, hydrate } = useAuthStore();
    const { toast, confirm } = useBrandUI();
    const [stats, setStats] = useState<Stats | null>(null);
    const [salons, setSalons] = useState<Salon[]>([]);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [contacts, setContacts] = useState<ContactRequest[]>([]);
    const [contactsNewCount, setContactsNewCount] = useState(0);
    const [revenues, setRevenues] = useState<Revenue[]>([]);
    const [revenueMonthTotal, setRevenueMonthTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"dashboard" | "salons" | "contacts" | "revenues" | "plans" | "settings">("dashboard");
    const [platformSettings, setPlatformSettings] = useState({
        email: "", phone: "", whatsapp: "", address: "",
        instagram: "", facebook: "", tiktok: "",
        show_email: true, show_phone: true, show_whatsapp: true, show_address: true,
        show_instagram: true, show_facebook: true, show_tiktok: true,
    });
    const [settingsSaving, setSettingsSaving] = useState(false);
    const [tabDropdownOpen, setTabDropdownOpen] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedSalon, setSelectedSalon] = useState<Salon | null>(null);
    const [deleteModal, setDeleteModal] = useState<{ salon: Salon } | null>(null);
    const [deleteConfirmText, setDeleteConfirmText] = useState("");
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [newSalon, setNewSalon] = useState({
        name: "", slug: "", owner_name: "", owner_phone: "", owner_email: "",
        subscription_plan_id: 1, duration_days: 30, admin_username: "", admin_password: "",
    });
    const [actionLoading, setActionLoading] = useState(false);

    // Plans
    const [plansData, setPlansData] = useState<Plan[]>([]);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
    const [planModal, setPlanModal] = useState<"create" | "edit" | null>(null);
    const [planForm, setPlanForm] = useState<{
        name: string; name_ar: string; price: string;
        duration_days: string; max_employees: string; max_services: string;
        features: string[]; is_popular: boolean; is_active: boolean;
    }>({
        name: '', name_ar: '', price: '0',
        duration_days: '30', max_employees: '999', max_services: '999',
        features: [], is_popular: false, is_active: true,
    });
    const [newFeature, setNewFeature] = useState('');
    const [planSaving, setPlanSaving] = useState(false);

    // Revenue form
    const [revForm, setRevForm] = useState({
        salon_id: "", salon_name: "", amount: "", description: "", payment_date: new Date().toISOString().split("T")[0],
    });
    const [revLoading, setRevLoading] = useState(false);

    // Hydrate auth store from cookies/localStorage on mount
    useEffect(() => {
        if (!_hydrated) hydrate();
    }, [_hydrated, hydrate]);

    useEffect(() => {
        if (!_hydrated) return; // Wait for hydration before checking auth
        if (user?.role !== "super_admin") { router.replace("/login"); return; }
        loadData();
    }, [_hydrated, user]);

    const loadData = async () => {
        try {
            const [statsRes, salonsRes, contactsRes, revenuesRes, plansRes, settingsRes] = await Promise.all([
                api.get("/superadmin/stats.php"),
                api.get("/superadmin/salons.php"),
                api.get("/superadmin/contacts.php"),
                api.get("/superadmin/revenues.php"),
                api.get("/superadmin/plans.php"),
                api.get("/superadmin/settings.php"),
            ]);
            setStats(statsRes.data.data);
            setSalons(salonsRes.data.data.salons || []);
            setPlans(salonsRes.data.data.plans || []);
            setContacts(contactsRes.data.data.requests || []);
            setContactsNewCount(contactsRes.data.data.new_count || 0);
            setRevenues(revenuesRes.data.data.revenues || []);
            setRevenueMonthTotal(revenuesRes.data.data.month_total || 0);
            setPlansData(plansRes.data.data || []);
            if (settingsRes.data.success) {
                const settings = settingsRes.data.data;
                if (settings) {
                    setPlatformSettings(prev => ({
                        ...prev,
                        ...settings,
                        show_email: settings.show_email === undefined ? true : Boolean(Number(settings.show_email)),
                        show_phone: settings.show_phone === undefined ? true : Boolean(Number(settings.show_phone)),
                        show_whatsapp: settings.show_whatsapp === undefined ? true : Boolean(Number(settings.show_whatsapp)),
                        show_address: settings.show_address === undefined ? true : Boolean(Number(settings.show_address)),
                        show_instagram: settings.show_instagram === undefined ? true : Boolean(Number(settings.show_instagram)),
                        show_facebook: settings.show_facebook === undefined ? true : Boolean(Number(settings.show_facebook)),
                        show_tiktok: settings.show_tiktok === undefined ? true : Boolean(Number(settings.show_tiktok)),
                    }));
                }
            }
        } catch { console.error("Failed to load data"); }
        finally { setLoading(false); }
    };

    const handleSaveSettings = async () => {
        setSettingsSaving(true);
        try {
            await api.put("/superadmin/settings.php", platformSettings);
            toast('تم حفظ إعدادات المنصة بنجاح', 'success');
        } catch { toast('فشل حفظ الإعدادات', 'error'); }
        finally { setSettingsSaving(false); }
    };

    const handleSaveSalonInfo = async (salonId: number, data: any) => {
        try {
            await api.put(`/superadmin/salons.php?id=${salonId}`, data);
            toast('تم تحديث بيانات الصالون بنجاح', 'success');
            loadData();
        } catch { toast('فشل تحديث بيانات الصالون', 'error'); }
    };

    const handleContactStatus = useCallback(async (id: number, status: string, notes?: string) => {
        try {
            await api.patch(`/superadmin/contacts.php?id=${id}`, { status, notes });
            setContacts(prev => prev.map(c => c.id === id ? { ...c, status: status as ContactRequest["status"], notes: notes ?? c.notes } : c));
            if (status !== "new") setContactsNewCount(prev => Math.max(0, prev - 1));
            toast('تم تحديث حالة الطلب', 'success');
        } catch { toast('حدث خطأ غير متوقع', 'error'); }
    }, [toast]);

    const handleCreateSalon = async () => {
        if (!newSalon.name || !newSalon.slug) return;
        setActionLoading(true);
        try {
            await api.post("/superadmin/salons.php", newSalon);
            setShowCreateModal(false);
            setNewSalon({ name: "", slug: "", owner_name: "", owner_phone: "", owner_email: "", subscription_plan_id: 1, duration_days: 30, admin_username: "", admin_password: "" });
            loadData();
            toast('✅ تم إنشاء الصالون بنجاح!', 'success');
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            toast(e.response?.data?.message || 'حدث خطأ غير متوقع', 'error');
        } finally { setActionLoading(false); }
    };

    const handleStatusChange = async (salonId: number, status: string, days?: number) => {
        if (status === "suspended") {
            const ok = await confirm({
                title: 'إيقاف الصالون',
                message: 'هل تريد إيقاف هذا الصالون؟ سيتم تعطيل وصولهم فوراً.',
                confirmLabel: 'إيقاف',
                variant: 'warning',
            });
            if (!ok) return;
        }
        try {
            await api.patch(`/superadmin/salons.php?id=${salonId}`, { status, duration_days: status === "active" ? (days ?? 30) : undefined });
            setSelectedSalon(null);
            await loadData();
            if (status === "active") {
                toast(`✅ تم التجديد بنجاح — ${days} يوم`, 'success');
            } else {
                toast('تم إيقاف الصالون', 'warning');
            }
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            toast(e.response?.data?.message || 'حدث خطأ', 'error');
        }
    };

    const handleUpdatePlan = async (salonId: number, planId: number, days: number) => {
        try {
            await api.patch(`/superadmin/salons.php?id=${salonId}`, {
                status: 'active',
                subscription_plan_id: planId,
                duration_days: days,
            });
            setSelectedSalon(null);
            await loadData();
            const plan = plans.find(p => p.id === planId);
            toast(`✅ تم تحديث الباقة إلى ${plan?.name_ar || 'جديد'} — ${days} يوم`, 'success');
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            toast(e.response?.data?.message || 'حدث خطأ', 'error');
        }
    };

    const handleDeleteSalon = async () => {
        if (!deleteModal) return;
        setDeleteLoading(true);
        try {
            await api.delete(`/superadmin/salons.php?id=${deleteModal.salon.id}`, {
                data: { confirm_name: deleteConfirmText.trim() },
            });
            setDeleteModal(null);
            setDeleteConfirmText("");
            await loadData();
            toast(`🗑️ تم حذف صالون "${deleteModal.salon.name}" نهائياً`, 'success');
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            toast(e.response?.data?.message || 'فشل الحذف، تحقق من الاسم', 'error');
        } finally { setDeleteLoading(false); }
    };

    const handleAddRevenue = async () => {
        if (!revForm.amount || Number(revForm.amount) <= 0) return toast('يرجى إدخال مبلغ صحيح', 'warning');
        const salonName = revForm.salon_id
            ? salons.find(s => s.id === Number(revForm.salon_id))?.name || revForm.salon_name
            : revForm.salon_name;
        if (!salonName) return toast('يرجى تحديد اسم الصالون', 'warning');
        setRevLoading(true);
        try {
            await api.post("/superadmin/revenues.php", {
                salon_id: revForm.salon_id ? Number(revForm.salon_id) : null,
                salon_name: salonName,
                amount: Number(revForm.amount),
                description: revForm.description,
                payment_date: revForm.payment_date,
            });
            setRevForm({ salon_id: "", salon_name: "", amount: "", description: "", payment_date: new Date().toISOString().split("T")[0] });
            const res = await api.get("/superadmin/revenues.php");
            setRevenues(res.data.data.revenues || []);
            setRevenueMonthTotal(res.data.data.month_total || 0);
            toast('تم تسجيل الإيراد بنجاح', 'success');
        } catch { toast('حدث خطأ غير متوقع', 'error'); }
        finally { setRevLoading(false); }
    };

    const handleDeleteRevenue = async (id: number) => {
        const ok = await confirm({
            title: 'حذف الإيراد',
            message: 'هل تريد حذف هذا الإيراد؟ لا يمكن التراجع.',
            confirmLabel: 'حذف',
            variant: 'danger',
        });
        if (!ok) return;
        try {
            await api.delete(`/superadmin/revenues.php?id=${id}`);
            setRevenues(prev => prev.filter(r => r.id !== id));
            const thisMonth = new Date().toISOString().slice(0, 7);
            const deleted = revenues.find(r => r.id === id);
            if (deleted && deleted.payment_date.startsWith(thisMonth)) {
                setRevenueMonthTotal(prev => Math.max(0, prev - Number(deleted.amount)));
            }
            toast('تم حذف الإيراد', 'success');
        } catch { toast('حدث خطأ', 'error'); }
    };

    // ── Plans handlers ──────────────────────────────────────
    const openCreatePlan = () => {
        setPlanForm({ name: '', name_ar: '', price: '0', duration_days: '30', max_employees: '999', max_services: '999', features: [], is_popular: false, is_active: true });
        setNewFeature('');
        setPlanModal('create');
    };

    const openEditPlan = (p: Plan) => {
        setEditingPlan(p);
        setPlanForm({
            name: p.name, name_ar: p.name_ar, price: String(p.price),
            duration_days: String(p.duration_days),
            max_employees: String(p.max_employees), max_services: String(p.max_services),
            features: [...(p.features || [])],
            is_popular: p.is_popular, is_active: p.is_active,
        });
        setNewFeature('');
        setPlanModal('edit');
    };

    const handleSavePlan = async () => {
        if (!planForm.name || !planForm.name_ar) return toast('الاسمان مطلوبان', 'warning');
        setPlanSaving(true);
        try {
            const payload = {
                ...planForm,
                price: parseFloat(planForm.price),
                duration_days: parseInt(planForm.duration_days),
                max_employees: parseInt(planForm.max_employees),
                max_services: parseInt(planForm.max_services),
            };
            if (planModal === 'edit' && editingPlan) {
                await api.put(`/superadmin/plans.php?id=${editingPlan.id}`, payload);
            } else {
                await api.post('/superadmin/plans.php', payload);
            }
            setPlanModal(null);
            const res = await api.get('/superadmin/plans.php');
            setPlansData(res.data.data || []);
            toast('تم الحفظ — التغييرات تنعكس فوراً على الصفحة الرئيسية', 'success');
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            toast(e.response?.data?.message || 'حدث خطأ', 'error');
        } finally { setPlanSaving(false); }
    };

    const handleDeletePlan = async (id: number, salonsCount: number) => {
        if (salonsCount > 0) {
            toast(`لا يمكن حذف هذه الباقة — ${salonsCount} صالون يستخدمها`, 'warning');
            return;
        }
        const ok = await confirm({
            title: 'حذف الباقة',
            message: 'هل أنت متأكد من حذف هذه الباقة؟ لا يمكن التراجع.',
            confirmLabel: 'حذف',
            variant: 'danger',
        });
        if (!ok) return;
        try {
            await api.delete(`/superadmin/plans.php?id=${id}`);
            setPlansData(prev => prev.filter(p => p.id !== id));
            toast('تم حذف الباقة بنجاح', 'success');
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            toast(e.response?.data?.message || 'حدث خطأ', 'error');
        }
    };

    const handleLogout = () => { logout(); router.push("/login"); };

    const statusBadge = (status: string) => {
        const map: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
            active: { label: "نشط", color: "bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/20", icon: <FaCheck size={10} /> },
            suspended: { label: "موقف", color: "bg-white/5 text-gray-400 border border-white/10", icon: <FaPause size={10} /> },
            expired: { label: "منتهي", color: "bg-red-500/10 text-red-400 border border-red-500/20", icon: <FaBan size={10} /> },
        };
        const s = map[status] || map.expired;
        return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${s.color}`}>{s.icon} {s.label}</span>;
    };

    if (!_hydrated || loading) return <div className="min-h-screen bg-bg-dark flex items-center justify-center"><div className="spinner" /></div>;

    return (
        <div className="min-h-screen bg-bg-dark text-[var(--color-text-primary)]" dir="rtl">

            {/* ── Header ── */}
            <header className="bg-card-dark border-b border-[var(--border-subtle)] sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C3D809] to-[#B88A10] flex items-center justify-center">
                            <FaCrown className="text-black" size={18} />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-accent-lime">لوحة إدارة المنصة</h1>
                            <p className="text-xs text-[var(--color-text-muted)]">Super Admin Panel</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-[var(--color-text-secondary)]">مرحباً, {user?.name}</span>
                        <button onClick={handleLogout} className="text-[var(--color-text-secondary)] hover:text-red-400 transition-colors"><FaSignOutAlt size={18} /></button>
                    </div>
                </div>
            </header>

            {/* ── Tabs ── */}
            <div className="max-w-7xl mx-auto px-4 mt-4">
                {/* Mobile Tab Dropdown */}
                <div className="block md:hidden relative">
                    <button
                        onClick={() => setTabDropdownOpen(!tabDropdownOpen)}
                        className="w-full flex items-center justify-between bg-[var(--color-surface)] text-[var(--color-text-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 outline-none font-bold text-sm shadow-sm transition-all focus:border-accent-lime"
                    >
                        <div className="flex items-center gap-2.5">
                            {(() => {
                                const currentTabObj = [
                                    { key: "dashboard", label: "لوحة التحكم", icon: <FaChartLine /> },
                                    { key: "salons", label: "إدارة الصالونات", icon: <FaBuilding /> },
                                    { key: "revenues", label: "الإيرادات", icon: <FaMoneyBillWave /> },
                                    { key: "plans", label: "إدارة الباقات", icon: <FaCogs /> },
                                    { key: "settings", label: "إعدادات المنصة", icon: <FaInfoCircle /> },
                                    { key: "contacts", label: "طلبات التسجيل", icon: <FaEnvelope /> },
                                ].find(t => t.key === activeTab);
                                return (
                                    <>
                                        <span className="text-accent-lime text-base">{currentTabObj?.icon}</span>
                                        <span>{currentTabObj?.label}</span>
                                        {activeTab === 'contacts' && contactsNewCount > 0 && (
                                            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-black bg-red-500 text-[var(--color-text-primary)]">{contactsNewCount}</span>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                        <FaChevronDown size={14} className={`transition-transform duration-300 ${tabDropdownOpen ? 'rotate-180 text-accent-lime' : 'text-[var(--color-text-muted)]'}`} />
                    </button>

                    {tabDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-xl shadow-xl overflow-hidden z-50 flex flex-col">
                            {[
                                { key: "dashboard" as const, label: "لوحة التحكم", icon: <FaChartLine /> },
                                { key: "salons" as const, label: "إدارة الصالونات", icon: <FaBuilding /> },
                                { key: "revenues" as const, label: "الإيرادات", icon: <FaMoneyBillWave /> },
                                { key: "plans" as const, label: "إدارة الباقات", icon: <FaCogs /> },
                                { key: "settings" as const, label: "إعدادات المنصة", icon: <FaInfoCircle /> },
                                { key: "contacts" as const, label: "طلبات التسجيل", icon: <FaEnvelope /> },
                            ].map((tab) => (
                                <button key={tab.key} onClick={() => { setActiveTab(tab.key); setTabDropdownOpen(false); }}
                                    className={`flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors ${activeTab === tab.key ? "bg-accent-lime/10 text-accent-lime border-r-2 border-accent-lime" : "text-[var(--color-text-secondary)] hover:bg-white/5"}`}>
                                    <div className="flex items-center gap-2.5">
                                        <span>{tab.icon}</span>
                                        <span>{tab.label}</span>
                                    </div>
                                    {tab.key === 'contacts' && contactsNewCount > 0 && (
                                        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-black bg-red-500 text-[var(--color-text-primary)]">{contactsNewCount}</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Desktop Tabs */}
                <div className="hidden md:flex gap-2 bg-card-dark rounded-xl p-1 overflow-x-auto hide-scrollbars w-full md:w-fit">
                    {[
                        { key: "dashboard" as const, label: "لوحة التحكم", icon: <FaChartLine /> },
                        { key: "salons" as const, label: "إدارة الصالونات", icon: <FaBuilding /> },
                        { key: "revenues" as const, label: "الإيرادات", icon: <FaMoneyBillWave /> },
                        { key: "plans" as const, label: "إدارة الباقات", icon: <FaCogs /> },
                        { key: "settings" as const, label: "إعدادات المنصة", icon: <FaInfoCircle /> },
                        {
                            key: "contacts" as const,
                            label: <span className="flex items-center gap-1.5 whitespace-nowrap">طلبات التسجيل {contactsNewCount > 0 && <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-black bg-red-500 text-[var(--color-text-primary)]">{contactsNewCount}</span>}</span>,
                            icon: <FaEnvelope />,
                        },
                    ].map((tab) => (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${activeTab === tab.key ? "bg-accent-lime text-black" : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]"}`}>
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-6">

                {/* ════════ Dashboard Tab ════════ */}
                {activeTab === "dashboard" && stats && (
                    <div className="space-y-6">
                        {/* 3 Stat Cards (removed "إجمالي الموظفين") */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {[
                                { label: "إجمالي الصالونات", value: stats.salons.total, icon: <FaBuilding /> },
                                { label: "صالونات نشطة", value: stats.salons.active, icon: <FaCheck /> },
                                { label: "إيرادات الشهر", value: revenueMonthTotal.toFixed(3) + " د.أ", icon: <FaChartLine /> },
                            ].map((card, i) => (
                                <div key={i} className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-2xl p-5 hover:border-[var(--color-accent)]/30 hover:shadow-[0_4px_20px_rgba(195,216,9,0.05)] transition-all group">
                                    <div className="w-10 h-10 rounded-xl bg-black/40 border border-white/5 flex items-center justify-center mb-4 group-hover:border-[var(--color-accent)]/30 group-hover:bg-[var(--color-accent)]/5 transition-all">
                                        <span className="text-[var(--color-accent)] text-lg">{card.icon}</span>
                                    </div>
                                    <p className="text-3xl font-black text-white" style={{ fontVariantNumeric: 'tabular-nums' }}>{card.value}</p>
                                    <p className="text-xs font-medium text-[var(--color-text-muted)] mt-1.5">{card.label}</p>
                                </div>
                            ))}
                        </div>

                        {/* Alerts */}
                        {(stats.salons.expiring_soon > 0 || stats.salons.suspended > 0) && (
                            <div className="bg-accent-lime/10 border border-accent-lime/20 rounded-xl p-4 flex items-center gap-3">
                                <FaExclamationTriangle className="text-yellow-500 flex-shrink-0" />
                                <div className="text-sm space-y-1">
                                    {stats.salons.expiring_soon > 0 && <p className="text-accent-lime">{stats.salons.expiring_soon} اشتراك ينتهي خلال 7 أيام</p>}
                                    {stats.salons.suspended > 0 && <p className="text-accent-lime">{stats.salons.suspended} صالون موقف</p>}
                                </div>
                            </div>
                        )}

                        {/* Revenue Chart */}
                        <div className="bg-card-dark border border-[var(--border-subtle)] rounded-2xl p-6">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><FaChartLine className="text-accent-lime" /> إيرادات المنصة</h3>
                            <div className="flex items-end gap-2 h-40">
                                {(() => {
                                    const chart = revenues.reduce((acc: { month: string; revenue: number }[], r) => {
                                        const m = r.payment_date?.slice(0, 7);
                                        const label = m ? new Date(m + "-01").toLocaleDateString("ar-JO", { month: "short", year: "2-digit" }) : "—";
                                        const ex = acc.find(x => x.month === label);
                                        if (ex) ex.revenue += Number(r.amount); else acc.push({ month: label, revenue: Number(r.amount) });
                                        return acc;
                                    }, []).slice(-6);
                                    if (chart.length === 0) {
                                        return (
                                            <div className="w-full text-center py-12 text-sm text-[var(--color-text-muted)] flex flex-col items-center justify-center gap-2">
                                                <FaMoneyBillWave className="text-2xl text-gray-700 animate-pulse" />
                                                <span>لا توجد بيانات إيرادات مسجلة حالياً للرسم البياني</span>
                                            </div>
                                        );
                                    }
                                    const maxRev = Math.max(...chart.map(c => c.revenue), 1);
                                    return chart.map((item, i) => (
                                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                            <span className="text-xs text-[var(--color-text-muted)]">{item.revenue.toFixed(0)}</span>
                                            <div className="w-full bg-gradient-to-t from-[#C3D809] to-[#B88A10] rounded-t-lg min-h-[4px] transition-all"
                                                style={{ height: `${Math.max((item.revenue / maxRev) * 100, 3)}%` }} />
                                            <span className="text-[10px] text-gray-600">{item.month}</span>
                                        </div>
                                    ));
                                })()}
                            </div>
                        </div>

                        {/* Expiring Soon */}
                        {(() => {
                            const expiring = salons.filter(s => { if (s.status !== 'active') return false; const d = getDaysLeft(s.subscription_expires_at); return d !== null && d <= 7; })
                                .sort((a, b) => getDaysLeft(a.subscription_expires_at)! - getDaysLeft(b.subscription_expires_at)!);
                            if (expiring.length === 0) return null;
                            return (
                                <div className="bg-accent-lime/[.06] border border-accent-lime/20 rounded-2xl p-5">
                                    <h3 className="text-base font-bold text-accent-lime mb-4 flex items-center gap-2"><FaExclamationTriangle /> صالونات تنتهي قريباً ({expiring.length})</h3>
                                    <div className="space-y-2">
                                        {expiring.map(s => {
                                            const d = getDaysLeft(s.subscription_expires_at)!;
                                            const isUrgent = d <= 2;
                                            return (
                                                <div key={s.id} className="flex items-center justify-between bg-card-dark rounded-xl p-3 border"
                                                    style={{ borderColor: isUrgent ? "rgba(231,76,60,.25)" : "rgba(195,216,9,.15)" }}>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-accent-lime font-bold text-sm"
                                                            style={{ background: "rgba(195,216,9,.1)", border: "1px solid rgba(195,216,9,.2)" }}>{s.name?.charAt(0) || '?'}</div>
                                                        <div>
                                                            <p className="font-medium text-sm">{s.name}</p>
                                                            <p className="text-xs text-[var(--color-text-muted)]">{s.plan_name || 'بدون باقة'} • {s.owner_phone || '—'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-3 sm:mt-0 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                                                        <span className="text-xs font-bold px-2.5 py-1.5 rounded-full whitespace-nowrap"
                                                            style={{ background: isUrgent ? "rgba(231,76,60,.15)" : "var(--border-subtle)", color: isUrgent ? "#e74c3c" : "#C3D809" }}>
                                                            {d === 0 ? "ينتهي اليوم!" : `${d} ${d === 1 ? "يوم" : "أيام"}`}
                                                        </span>
                                                        <button onClick={() => handleStatusChange(s.id, "active", 30)} className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 transition-all font-bold whitespace-nowrap border border-white/5">+ شهر</button>
                                                        <button onClick={() => handleStatusChange(s.id, "active", 180)} className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 transition-all font-bold whitespace-nowrap border border-white/5">+ 6 أشهر</button>
                                                        <button onClick={() => handleStatusChange(s.id, "active", 365)} className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 transition-all font-bold whitespace-nowrap border border-white/5">+ سنة</button>
                                                        {s.owner_phone && <a href={`https://wa.me/${s.owner_phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1.5 rounded-lg bg-green-500/15 text-green-400 hover:bg-green-500/25 transition-all font-bold whitespace-nowrap border border-green-500/20">واتساب</a>}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Subscription Details */}
                        <div className="bg-card-dark border border-[var(--border-subtle)] rounded-2xl p-6">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><FaBuilding className="text-accent-lime" /> تفاصيل اشتراكات الصالونات</h3>
                            <div className="space-y-2.5">
                                {salons.slice(0, 8).map((s) => {
                                    const dLeft = getDaysLeft(s.subscription_expires_at);
                                    const isExpiring = dLeft !== null && dLeft <= 7 && s.status === 'active';
                                    const planColors: Record<string, string> = {
                                        free: "bg-white/5 text-gray-400 border-white/10",
                                        basic: "bg-white/10 text-gray-300 border-white/20",
                                        professional: "bg-[var(--color-accent)]/10 text-[var(--color-accent)] border-[var(--color-accent)]/20",
                                        enterprise: "bg-[var(--color-accent)] text-black border-[var(--color-accent)]",
                                    };
                                    const planColor = planColors[s.plan_type || "basic"] || planColors.basic;
                                    return (
                                        <div key={s.id} className="bg-card-dark rounded-xl border border-[var(--color-surface)] overflow-hidden">
                                            {/* Row 1: Salon identity + status + action */}
                                            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-surface)]/60">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-8 h-8 rounded-lg bg-[var(--color-surface)] border border-[var(--border-subtle)] flex items-center justify-center text-accent-lime font-bold text-sm flex-shrink-0">{s.name?.charAt(0) || '?'}</div>
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-sm truncate">{s.name}</p>
                                                        <p className="text-[11px] text-[#666] truncate">/{s.slug} • {s.owner_name || '—'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    {statusBadge(s.status)}
                                                    <button onClick={() => setSelectedSalon(s)}
                                                        className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-accent-lime/10 text-accent-lime hover:bg-accent-lime/20 transition-all border border-accent-lime/15">
                                                        <FaInfoCircle size={8} /> تفاصيل
                                                    </button>
                                                </div>
                                            </div>
                                            {/* Row 2: Plan / Dates / Days — wrapped on mobile */}
                                            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 px-4 py-2.5">
                                                {s.plan_name && (
                                                    <span className={`text-[11px] px-2.5 py-0.5 rounded-full border whitespace-nowrap flex-shrink-0 font-medium ${planColor}`}>{s.plan_name}</span>
                                                )}
                                                <span className="hidden md:block w-px h-3 bg-[#4A4A4A] flex-shrink-0" />
                                                {s.subscription_starts_at && (
                                                    <span className="text-[11px] whitespace-nowrap flex-shrink-0">
                                                        <span className="text-[#555]">بدأ </span>
                                                        <span className="text-[var(--color-text-muted)]">{new Date(s.subscription_starts_at).toLocaleDateString("ar-JO")}</span>
                                                    </span>
                                                )}
                                                {s.subscription_expires_at && (
                                                    <span className="text-[11px] whitespace-nowrap flex-shrink-0">
                                                        <span className="text-[#555]">ينتهي </span>
                                                        <span className={isExpiring ? "text-accent-lime font-semibold" : "text-[var(--color-text-muted)]"}>{new Date(s.subscription_expires_at).toLocaleDateString("ar-JO")}</span>
                                                    </span>
                                                )}
                                                {dLeft !== null && s.status === 'active' && (
                                                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 ${isExpiring ? "bg-red-500/15 text-red-400 border border-red-500/20" : "bg-white/5 text-gray-400 border border-white/10"}`}>
                                                        {dLeft === 0 ? "⚠ ينتهي اليوم" : `${dLeft} يوم متبقي`}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* ════════ Revenues Tab ════════ */}
                {activeTab === "revenues" && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold flex items-center gap-2"><FaMoneyBillWave className="text-accent-lime" /> إيرادات المنصة</h2>
                            <span className="text-sm font-bold text-accent-lime">الشهر الحالي: {revenueMonthTotal.toFixed(3)} د.أ</span>
                        </div>

                        {/* Add Revenue Form */}
                        <div className="bg-card-dark border border-[var(--border-subtle)] rounded-2xl p-5">
                            <h3 className="text-base font-bold text-accent-lime mb-4 flex items-center gap-2"><FaPlus size={12} /> تسجيل إيراد جديد</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {/* Salon selector */}
                                <div>
                                    <label className="text-xs text-[var(--color-text-muted)] mb-1 block">الصالون</label>
                                    <select value={revForm.salon_id}
                                        onChange={e => setRevForm({ ...revForm, salon_id: e.target.value, salon_name: salons.find(s => s.id === Number(e.target.value))?.name || "" })}
                                        className="w-full bg-card-dark border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-sm focus:border-accent-lime outline-none">
                                        <option value="">-- اختر صالون --</option>
                                        {salons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                {/* Manual name if not in list */}
                                {!revForm.salon_id && (
                                    <div>
                                        <label className="text-xs text-[var(--color-text-muted)] mb-1 block">اسم الصالون (يدوي)</label>
                                        <input value={revForm.salon_name}
                                            onChange={e => setRevForm({ ...revForm, salon_name: e.target.value })}
                                            className="w-full bg-card-dark border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-sm focus:border-accent-lime outline-none"
                                            placeholder="اسم الصالون..." />
                                    </div>
                                )}
                                {/* Amount */}
                                <div>
                                    <label className="text-xs text-[var(--color-text-muted)] mb-1 block">المبلغ (د.أ) *</label>
                                    <input type="number" min="0" step="0.001" value={revForm.amount}
                                        onChange={e => setRevForm({ ...revForm, amount: e.target.value })}
                                        className="w-full bg-card-dark border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-sm focus:border-accent-lime outline-none"
                                        placeholder="0.000" dir="ltr" />
                                </div>
                                {/* Date */}
                                <div>
                                    <label className="text-xs text-[var(--color-text-muted)] mb-1 block">تاريخ الدفع</label>
                                    <input type="date" value={revForm.payment_date}
                                        onChange={e => setRevForm({ ...revForm, payment_date: e.target.value })}
                                        className="w-full bg-card-dark border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-sm focus:border-accent-lime outline-none" dir="ltr" />
                                </div>
                                {/* Description */}
                                <div className="sm:col-span-2 lg:col-span-2">
                                    <label className="text-xs text-[var(--color-text-muted)] mb-1 block">الوصف (اختياري)</label>
                                    <input value={revForm.description}
                                        onChange={e => setRevForm({ ...revForm, description: e.target.value })}
                                        className="w-full bg-card-dark border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-sm focus:border-accent-lime outline-none"
                                        placeholder="مثال: اشتراك شهري - باقة احترافي" />
                                </div>
                            </div>
                            <button onClick={handleAddRevenue} disabled={revLoading}
                                className="mt-4 flex items-center gap-2 bg-accent-lime text-black px-5 py-2.5 rounded-xl font-bold hover:bg-[#C3D809] transition-all disabled:opacity-50 text-sm">
                                <FaPlus size={12} /> {revLoading ? "جاري الحفظ..." : "تسجيل الإيراد"}
                            </button>
                        </div>

                        {/* Revenues List */}
                        <div className="bg-card-dark border border-[var(--border-subtle)] rounded-2xl overflow-hidden">
                            <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
                                <h3 className="font-bold">سجل الإيرادات ({revenues.length})</h3>
                            </div>
                            {revenues.length === 0 ? (
                                <div className="p-12 text-center text-[var(--color-text-muted)]">
                                    <FaMoneyBillWave className="mx-auto text-4xl mb-3 text-gray-700" />
                                    <p>لا يوجد إيرادات مسجلة</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-[var(--border-subtle)] text-[var(--color-text-muted)] text-xs">
                                                <th className="text-right p-3">الصالون</th>
                                                <th className="text-center p-3">المبلغ</th>
                                                <th className="text-center p-3">الوصف</th>
                                                <th className="text-center p-3">تاريخ الدفع</th>
                                                <th className="text-center p-3"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {revenues.map(r => (
                                                <tr key={r.id} className="border-b border-[var(--color-surface)] hover:bg-card-dark transition-colors">
                                                    <td className="p-3 text-sm font-medium">{r.salon_name || "—"}</td>
                                                    <td className="p-3 text-center text-sm text-accent-lime font-bold">{Number(r.amount).toFixed(3)} د.أ</td>
                                                    <td className="p-3 text-center text-xs text-[var(--color-text-secondary)]">{r.description || "—"}</td>
                                                    <td className="p-3 text-center text-xs text-[var(--color-text-muted)]">{new Date(r.payment_date).toLocaleDateString("ar-JO")}</td>
                                                    <td className="p-3 text-center">
                                                        <button onClick={() => handleDeleteRevenue(r.id)}
                                                            className="text-red-400/60 hover:text-red-400 transition-colors p-1">
                                                            <FaTrash size={11} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="bg-card-dark">
                                                <td className="p-3 text-sm font-bold text-[var(--color-text-secondary)]">الإجمالي</td>
                                                <td className="p-3 text-center text-sm font-black text-accent-lime">
                                                    {revenues.reduce((s, r) => s + Number(r.amount), 0).toFixed(3)} د.أ
                                                </td>
                                                <td colSpan={3} />
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ════════ Contacts Tab ════════ */}
                {activeTab === "contacts" && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold flex items-center gap-2"><FaEnvelope className="text-accent-lime" /> طلبات التسجيل ({contacts.length})</h2>
                            <span className="text-sm text-[var(--color-text-muted)]">{contactsNewCount} طلب جديد</span>
                        </div>
                        {contacts.length === 0 ? (
                            <div className="bg-card-dark border border-[var(--border-subtle)] rounded-2xl p-12 text-center text-[var(--color-text-muted)]">
                                <FaEnvelope className="mx-auto text-4xl mb-3 text-gray-700" /><p>لا يوجد طلبات</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {contacts.map((req) => (
                                    <div key={req.id} className={`bg-card-dark border rounded-2xl p-5 space-y-3 ${req.status === "new" ? "border-accent-lime/30" : req.status === "contacted" ? "border-blue-500/20" : "border-[var(--border-subtle)]"}`}>
                                        <div className="flex items-start justify-between">
                                            <div><p className="font-bold text-[var(--color-text-primary)]">{req.salon_name}</p><p className="text-sm text-[var(--color-text-secondary)]">{req.owner_name}</p></div>
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${req.status === "new" ? "bg-accent-lime/20 text-accent-lime" : req.status === "contacted" ? "bg-blue-500/20 text-blue-400" : "bg-emerald-500/20 text-emerald-400"}`}>
                                                {req.status === "new" ? "جديد" : req.status === "contacted" ? "تم التواصل" : "منتهي"}
                                            </span>
                                        </div>
                                        <div className="space-y-1 text-sm text-[var(--color-text-secondary)]">
                                            <p className="flex items-center gap-2"><FaPhone size={10} className="text-accent-lime" /><a href={`tel:${req.phone}`} className="hover:text-[var(--color-text-primary)] transition-colors dir-ltr">{req.phone}</a></p>
                                            {req.city && <p className="flex items-center gap-2"><FaMapMarkerAlt size={10} className="text-accent-lime" />{req.city}</p>}
                                            <p className="flex items-center gap-2"><FaUsers size={10} className="text-accent-lime" />{req.employees} موظف</p>
                                            {req.message && <p className="text-xs text-[var(--color-text-muted)] mt-2 p-2 rounded-lg bg-white/[.02] border border-white/[.04]">{req.message}</p>}
                                        </div>
                                        <div className="text-[10px] text-gray-600">{new Date(req.created_at).toLocaleString("ar-JO")}</div>
                                        {req.status !== "done" && (
                                            <div className="flex flex-col sm:flex-row gap-2 pt-2">
                                                {req.status === "new" && <button onClick={() => handleContactStatus(req.id, "contacted")} className="flex-1 py-2 sm:py-1.5 rounded-lg text-xs font-bold bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all">تم التواصل</button>}
                                                <button onClick={() => handleContactStatus(req.id, "done")} className="flex-1 py-2 sm:py-1.5 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-all">إنهاء</button>
                                                <a href={`https://wa.me/${req.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex-1 text-center py-2 sm:py-1.5 rounded-lg text-xs font-bold bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-all">واتساب</a>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ════════ Plans Tab ════════ */}
                {activeTab === "plans" && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold flex items-center gap-2"><FaCogs className="text-accent-lime" /> إدارة الباقات</h2>
                                <p className="text-xs text-[var(--color-text-muted)] mt-1">أي تعديل يُطبَّق فوراً على الصفحة الرئيسية وجميع الأماكن</p>
                            </div>
                            <button onClick={openCreatePlan}
                                className="flex items-center gap-2 bg-accent-lime text-black px-4 py-2 rounded-xl font-bold hover:bg-[#C3D809] transition-all text-sm">
                                <FaPlus size={11} /> باقة جديدة
                            </button>
                        </div>

                        {/* Plans Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            {plansData.map(p => (
                                <div key={p.id}
                                    className={`relative flex flex-col bg-card-dark border rounded-2xl p-5 transition-all hover:border-[var(--border-subtle)] ${
                                        p.is_popular ? 'border-accent-lime/30' : 'border-[var(--border-subtle)]'
                                    } ${!p.is_active ? 'opacity-50' : ''}`}>

                                    {/* Popular badge */}
                                    {p.is_popular && (
                                        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-black"
                                            style={{ background: 'linear-gradient(135deg,#C3D809,#C3D809)', color: '#000' }}>
                                            الأكثر شعبية ⭐
                                        </div>
                                    )}
                                    {!p.is_active && (
                                        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-black bg-red-500/20 text-red-400 border border-red-500/30">مُعطَّل</div>
                                    )}

                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <p className="font-bold text-[var(--color-text-primary)] text-base">{p.name_ar}</p>
                                            <p className="text-xs text-gray-600">{p.name}</p>
                                        </div>
                                        <div className="text-left">
                                            <span className="text-2xl font-black text-accent-lime">{Number(p.price) === 0 ? 'مجاني' : `${Number(p.price).toFixed(3)}`}</span>
                                            {Number(p.price) > 0 && <span className="text-xs text-gray-600 block text-right">د.أ/شهر</span>}
                                        </div>
                                    </div>

                                    {/* Limits */}
                                    <div className="flex gap-2 mb-3">
                                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                            {p.max_employees >= 999 ? 'موظفين ∞' : `${p.max_employees} موظف`}
                                        </span>
                                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                            {p.max_services >= 999 ? 'خدمات ∞' : `${p.max_services} خدمة`}
                                        </span>
                                        {p.salons_count !== undefined && (
                                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                {p.salons_count} صالون
                                            </span>
                                        )}
                                    </div>

                                    {/* Features */}
                                    <ul className="space-y-1.5 mb-4">
                                        {(p.features || []).map((f, fi) => (
                                            <li key={fi} className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                                                <span className="text-accent-lime">✓</span> {f}
                                            </li>
                                        ))}
                                    </ul>

                                    {/* Actions */}
                                    <div className="flex gap-2 mt-auto pt-2 border-t border-[var(--color-surface)]">
                                        <button onClick={() => openEditPlan(p)}
                                            className="flex-1 py-2 rounded-xl text-xs font-bold bg-accent-lime/15 text-accent-lime hover:bg-accent-lime/25 transition-all">
                                            تعديل
                                        </button>
                                        <button onClick={() => handleDeletePlan(p.id, p.salons_count || 0)}
                                            className="py-2 px-3 rounded-xl text-xs font-bold bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all">
                                            <FaTrash size={10} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {plansData.length === 0 && (
                                <div className="col-span-3 bg-card-dark border border-[var(--border-subtle)] rounded-2xl p-12 text-center text-[var(--color-text-muted)]">
                                    <FaCogs className="mx-auto text-4xl mb-3 text-gray-700" />
                                    <p>لا يوجد باقات</p>
                                </div>
                            )}
                        </div>

                        {/* Info box */}
                        <div className="bg-blue-500/[.05] border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
                            <FaInfoCircle className="text-blue-400 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-blue-300/80 space-y-1">
                                <p className="font-bold text-blue-300">كيف يعمل؟</p>
                                <p>• أي تغيير في الأسعار أو المزايا يُطبَّق <strong>فوراً</strong> على الصفحة الرئيسية (maqas.site)</p>
                                <p>• الباقة &quot;الأكثر شعبية&quot; يمكن تفعيلها فقط على باقة واحدة</p>
                                <p>• لا يمكن حذف باقة تمتلك صالونات — غيّر باقة الصالونات أولاً</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* ════════ Salons Tab ════════ */}
                {activeTab === "salons" && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold">إدارة الصالونات</h2>
                            <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 bg-accent-lime text-black px-4 py-2 rounded-xl font-medium hover:bg-[#C3D809] transition-all">
                                <FaPlus /> إضافة صالون
                            </button>
                        </div>
                        {/* Desktop View */}
                        <div className="hidden md:block bg-card-dark border border-[var(--border-subtle)] rounded-2xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead><tr className="border-b border-[var(--border-subtle)] text-[var(--color-text-muted)] text-sm">
                                        <th className="text-right p-4">الصالون</th>
                                        <th className="text-center p-4">الباقة</th>
                                        <th className="text-center p-4">الموظفين</th>
                                        <th className="text-center p-4">عمليات الشهر</th>
                                        <th className="text-center p-4">إيرادات الشهر</th>
                                        <th className="text-center p-4">الحالة</th>
                                        <th className="text-center p-4">إجراءات</th>
                                    </tr></thead>
                                    <tbody>
                                        {salons.map((salon) => (
                                            <tr key={salon.id} className="border-b border-[var(--color-surface)] hover:bg-card-dark transition-colors">
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-[var(--color-surface)] border border-[var(--border-subtle)] flex items-center justify-center text-accent-lime font-bold text-lg">{salon.name?.charAt(0) || '?'}</div>
                                                        <div><p className="font-medium">{salon.name || 'بدون اسم'}</p><p className="text-xs text-[var(--color-text-muted)]">{salon.owner_name || salon.slug}</p></div>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center text-sm text-[var(--color-text-secondary)]">{salon.plan_name || '-'}</td>
                                                <td className="p-4 text-center text-sm">{salon.emp_count}</td>
                                                <td className="p-4 text-center text-sm">{salon.month_tx}</td>
                                                <td className="p-4 text-center text-sm text-accent-lime">{Number(salon.month_revenue).toFixed(3)}</td>
                                                <td className="p-4 text-center">{statusBadge(salon.status)}</td>
                                                <td className="p-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button onClick={() => setSelectedSalon(salon)}
                                                            className="text-accent-lime/70 hover:text-accent-lime text-xs bg-accent-lime/10 px-2 py-1 rounded-lg transition-all">
                                                            تفاصيل
                                                        </button>
                                                        {salon.status === "active" ? (
                                                            <button onClick={() => handleStatusChange(salon.id, "suspended")} className="text-yellow-500 hover:text-accent-lime text-xs bg-accent-lime/10 px-2 py-1 rounded-lg">إيقاف</button>
                                                        ) : (
                                                            <button onClick={() => handleStatusChange(salon.id, "active")} className="text-emerald-500 hover:text-emerald-400 text-xs bg-emerald-500/10 px-2 py-1 rounded-lg">تفعيل</button>
                                                        )}
                                                        <button
                                                            onClick={() => { setDeleteModal({ salon }); setDeleteConfirmText(""); }}
                                                            className="text-red-400/70 hover:text-red-400 text-xs bg-red-500/10 hover:bg-red-500/20 px-2 py-1 rounded-lg transition-all"
                                                            title="حذف نهائي"
                                                        >
                                                            <FaTrash size={10} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {salons.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-[var(--color-text-muted)]">لا يوجد صالونات</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Mobile View */}
                        <div className="block md:hidden space-y-3">
                            {salons.map((salon) => (
                                <div key={salon.id} className="bg-card-dark border border-[var(--border-subtle)] rounded-2xl p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-[var(--color-surface)] border border-[var(--border-subtle)] flex items-center justify-center text-accent-lime font-bold text-lg">{salon.name?.charAt(0) || '?'}</div>
                                            <div>
                                                <p className="font-medium">{salon.name || 'بدون اسم'}</p>
                                                <p className="text-xs text-[var(--color-text-muted)]">{salon.owner_name || salon.slug}</p>
                                            </div>
                                        </div>
                                        {statusBadge(salon.status)}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--color-surface)]/40 text-xs text-[var(--color-text-secondary)]">
                                        <div>
                                            <span className="text-[var(--color-text-muted)] block">الباقة:</span>
                                            <span className="font-semibold">{salon.plan_name || '-'}</span>
                                        </div>
                                        <div>
                                            <span className="text-[var(--color-text-muted)] block">الموظفين:</span>
                                            <span className="font-semibold">{salon.emp_count}</span>
                                        </div>
                                        <div>
                                            <span className="text-[var(--color-text-muted)] block">عمليات الشهر:</span>
                                            <span className="font-semibold">{salon.month_tx}</span>
                                        </div>
                                        <div>
                                            <span className="text-[var(--color-text-muted)] block">إيرادات الشهر:</span>
                                            <span className="font-semibold text-accent-lime">{Number(salon.month_revenue).toFixed(3)} د.أ</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 pt-2 border-t border-[var(--color-surface)]/40">
                                        <button onClick={() => setSelectedSalon(salon)}
                                            className="flex-1 py-2 rounded-xl text-xs font-bold bg-accent-lime/10 text-accent-lime border border-accent-lime/20 hover:bg-accent-lime/20 transition-all">
                                            تفاصيل
                                        </button>
                                        {salon.status === "active" ? (
                                            <button onClick={() => handleStatusChange(salon.id, "suspended")} className="flex-1 py-2 rounded-xl text-xs font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                                                إيقاف
                                            </button>
                                        ) : (
                                            <button onClick={() => handleStatusChange(salon.id, "active")} className="flex-1 py-2 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                تفعيل
                                            </button>
                                        )}
                                        <button
                                            onClick={() => { setDeleteModal({ salon }); setDeleteConfirmText(""); }}
                                            className="py-2 px-3 rounded-xl text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all border border-red-500/20"
                                        >
                                            <FaTrash size={10} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {salons.length === 0 && (
                                <div className="bg-card-dark border border-[var(--border-subtle)] rounded-2xl p-8 text-center text-[var(--color-text-muted)]">
                                    لا يوجد صالونات
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ════════ Platform Settings Tab ════════ */}
                {activeTab === "settings" && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold">إعدادات المنصة (مقص)</h2>
                            <button
                                onClick={handleSaveSettings}
                                disabled={settingsSaving}
                                className="flex items-center gap-2 bg-accent-lime text-black px-6 py-2 rounded-xl font-bold hover:bg-[#C3D809] transition-all disabled:opacity-50"
                            >
                                {settingsSaving ? "جاري الحفظ..." : <><FaCheck size={14} /> حفظ التعديلات</>}
                            </button>
                        </div>

                        {/* Helper component for a premium toggle */}
                        {(() => {
                            const ToggleBtn = ({ field }: { field: string }) => {
                                const showKey = `show_${field}` as keyof typeof platformSettings;
                                const isVisible = platformSettings[showKey] !== false;
                                
                                const handleToggle = (e: React.MouseEvent) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setPlatformSettings(prev => ({
                                        ...prev,
                                        [showKey]: !isVisible
                                    }));
                                };

                                return (
                                    <button
                                        type="button"
                                        onClick={handleToggle}
                                        className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300 border cursor-pointer z-10 ${
                                            isVisible
                                                ? 'bg-accent-lime/10 border-accent-lime/40 text-accent-lime shadow-[0_0_10px_rgba(195,216,9,0.1)]'
                                                : 'bg-white/5 border-white/10 text-[var(--color-text-muted)]'
                                        }`}
                                    >
                                        <span className="text-[10px] font-bold uppercase tracking-wider pointer-events-none">
                                            {isVisible ? 'مرئي' : 'مخفي'}
                                        </span>
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all pointer-events-none ${isVisible ? 'bg-accent-lime text-black scale-110 shadow-[0_0_15px_rgba(195,216,9,0.4)]' : 'bg-white/10 text-white'}`}>
                                            {isVisible ? <FaEye size={12} /> : <FaEyeSlash size={12} />}
                                        </div>
                                    </button>
                                );
                            };

                            return (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Contact Info Card */}
                                    <div className="bg-card-dark border border-[var(--border-subtle)] rounded-[2rem] p-8 space-y-6 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-accent-lime/5 blur-[80px] rounded-full -mr-16 -mt-16 group-hover:bg-accent-lime/10 transition-all"></div>
                                        
                                        <h3 className="text-xl font-black text-white flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-accent-lime/10 flex items-center justify-center text-accent-lime">
                                                <FaEnvelope size={18} />
                                            </div>
                                            معلومات التواصل
                                        </h3>

                                        <div className="space-y-6">
                                            {[
                                                { id: 'email', label: 'البريد الإلكتروني', placeholder: 'info@maqas.site', type: 'text' },
                                                { id: 'phone', label: 'رقم الهاتف (للعرض)', placeholder: '+962 78 171 7990', type: 'text', dir: 'ltr' },
                                                { id: 'whatsapp', label: 'رقم الواتساب (للرابط)', placeholder: '962781717990', type: 'text', dir: 'ltr' },
                                                { id: 'address', label: 'العنوان', placeholder: 'عمان، الأردن', type: 'textarea' },
                                            ].map((field) => (
                                                <div key={field.id} className="relative">
                                                    <div className="flex items-center justify-between mb-2 px-1">
                                                        <label className="text-xs font-bold text-[var(--color-text-secondary)]">{field.label}</label>
                                                        <ToggleBtn field={field.id as any} />
                                                    </div>
                                                    {field.type === 'textarea' ? (
                                                        <textarea
                                                            value={(platformSettings as any)[field.id]}
                                                            onChange={e => setPlatformSettings({ ...platformSettings, [field.id]: e.target.value })}
                                                            className={`w-full bg-[var(--color-surface)] border rounded-2xl px-5 py-4 text-sm focus:border-accent-lime outline-none transition-all h-24 resize-none ${
                                                                (platformSettings as any)[`show_${field.id}`] !== false 
                                                                    ? 'border-[var(--border-subtle)] text-white' 
                                                                    : 'border-white/5 text-white/20'
                                                            }`}
                                                            placeholder={field.placeholder}
                                                        />
                                                    ) : (
                                                        <input
                                                            value={(platformSettings as any)[field.id]}
                                                            onChange={e => setPlatformSettings({ ...platformSettings, [field.id]: e.target.value })}
                                                            className={`w-full bg-[var(--color-surface)] border rounded-2xl px-5 py-4 text-sm focus:border-accent-lime outline-none transition-all ${
                                                                (platformSettings as any)[`show_${field.id}`] !== false 
                                                                    ? 'border-[var(--border-subtle)] text-white' 
                                                                    : 'border-white/5 text-white/20'
                                                            }`}
                                                            placeholder={field.placeholder} dir={field.dir}
                                                        />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Social Media Card */}
                                    <div className="bg-card-dark border border-[var(--border-subtle)] rounded-[2rem] p-8 space-y-6 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-accent-lime/5 blur-[80px] rounded-full -mr-16 -mt-16 group-hover:bg-accent-lime/10 transition-all"></div>

                                        <h3 className="text-xl font-black text-white flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-accent-lime/10 flex items-center justify-center text-accent-lime">
                                                <FaInstagram size={18} />
                                            </div>
                                            الروابط الاجتماعية
                                        </h3>

                                        <div className="space-y-6">
                                            {[
                                                { id: 'instagram', label: 'إنستجرام', icon: <FaInstagram />, color: 'text-pink-500' },
                                                { id: 'facebook', label: 'فيسبوك', icon: <FaFacebook />, color: 'text-blue-500' },
                                                { id: 'tiktok', label: 'تيك توك', icon: <FaTiktok />, color: 'text-white' },
                                            ].map((social) => (
                                                <div key={social.id} className="relative">
                                                    <div className="flex items-center justify-between mb-2 px-1">
                                                        <label className="text-xs font-bold text-[var(--color-text-secondary)] flex items-center gap-2">
                                                            <span className={social.color}>{social.icon}</span> {social.label}
                                                        </label>
                                                        <ToggleBtn field={social.id as any} />
                                                    </div>
                                                    <input
                                                        value={(platformSettings as any)[social.id]}
                                                        onChange={e => setPlatformSettings({ ...platformSettings, [social.id]: e.target.value })}
                                                        className={`w-full bg-[var(--color-surface)] border rounded-2xl px-5 py-4 text-sm focus:border-accent-lime outline-none transition-all ${
                                                            (platformSettings as any)[`show_${social.id}`] !== false 
                                                                ? 'border-[var(--border-subtle)] text-white' 
                                                                : 'border-white/5 text-white/20'
                                                        }`}
                                                        placeholder={`https://${social.id}.com/maqas`} dir="ltr"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Visual Preview - Re-styled to match site footer exactly */}
                        <div className="bg-black border border-accent-lime/20 rounded-[2.5rem] p-10 mt-10 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent-lime/20 to-transparent"></div>
                            
                            <h3 className="text-sm font-black text-accent-lime uppercase tracking-[0.2em] mb-10 flex items-center gap-3">
                                <span className="w-8 h-[1px] bg-accent-lime/30"></span>
                                معاينة الظهور في الموقع
                                <span className="w-8 h-[1px] bg-accent-lime/30"></span>
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                                {/* Brand Column */}
                                <div className="space-y-4">
                                    <div className="w-12 h-12 rounded-full border-2 border-accent-lime flex items-center justify-center">
                                        <div className="w-8 h-8 rounded-full bg-accent-lime"></div>
                                    </div>
                                    <p className="text-xs text-white/40 leading-relaxed max-w-[200px]">
                                        نقدم لك تجربة حلاقة استثنائية تجمع بين الفن والدقة في قلب عمان.
                                    </p>
                                </div>

                                {/* Contact Column */}
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-white/20 uppercase tracking-widest">تواصل معنا</h4>
                                    <div className="space-y-3">
                                        {platformSettings.show_email !== false && (
                                            <p className="text-sm text-white/70 hover:text-accent-lime transition-colors cursor-default">{platformSettings.email || 'info@maqas.site'}</p>
                                        )}
                                        {platformSettings.show_phone !== false && (
                                            <p className="text-sm text-white/70 hover:text-accent-lime transition-colors cursor-default" dir="ltr">{platformSettings.phone || '+962 78 171 7990'}</p>
                                        )}
                                        {platformSettings.show_address !== false && (
                                            <div className="flex items-start gap-2 pt-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-accent-lime mt-1.5 shrink-0"></div>
                                                <p className="text-[11px] text-white/40 italic">{platformSettings.address || 'عمان، الأردن'}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Social Column */}
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-white/20 uppercase tracking-widest">تابعنا</h4>
                                    <div className="flex gap-4">
                                        {[
                                            { id: 'instagram', icon: <FaInstagram size={20} /> },
                                            { id: 'facebook', icon: <FaFacebook size={20} /> },
                                            { id: 'tiktok', icon: <FaTiktok size={20} /> },
                                            { id: 'whatsapp', icon: <FaWhatsapp size={20} /> },
                                        ].map((social) => {
                                            const isVisible = (platformSettings as any)[`show_${social.id}`] !== false;
                                            if (!isVisible) return null;
                                            return (
                                                <div key={social.id} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-accent-lime hover:border-accent-lime/50 transition-all cursor-default">
                                                    {social.icon}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>

            {/* ── Salon Details Popup ── */}
            {selectedSalon && (
                <SalonDetailsPopup 
                    salon={selectedSalon} 
                    plans={plans} 
                    onClose={() => setSelectedSalon(null)} 
                    onStatusChange={handleStatusChange} 
                    onUpdatePlan={handleUpdatePlan}
                    onSaveSalonInfo={handleSaveSalonInfo}
                />
            )}

            {/* ── Create Salon Modal ── */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-card-dark border border-[var(--border-subtle)] rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
                        <div className="p-4 sm:p-6 border-b border-[var(--border-subtle)] flex justify-between items-center shrink-0">
                            <h3 className="text-lg font-bold text-accent-lime">إنشاء صالون جديد</h3>
                            <button onClick={() => setShowCreateModal(false)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] text-xl">&times;</button>
                        </div>
                        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-[var(--color-text-secondary)] mb-1 block">اسم الصالون *</label>
                                    <input value={newSalon.name} onChange={(e) => setNewSalon({ ...newSalon, name: e.target.value })} className="w-full bg-card-dark border border-[var(--border-subtle)] rounded-xl px-3 py-2.5 text-sm focus:border-accent-lime outline-none" placeholder="مثال: صالون النجم" />
                                </div>
                                <div>
                                    <label className="text-sm text-[var(--color-text-secondary)] mb-1 block">الرابط (slug) *</label>
                                    <input value={newSalon.slug} onChange={(e) => setNewSalon({ ...newSalon, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })} className="w-full bg-card-dark border border-[var(--border-subtle)] rounded-xl px-3 py-2.5 text-sm focus:border-accent-lime outline-none" placeholder="star-salon" dir="ltr" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div><label className="text-sm text-[var(--color-text-secondary)] mb-1 block">اسم المالك</label><input value={newSalon.owner_name} onChange={(e) => setNewSalon({ ...newSalon, owner_name: e.target.value })} className="w-full bg-card-dark border border-[var(--border-subtle)] rounded-xl px-3 py-2.5 text-sm focus:border-accent-lime outline-none" /></div>
                                <div><label className="text-sm text-[var(--color-text-secondary)] mb-1 block">رقم الهاتف</label><input value={newSalon.owner_phone} onChange={(e) => setNewSalon({ ...newSalon, owner_phone: e.target.value })} className="w-full bg-card-dark border border-[var(--border-subtle)] rounded-xl px-3 py-2.5 text-sm focus:border-accent-lime outline-none" dir="ltr" /></div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-[var(--color-text-secondary)] mb-1 block">الباقة</label>
                                    <select value={newSalon.subscription_plan_id} onChange={(e) => setNewSalon({ ...newSalon, subscription_plan_id: Number(e.target.value) })} className="w-full bg-card-dark border border-[var(--border-subtle)] rounded-xl px-3 py-2.5 text-sm focus:border-accent-lime outline-none">
                                        {plans.map((p) => <option key={p.id} value={p.id}>{p.name_ar} - {p.price} د.أ</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm text-[var(--color-text-secondary)] mb-1 block">مدة الاشتراك</label>
                                    <div className="flex gap-2">
                                        <input type="number" min="1" max="3650" value={newSalon.duration_days}
                                            onChange={(e) => setNewSalon({ ...newSalon, duration_days: Number(e.target.value) || 1 })}
                                            className="w-20 bg-card-dark border border-[var(--border-subtle)] rounded-xl px-2 py-2.5 text-sm focus:border-accent-lime outline-none text-center" dir="ltr" />
                                        <span className="text-xs text-[var(--color-text-muted)] self-center">يوم</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        {[{d:1,l:'يوم'},{d:3,l:'3 أيام'},{d:7,l:'أسبوع'},{d:14,l:'أسبوعين'},{d:30,l:'شهر'},{d:90,l:'3 أشهر'},{d:180,l:'6 أشهر'},{d:365,l:'سنة'}].map(({d,l}) => (
                                            <button key={d} type="button" onClick={() => setNewSalon({...newSalon, duration_days: d})}
                                                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${newSalon.duration_days === d ? 'bg-accent-lime text-black' : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'}`}>{l}</button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="border-t border-[var(--border-subtle)] pt-4">
                                <p className="text-sm text-accent-lime mb-3 flex items-center gap-2"><FaCogs /> حساب مدير الصالون</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div><label className="text-sm text-[var(--color-text-secondary)] mb-1 block">اسم الدخول</label><input value={newSalon.admin_username} onChange={(e) => setNewSalon({ ...newSalon, admin_username: e.target.value })} className="w-full bg-card-dark border border-[var(--border-subtle)] rounded-xl px-3 py-2.5 text-sm focus:border-accent-lime outline-none" dir="ltr" /></div>
                                    <div><label className="text-sm text-[var(--color-text-secondary)] mb-1 block">كلمة المرور</label><input type="password" value={newSalon.admin_password} onChange={(e) => setNewSalon({ ...newSalon, admin_password: e.target.value })} className="w-full bg-card-dark border border-[var(--border-subtle)] rounded-xl px-3 py-2.5 text-sm focus:border-accent-lime outline-none" dir="ltr" /></div>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-[var(--border-subtle)] flex gap-3 justify-end">
                            <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 rounded-xl border border-[var(--border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all">إلغاء</button>
                            <button onClick={handleCreateSalon} disabled={actionLoading} className="px-6 py-2 rounded-xl bg-accent-lime text-black font-medium hover:bg-[#C3D809] transition-all disabled:opacity-50">
                                {actionLoading ? "جاري الإنشاء..." : "إنشاء الصالون"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Plan Create/Edit Modal ── */}
            {planModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setPlanModal(null)}>
                    <div className="bg-card-dark border border-[var(--border-subtle)] rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden"
                        onClick={e => e.stopPropagation()}>

                        {/* Header */}
                        <div className="p-5 border-b border-[var(--border-subtle)] flex items-center justify-between shrink-0">
                            <h3 className="text-lg font-bold text-accent-lime flex items-center gap-2">
                                <FaCogs size={15} />
                                {planModal === 'create' ? 'إنشاء باقة جديدة' : `تعديل: ${editingPlan?.name_ar}`}
                            </h3>
                            <button onClick={() => setPlanModal(null)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"><FaTimes /></button>
                        </div>

                        {/* Body */}
                        <div className="p-5 space-y-4 overflow-y-auto">
                            {/* Names */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-[var(--color-text-muted)] mb-1 block">الاسم بالعربية *</label>
                                    <input value={planForm.name_ar}
                                        onChange={e => setPlanForm({ ...planForm, name_ar: e.target.value })}
                                        className="w-full bg-card-dark border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-sm focus:border-accent-lime outline-none"
                                        placeholder="مثال: احترافي" />
                                </div>
                                <div>
                                    <label className="text-xs text-[var(--color-text-muted)] mb-1 block">الاسم بالإنجليزية *</label>
                                    <input value={planForm.name}
                                        onChange={e => setPlanForm({ ...planForm, name: e.target.value })}
                                        className="w-full bg-card-dark border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-sm focus:border-accent-lime outline-none" dir="ltr"
                                        placeholder="Professional" />
                                </div>
                            </div>

                            {/* Price & Duration */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-[var(--color-text-muted)] mb-1 block">السعر (د.أ / شهر)</label>
                                    <input type="number" min="0" step="0.001" value={planForm.price}
                                        onChange={e => setPlanForm({ ...planForm, price: e.target.value })}
                                        className="w-full bg-card-dark border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-sm focus:border-accent-lime outline-none" dir="ltr"
                                        placeholder="0 = مجاني" />
                                </div>
                                <div>
                                    <label className="text-xs text-[var(--color-text-muted)] mb-1 block">مدة الاشتراك (يوم)</label>
                                    <select value={planForm.duration_days}
                                        onChange={e => setPlanForm({ ...planForm, duration_days: e.target.value })}
                                        className="w-full bg-card-dark border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-sm focus:border-accent-lime outline-none">
                                        <option value="30">30 يوم (شهر)</option>
                                        <option value="90">90 يوم (3 أشهر)</option>
                                        <option value="180">180 يوم (6 أشهر)</option>
                                        <option value="365">365 يوم (سنة)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Limits */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-[var(--color-text-muted)] mb-1 block">حد الموظفين (999 = غير محدود)</label>
                                    <input type="number" min="1" value={planForm.max_employees}
                                        onChange={e => setPlanForm({ ...planForm, max_employees: e.target.value })}
                                        className="w-full bg-card-dark border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-sm focus:border-accent-lime outline-none" dir="ltr" />
                                </div>
                                <div>
                                    <label className="text-xs text-[var(--color-text-muted)] mb-1 block">حد الخدمات (999 = غير محدود)</label>
                                    <input type="number" min="1" value={planForm.max_services}
                                        onChange={e => setPlanForm({ ...planForm, max_services: e.target.value })}
                                        className="w-full bg-card-dark border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-sm focus:border-accent-lime outline-none" dir="ltr" />
                                </div>
                            </div>

                            {/* Toggles */}
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <div className={`w-10 h-5 rounded-full transition-all relative ${planForm.is_popular ? 'bg-accent-lime' : 'bg-[#333]'}`}
                                        onClick={() => setPlanForm({ ...planForm, is_popular: !planForm.is_popular })}>
                                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${planForm.is_popular ? 'left-5' : 'left-0.5'}`} />
                                    </div>
                                    <span className="text-sm text-[var(--color-text-secondary)]">الأكثر شعبية ⭐</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <div className={`w-10 h-5 rounded-full transition-all relative ${planForm.is_active ? 'bg-emerald-500' : 'bg-[#333]'}`}
                                        onClick={() => setPlanForm({ ...planForm, is_active: !planForm.is_active })}>
                                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${planForm.is_active ? 'left-5' : 'left-0.5'}`} />
                                    </div>
                                    <span className="text-sm text-[var(--color-text-secondary)]">مفعّل</span>
                                </label>
                            </div>

                            {/* Features editor */}
                            <div>
                                <label className="text-xs text-[var(--color-text-muted)] mb-2 block">المزايا</label>
                                {/* Add feature */}
                                <div className="flex gap-2 mb-3">
                                    <input
                                        value={newFeature}
                                        onChange={e => setNewFeature(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter' && newFeature.trim()) { setPlanForm(f => ({ ...f, features: [...f.features, newFeature.trim()] })); setNewFeature(''); }}}
                                        className="flex-1 bg-card-dark border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-sm focus:border-accent-lime outline-none"
                                        placeholder="اكتب ميزة واضغط Enter أو +" />
                                    <button onClick={() => { if (newFeature.trim()) { setPlanForm(f => ({ ...f, features: [...f.features, newFeature.trim()] })); setNewFeature(''); }}}
                                        className="px-3 py-2 bg-accent-lime text-black rounded-xl font-bold hover:bg-[#C3D809] transition-all">
                                        <FaPlus size={12} />
                                    </button>
                                </div>
                                {/* Features list */}
                                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                                    {planForm.features.map((f, fi) => (
                                        <div key={fi} className="flex items-center gap-2 bg-card-dark border border-[var(--color-surface)] rounded-xl px-3 py-1.5">
                                            <span className="text-accent-lime text-xs">✓</span>
                                            <span className="text-sm flex-1 text-[var(--color-text-primary)]">{f}</span>
                                            <button onClick={() => setPlanForm(prev => ({ ...prev, features: prev.features.filter((_, i) => i !== fi) }))}
                                                className="text-red-400/50 hover:text-red-400 transition-colors ml-auto">
                                                <FaTimes size={10} />
                                            </button>
                                        </div>
                                    ))}
                                    {planForm.features.length === 0 && (
                                        <p className="text-xs text-gray-600 text-center py-3">لا يوجد مزايا — أضف ميزة أعلاه</p>
                                    )}
                                </div>
                            </div>

                            {/* Live preview */}
                            <div className="bg-card-dark border border-[var(--color-surface)] rounded-xl p-4">
                                <p className="text-[10px] text-gray-600 mb-3 uppercase tracking-wider">معاينة مباشرة</p>
                                <div className={`rounded-xl p-4 border ${planForm.is_popular ? 'border-accent-lime/30' : 'border-[var(--border-subtle)]'}`}
                                    style={{ background: planForm.is_popular ? 'linear-gradient(135deg,var(--border-subtle),rgba(195,216,9,.02))' : 'rgba(255,255,255,.015)' }}>
                                    <h4 className="font-bold text-[var(--color-text-primary)] mb-1">{planForm.name_ar || 'اسم الباقة'}</h4>
                                    <p className="text-2xl font-black text-accent-lime mb-3">
                                        {parseFloat(planForm.price || '0') === 0 ? 'مجاني' : `${parseFloat(planForm.price || '0').toFixed(3)} د.أ`}
                                        {parseFloat(planForm.price || '0') > 0 && <span className="text-xs text-[var(--color-text-muted)] font-normal mr-1">/شهر</span>}
                                    </p>
                                    <ul className="space-y-1">
                                        {planForm.features.slice(0, 4).map((f, i) => (
                                            <li key={i} className="text-xs text-[var(--color-text-secondary)] flex items-center gap-1.5"><span className="text-accent-lime">✓</span>{f}</li>
                                        ))}
                                        {planForm.features.length > 4 && <li className="text-xs text-gray-600">+{planForm.features.length - 4} مزايا أخرى</li>}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-[var(--border-subtle)] flex gap-3 justify-end shrink-0">
                            <button onClick={() => setPlanModal(null)}
                                className="px-4 py-2 rounded-xl border border-[var(--border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all text-sm">
                                إلغاء
                            </button>
                            <button onClick={handleSavePlan} disabled={planSaving}
                                className="px-6 py-2 rounded-xl bg-accent-lime text-black font-bold hover:bg-[#C3D809] transition-all disabled:opacity-50 text-sm flex items-center gap-2">
                                {planSaving ? 'جاري الحفظ...' : planModal === 'create' ? <><FaPlus size={11} /> إنشاء الباقة</> : <><FaCheck size={11} /> حفظ التعديلات</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        {/* ── Delete Salon Modal ── */}
        {deleteModal && (
            <div className="fixed inset-0 z-[99] flex items-center justify-center p-4" dir="rtl">
                <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => { setDeleteModal(null); setDeleteConfirmText(""); }} />
                <div className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
                    style={{ background: "#1E1E1E", border: "1px solid rgba(239,68,68,0.4)" }}>
                    <div className="p-5 flex items-center gap-3" style={{ background: "rgba(239,68,68,0.1)", borderBottom: "1px solid rgba(239,68,68,0.2)" }}>
                        <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center flex-shrink-0">
                            <FaTrash size={16} className="text-red-400" />
                        </div>
                        <div>
                            <p className="font-bold text-red-400">حذف نهائي وكامل</p>
                            <p className="text-xs text-[var(--color-text-muted)]">هذا الإجراء لا يمكن التراجع عنه</p>
                        </div>
                    </div>
                    <div className="p-5 space-y-4">
                        <div className="rounded-xl p-3.5 text-xs space-y-1.5" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}>
                            <p className="font-bold text-red-400 mb-2">سيتم حذف جميع البيانات نهائياً:</p>
                            {["الموظفون وحساباتهم", "جميع المعاملات المالية", "الخدمات والحجوزات", "المصاريف والتقارير", "الفروع المرتبطة", "سجلات الاشتراكات"].map(item => (
                                <p key={item} className="text-red-300/70 flex items-center gap-1.5"><span className="text-red-500">✗</span> {item}</p>
                            ))}
                        </div>
                        <div className="text-center">
                            <p className="text-xs text-[var(--color-text-muted)] mb-1.5">الصالون المراد حذفه</p>
                            <span className="inline-block px-4 py-1.5 rounded-full text-sm font-bold"
                                style={{ background: "rgba(239,68,68,0.15)", color: "#FF6B6B", border: "1px solid rgba(239,68,68,0.3)" }}>
                                {deleteModal!.salon.name}
                            </span>
                        </div>
                        <div>
                            <label className="text-xs text-[#AAAAAA] block mb-1.5">اكتب اسم الصالون بالضبط للتأكيد: <span className="text-red-400 font-bold">*</span></label>
                            <input
                                type="text" value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)}
                                placeholder={deleteModal!.salon.name} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                                style={{ background: "var(--color-surface)", border: `1px solid ${deleteConfirmText === deleteModal!.salon.name ? "rgba(239,68,68,0.7)" : "rgba(255,255,255,0.1)"}`, color: "#FFFFFF" }}
                                onKeyDown={e => { if (e.key === "Enter" && deleteConfirmText === deleteModal!.salon.name) handleDeleteSalon(); }}
                                autoFocus
                            />
                        </div>
                        <div className="flex gap-3 pt-1">
                            <button onClick={() => { setDeleteModal(null); setDeleteConfirmText(""); }}
                                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-white/10"
                                style={{ background: "rgba(255,255,255,0.06)", color: "#AAAAAA", border: "1px solid rgba(255,255,255,0.1)" }}>
                                إلغاء
                            </button>
                            <button onClick={handleDeleteSalon}
                                disabled={deleteConfirmText !== deleteModal!.salon.name || deleteLoading}
                                className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] flex items-center justify-center gap-2"
                                style={{ background: "linear-gradient(135deg, #dc2626, #ef4444)", color: "#FFFFFF", boxShadow: "0 8px 24px rgba(239,68,68,0.3)" }}>
                                {deleteLoading
                                    ? <><span className="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> جاري الحذف...</>
                                    : <><FaTrash size={12} /> حذف نهائي</>}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
        </div>
    );
}
