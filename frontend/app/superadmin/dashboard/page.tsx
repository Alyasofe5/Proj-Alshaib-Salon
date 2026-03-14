"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import {
    FaBuilding, FaChartLine, FaExclamationTriangle, FaCogs,
    FaSignOutAlt, FaPause, FaCheck, FaBan, FaPlus, FaCrown,
    FaEnvelope, FaPhone, FaMapMarkerAlt, FaUsers, FaTimes,
    FaMoneyBillWave, FaTrash, FaInfoCircle,
} from "react-icons/fa";
import api from "@/lib/api";
import { useBrandUI } from "@/components/ui/BrandUI";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Salon {
    id: number; name: string; slug: string;
    owner_name: string; owner_email: string; owner_phone: string;
    status: "active" | "suspended" | "expired";
    plan_name: string; emp_count: number; month_tx: number;
    month_revenue: number; subscription_expires_at: string;
    subscription_starts_at: string; created_at: string;
}
interface Plan {
    id: number; name: string; name_ar: string;
    price: number; duration_days: number;
    max_employees: number; max_services: number;
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
function SalonDetailsPopup({ salon, onClose, onStatusChange }: {
    salon: Salon; onClose: () => void; onStatusChange: (id: number, status: string, days?: number) => void;
}) {
    const dLeft = getDaysLeft(salon.subscription_expires_at);
    return (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-[#2D2D2D] border border-[#4A4535] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-5 border-b border-[#4A4535] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-[#3A3A3A] border border-[#4A4535] flex items-center justify-center text-[#E6B31E] font-bold text-xl">
                            {salon.name.charAt(0)}
                        </div>
                        <div>
                            <h3 className="font-bold text-[#FCFAF1] text-lg">{salon.name}</h3>
                            <p className="text-xs text-[#8A8A8A] dir-ltr">/{salon.slug}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-[#8A8A8A] hover:text-[#FCFAF1] transition-colors p-1"><FaTimes /></button>
                </div>

                {/* Body */}
                <div className="p-5 space-y-4">
                    {/* Status */}
                    <div className="flex items-center gap-3 p-3 bg-[#343434] rounded-xl border border-[#3A3A3A]">
                        <span className="text-xs text-[#8A8A8A]">الحالة:</span>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${salon.status === "active" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : salon.status === "suspended" ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"}`}>
                            {salon.status === "active" ? <><FaCheck size={9} /> نشط</> : salon.status === "suspended" ? <><FaPause size={9} /> موقف</> : <><FaBan size={9} /> منتهي</>}
                        </span>
                        {dLeft !== null && salon.status === "active" && (
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${dLeft <= 7 ? "bg-yellow-500/15 text-yellow-400" : "bg-emerald-500/15 text-emerald-400"}`}>
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
                            <div key={i} className="bg-[#343434] rounded-xl p-3 border border-[#3A3A3A]">
                                <p className="text-[10px] text-gray-600 mb-0.5">{item.label}</p>
                                <p className={`text-sm font-medium ${item.gold ? "text-[#E6B31E]" : "text-[#FCFAF1]"} ${item.ltr ? "dir-ltr text-left" : ""}`}>{item.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Subscription Dates */}
                    {(salon.subscription_starts_at || salon.subscription_expires_at) && (
                        <div className="bg-[#343434] rounded-xl p-3 border border-[#3A3A3A] space-y-2">
                            <p className="text-xs text-[#8A8A8A] font-bold mb-2">تفاصيل الاشتراك</p>
                            {salon.subscription_starts_at && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-[#8A8A8A]">تاريخ البداية</span>
                                    <span className="text-[#FCFAF1]">{new Date(salon.subscription_starts_at).toLocaleDateString("ar-JO")}</span>
                                </div>
                            )}
                            {salon.subscription_expires_at && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-[#8A8A8A]">تاريخ الانتهاء</span>
                                    <span className={dLeft !== null && dLeft <= 7 ? "text-yellow-400 font-bold" : "text-[#FCFAF1]"}>
                                        {new Date(salon.subscription_expires_at).toLocaleDateString("ar-JO")}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-2 pt-1">
                        {salon.status === "active" ? (
                            <button onClick={() => onStatusChange(salon.id, "suspended")}
                                className="flex-1 py-2.5 sm:py-2 rounded-xl text-sm font-bold bg-yellow-500/15 text-yellow-400 hover:bg-yellow-500/25 transition-all">
                                إيقاف الصالون
                            </button>
                        ) : (
                            <button onClick={() => onStatusChange(salon.id, "active", 30)}
                                className="flex-1 py-2.5 sm:py-2 rounded-xl text-sm font-bold bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-all">
                                تفعيل (شهر)
                            </button>
                        )}
                        <button onClick={() => onStatusChange(salon.id, "active", 30)}
                            className="flex-1 py-2.5 sm:py-2 rounded-xl text-xs font-bold bg-[#E6B31E]/15 text-[#E6B31E] hover:bg-[#E6B31E]/25 transition-all">
                            + شهر
                        </button>
                        <button onClick={() => onStatusChange(salon.id, "active", 180)}
                            className="flex-1 py-2.5 sm:py-2 rounded-xl text-xs font-bold bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 transition-all">
                            + 6 أشهر
                        </button>
                        <button onClick={() => onStatusChange(salon.id, "active", 365)}
                            className="flex-1 py-2.5 sm:py-2 rounded-xl text-xs font-bold bg-purple-500/15 text-purple-400 hover:bg-purple-500/25 transition-all">
                            + سنة
                        </button>
                        {salon.owner_phone && (
                            <a href={`https://wa.me/${salon.owner_phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                                className="flex-1 py-2.5 sm:py-2 rounded-xl text-sm font-bold bg-green-500/15 text-green-400 hover:bg-green-500/25 transition-all text-center">
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
    const [activeTab, setActiveTab] = useState<"dashboard" | "salons" | "contacts" | "revenues" | "plans">("dashboard");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedSalon, setSelectedSalon] = useState<Salon | null>(null);
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
            const [statsRes, salonsRes, contactsRes, revenuesRes, plansRes] = await Promise.all([
                api.get("/superadmin/stats.php"),
                api.get("/superadmin/salons.php"),
                api.get("/superadmin/contacts.php"),
                api.get("/superadmin/revenues.php"),
                api.get("/superadmin/plans.php"),
            ]);
            setStats(statsRes.data.data);
            setSalons(salonsRes.data.data.salons || []);
            setPlans(salonsRes.data.data.plans || []);
            setContacts(contactsRes.data.data.requests || []);
            setContactsNewCount(contactsRes.data.data.new_count || 0);
            setRevenues(revenuesRes.data.data.revenues || []);
            setRevenueMonthTotal(revenuesRes.data.data.month_total || 0);
            setPlansData(plansRes.data.data || []);
        } catch { console.error("Failed to load data"); }
        finally { setLoading(false); }
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
            active: { label: "نشط", color: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30", icon: <FaCheck size={10} /> },
            suspended: { label: "موقف", color: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30", icon: <FaPause size={10} /> },
            expired: { label: "منتهي", color: "bg-red-500/20 text-red-400 border border-red-500/30", icon: <FaBan size={10} /> },
        };
        const s = map[status] || map.expired;
        return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${s.color}`}>{s.icon} {s.label}</span>;
    };

    if (!_hydrated || loading) return <div className="min-h-screen bg-[#343434] flex items-center justify-center"><div className="spinner" /></div>;

    return (
        <div className="min-h-screen bg-[#343434] text-[#FCFAF1]" dir="rtl">

            {/* ── Header ── */}
            <header className="bg-[#2D2D2D] border-b border-[#4A4535] sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E6B31E] to-[#B88A10] flex items-center justify-center">
                            <FaCrown className="text-black" size={18} />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-[#E6B31E]">لوحة إدارة المنصة</h1>
                            <p className="text-xs text-[#8A8A8A]">Super Admin Panel</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-[#CACACA]">مرحباً, {user?.name}</span>
                        <button onClick={handleLogout} className="text-[#CACACA] hover:text-red-400 transition-colors"><FaSignOutAlt size={18} /></button>
                    </div>
                </div>
            </header>

            {/* ── Tabs ── */}
            <div className="max-w-7xl mx-auto px-4 mt-4">
                <div className="flex gap-2 bg-[#2D2D2D] rounded-xl p-1 w-fit flex-wrap">
                    {[
                        { key: "dashboard" as const, label: "لوحة التحكم", icon: <FaChartLine /> },
                        { key: "salons" as const, label: "إدارة الصالونات", icon: <FaBuilding /> },
                        { key: "revenues" as const, label: "الإيرادات", icon: <FaMoneyBillWave /> },
                        { key: "plans" as const, label: "إدارة الباقات", icon: <FaCogs /> },
                        {
                            key: "contacts" as const,
                            label: <span className="flex items-center gap-1.5">طلبات التسجيل {contactsNewCount > 0 && <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-black bg-red-500 text-[#FCFAF1]">{contactsNewCount}</span>}</span>,
                            icon: <FaEnvelope />,
                        },
                    ].map((tab) => (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.key ? "bg-[#E6B31E] text-black" : "text-[#CACACA] hover:text-[#FCFAF1] hover:bg-[#3A3A3A]"}`}>
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
                                { label: "إجمالي الصالونات", value: stats.salons.total, icon: <FaBuilding />, color: "from-[#E6B31E] to-[#B88A10]" },
                                { label: "صالونات نشطة", value: stats.salons.active, icon: <FaCheck />, color: "from-emerald-500 to-emerald-700" },
                                { label: "إيرادات الشهر", value: revenueMonthTotal.toFixed(3) + " د.أ", icon: <FaChartLine />, color: "from-purple-500 to-purple-700" },
                            ].map((card, i) => (
                                <div key={i} className="bg-[#2D2D2D] border border-[#4A4535] rounded-2xl p-4 hover:border-[#4A4535] transition-all">
                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-3`}>
                                        <span className="text-[#FCFAF1] text-sm">{card.icon}</span>
                                    </div>
                                    <p className="text-2xl font-bold">{card.value}</p>
                                    <p className="text-xs text-[#8A8A8A] mt-1">{card.label}</p>
                                </div>
                            ))}
                        </div>

                        {/* Alerts */}
                        {(stats.salons.expiring_soon > 0 || stats.salons.suspended > 0) && (
                            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex items-center gap-3">
                                <FaExclamationTriangle className="text-yellow-500 flex-shrink-0" />
                                <div className="text-sm space-y-1">
                                    {stats.salons.expiring_soon > 0 && <p className="text-yellow-400">{stats.salons.expiring_soon} اشتراك ينتهي خلال 7 أيام</p>}
                                    {stats.salons.suspended > 0 && <p className="text-yellow-400">{stats.salons.suspended} صالون موقف</p>}
                                </div>
                            </div>
                        )}

                        {/* Revenue Chart */}
                        <div className="bg-[#2D2D2D] border border-[#4A4535] rounded-2xl p-6">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><FaChartLine className="text-[#E6B31E]" /> إيرادات المنصة</h3>
                            <div className="flex items-end gap-2 h-40">
                                {(() => {
                                    const chart = revenues.reduce((acc: { month: string; revenue: number }[], r) => {
                                        const m = r.payment_date?.slice(0, 7);
                                        const label = m ? new Date(m + "-01").toLocaleDateString("ar-JO", { month: "short", year: "2-digit" }) : "—";
                                        const ex = acc.find(x => x.month === label);
                                        if (ex) ex.revenue += Number(r.amount); else acc.push({ month: label, revenue: Number(r.amount) });
                                        return acc;
                                    }, []).slice(-6);
                                    const maxRev = Math.max(...chart.map(c => c.revenue), 1);
                                    return chart.map((item, i) => (
                                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                            <span className="text-xs text-[#8A8A8A]">{item.revenue.toFixed(0)}</span>
                                            <div className="w-full bg-gradient-to-t from-[#E6B31E] to-[#B88A10] rounded-t-lg min-h-[4px] transition-all"
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
                                <div className="bg-yellow-500/[.06] border border-yellow-500/20 rounded-2xl p-5">
                                    <h3 className="text-base font-bold text-yellow-400 mb-4 flex items-center gap-2"><FaExclamationTriangle /> صالونات تنتهي قريباً ({expiring.length})</h3>
                                    <div className="space-y-2">
                                        {expiring.map(s => {
                                            const d = getDaysLeft(s.subscription_expires_at)!;
                                            const isUrgent = d <= 2;
                                            return (
                                                <div key={s.id} className="flex items-center justify-between bg-[#343434] rounded-xl p-3 border"
                                                    style={{ borderColor: isUrgent ? "rgba(231,76,60,.25)" : "rgba(251,191,36,.15)" }}>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[#E6B31E] font-bold text-sm"
                                                            style={{ background: "rgba(230,179,30,.1)", border: "1px solid rgba(230,179,30,.2)" }}>{s.name.charAt(0)}</div>
                                                        <div>
                                                            <p className="font-medium text-sm">{s.name}</p>
                                                            <p className="text-xs text-[#8A8A8A]">{s.plan_name || 'بدون باقة'} • {s.owner_phone || '—'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-3 sm:mt-0 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                                                        <span className="text-xs font-bold px-2.5 py-1.5 rounded-full whitespace-nowrap"
                                                            style={{ background: isUrgent ? "rgba(231,76,60,.15)" : "rgba(251,191,36,.12)", color: isUrgent ? "#e74c3c" : "#fbbf24" }}>
                                                            {d === 0 ? "ينتهي اليوم!" : `${d} ${d === 1 ? "يوم" : "أيام"}`}
                                                        </span>
                                                        <button onClick={() => handleStatusChange(s.id, "active", 30)} className="text-xs px-2.5 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-all font-bold whitespace-nowrap">+ شهر</button>
                                                        <button onClick={() => handleStatusChange(s.id, "active", 180)} className="text-xs px-2.5 py-1.5 rounded-lg bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 transition-all font-bold whitespace-nowrap">+ 6 أشهر</button>
                                                        <button onClick={() => handleStatusChange(s.id, "active", 365)} className="text-xs px-2.5 py-1.5 rounded-lg bg-purple-500/15 text-purple-400 hover:bg-purple-500/25 transition-all font-bold whitespace-nowrap">+ سنة</button>
                                                        {s.owner_phone && <a href={`https://wa.me/${s.owner_phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-xs px-2.5 py-1.5 rounded-lg bg-green-500/15 text-green-400 hover:bg-green-500/25 transition-all font-bold whitespace-nowrap">واتساب</a>}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Subscription Details */}
                        <div className="bg-[#2D2D2D] border border-[#4A4535] rounded-2xl p-6">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><FaBuilding className="text-[#E6B31E]" /> تفاصيل اشتراكات الصالونات</h3>
                            <div className="space-y-3">
                                {salons.slice(0, 8).map((s) => {
                                    const dLeft = getDaysLeft(s.subscription_expires_at);
                                    const isExpiring = dLeft !== null && dLeft <= 7 && s.status === 'active';
                                    return (
                                        <div key={s.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-[#343434] rounded-xl p-4 border border-[#3A3A3A] gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-[#3A3A3A] border border-[#4A4535] flex items-center justify-center text-[#E6B31E] font-bold">{s.name.charAt(0)}</div>
                                                <div>
                                                    <p className="font-medium text-sm">{s.name}</p>
                                                    <p className="text-xs text-gray-600">/{s.slug} • {s.owner_name || '—'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {s.plan_name && <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/20">{s.plan_name}</span>}
                                                {s.subscription_starts_at && <span className="text-xs text-gray-600 hidden sm:inline">بدأ: {new Date(s.subscription_starts_at).toLocaleDateString("ar-JO")}</span>}
                                                {s.subscription_expires_at && <span className="text-xs text-[#8A8A8A]">ينتهي: {new Date(s.subscription_expires_at).toLocaleDateString("ar-JO")}</span>}
                                                {dLeft !== null && s.status === 'active' && (
                                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isExpiring ? "bg-yellow-500/15 text-yellow-400" : "bg-emerald-500/15 text-emerald-400"}`}>
                                                        {dLeft === 0 ? "ينتهي اليوم" : `${dLeft} يوم`}
                                                    </span>
                                                )}
                                                {statusBadge(s.status)}
                                                {/* Details Button */}
                                                <button onClick={() => setSelectedSalon(s)}
                                                    className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[#E6B31E]/15 text-[#E6B31E] hover:bg-[#E6B31E]/25 transition-all border border-[#E6B31E]/20">
                                                    <FaInfoCircle size={9} /> تفاصيل
                                                </button>
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
                            <h2 className="text-xl font-bold flex items-center gap-2"><FaMoneyBillWave className="text-[#E6B31E]" /> إيرادات المنصة</h2>
                            <span className="text-sm font-bold text-[#E6B31E]">الشهر الحالي: {revenueMonthTotal.toFixed(3)} د.أ</span>
                        </div>

                        {/* Add Revenue Form */}
                        <div className="bg-[#2D2D2D] border border-[#4A4535] rounded-2xl p-5">
                            <h3 className="text-base font-bold text-[#E6B31E] mb-4 flex items-center gap-2"><FaPlus size={12} /> تسجيل إيراد جديد</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {/* Salon selector */}
                                <div>
                                    <label className="text-xs text-[#8A8A8A] mb-1 block">الصالون</label>
                                    <select value={revForm.salon_id}
                                        onChange={e => setRevForm({ ...revForm, salon_id: e.target.value, salon_name: salons.find(s => s.id === Number(e.target.value))?.name || "" })}
                                        className="w-full bg-[#343434] border border-[#4A4535] rounded-xl px-3 py-2 text-sm focus:border-[#E6B31E] outline-none">
                                        <option value="">-- اختر صالون --</option>
                                        {salons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                {/* Manual name if not in list */}
                                {!revForm.salon_id && (
                                    <div>
                                        <label className="text-xs text-[#8A8A8A] mb-1 block">اسم الصالون (يدوي)</label>
                                        <input value={revForm.salon_name}
                                            onChange={e => setRevForm({ ...revForm, salon_name: e.target.value })}
                                            className="w-full bg-[#343434] border border-[#4A4535] rounded-xl px-3 py-2 text-sm focus:border-[#E6B31E] outline-none"
                                            placeholder="اسم الصالون..." />
                                    </div>
                                )}
                                {/* Amount */}
                                <div>
                                    <label className="text-xs text-[#8A8A8A] mb-1 block">المبلغ (د.أ) *</label>
                                    <input type="number" min="0" step="0.001" value={revForm.amount}
                                        onChange={e => setRevForm({ ...revForm, amount: e.target.value })}
                                        className="w-full bg-[#343434] border border-[#4A4535] rounded-xl px-3 py-2 text-sm focus:border-[#E6B31E] outline-none"
                                        placeholder="0.000" dir="ltr" />
                                </div>
                                {/* Date */}
                                <div>
                                    <label className="text-xs text-[#8A8A8A] mb-1 block">تاريخ الدفع</label>
                                    <input type="date" value={revForm.payment_date}
                                        onChange={e => setRevForm({ ...revForm, payment_date: e.target.value })}
                                        className="w-full bg-[#343434] border border-[#4A4535] rounded-xl px-3 py-2 text-sm focus:border-[#E6B31E] outline-none" dir="ltr" />
                                </div>
                                {/* Description */}
                                <div className="sm:col-span-2 lg:col-span-2">
                                    <label className="text-xs text-[#8A8A8A] mb-1 block">الوصف (اختياري)</label>
                                    <input value={revForm.description}
                                        onChange={e => setRevForm({ ...revForm, description: e.target.value })}
                                        className="w-full bg-[#343434] border border-[#4A4535] rounded-xl px-3 py-2 text-sm focus:border-[#E6B31E] outline-none"
                                        placeholder="مثال: اشتراك شهري - باقة احترافي" />
                                </div>
                            </div>
                            <button onClick={handleAddRevenue} disabled={revLoading}
                                className="mt-4 flex items-center gap-2 bg-[#E6B31E] text-black px-5 py-2.5 rounded-xl font-bold hover:bg-[#b8973f] transition-all disabled:opacity-50 text-sm">
                                <FaPlus size={12} /> {revLoading ? "جاري الحفظ..." : "تسجيل الإيراد"}
                            </button>
                        </div>

                        {/* Revenues List */}
                        <div className="bg-[#2D2D2D] border border-[#4A4535] rounded-2xl overflow-hidden">
                            <div className="p-4 border-b border-[#4A4535] flex items-center justify-between">
                                <h3 className="font-bold">سجل الإيرادات ({revenues.length})</h3>
                            </div>
                            {revenues.length === 0 ? (
                                <div className="p-12 text-center text-[#8A8A8A]">
                                    <FaMoneyBillWave className="mx-auto text-4xl mb-3 text-gray-700" />
                                    <p>لا يوجد إيرادات مسجلة</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-[#4A4535] text-[#8A8A8A] text-xs">
                                                <th className="text-right p-3">الصالون</th>
                                                <th className="text-center p-3">المبلغ</th>
                                                <th className="text-center p-3">الوصف</th>
                                                <th className="text-center p-3">تاريخ الدفع</th>
                                                <th className="text-center p-3"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {revenues.map(r => (
                                                <tr key={r.id} className="border-b border-[#3A3A3A] hover:bg-[#343434] transition-colors">
                                                    <td className="p-3 text-sm font-medium">{r.salon_name || "—"}</td>
                                                    <td className="p-3 text-center text-sm text-[#E6B31E] font-bold">{Number(r.amount).toFixed(3)} د.أ</td>
                                                    <td className="p-3 text-center text-xs text-[#CACACA]">{r.description || "—"}</td>
                                                    <td className="p-3 text-center text-xs text-[#8A8A8A]">{new Date(r.payment_date).toLocaleDateString("ar-JO")}</td>
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
                                            <tr className="bg-[#343434]">
                                                <td className="p-3 text-sm font-bold text-[#CACACA]">الإجمالي</td>
                                                <td className="p-3 text-center text-sm font-black text-[#E6B31E]">
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
                            <h2 className="text-xl font-bold flex items-center gap-2"><FaEnvelope className="text-[#E6B31E]" /> طلبات التسجيل ({contacts.length})</h2>
                            <span className="text-sm text-[#8A8A8A]">{contactsNewCount} طلب جديد</span>
                        </div>
                        {contacts.length === 0 ? (
                            <div className="bg-[#2D2D2D] border border-[#4A4535] rounded-2xl p-12 text-center text-[#8A8A8A]">
                                <FaEnvelope className="mx-auto text-4xl mb-3 text-gray-700" /><p>لا يوجد طلبات</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {contacts.map((req) => (
                                    <div key={req.id} className={`bg-[#2D2D2D] border rounded-2xl p-5 space-y-3 ${req.status === "new" ? "border-[#E6B31E]/30" : req.status === "contacted" ? "border-blue-500/20" : "border-[#4A4535]"}`}>
                                        <div className="flex items-start justify-between">
                                            <div><p className="font-bold text-[#FCFAF1]">{req.salon_name}</p><p className="text-sm text-[#CACACA]">{req.owner_name}</p></div>
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${req.status === "new" ? "bg-[#E6B31E]/20 text-[#E6B31E]" : req.status === "contacted" ? "bg-blue-500/20 text-blue-400" : "bg-emerald-500/20 text-emerald-400"}`}>
                                                {req.status === "new" ? "جديد" : req.status === "contacted" ? "تم التواصل" : "منتهي"}
                                            </span>
                                        </div>
                                        <div className="space-y-1 text-sm text-[#CACACA]">
                                            <p className="flex items-center gap-2"><FaPhone size={10} className="text-[#E6B31E]" /><a href={`tel:${req.phone}`} className="hover:text-[#FCFAF1] transition-colors dir-ltr">{req.phone}</a></p>
                                            {req.city && <p className="flex items-center gap-2"><FaMapMarkerAlt size={10} className="text-[#E6B31E]" />{req.city}</p>}
                                            <p className="flex items-center gap-2"><FaUsers size={10} className="text-[#E6B31E]" />{req.employees} موظف</p>
                                            {req.message && <p className="text-xs text-[#8A8A8A] mt-2 p-2 rounded-lg bg-white/[.02] border border-white/[.04]">{req.message}</p>}
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
                                <h2 className="text-xl font-bold flex items-center gap-2"><FaCogs className="text-[#E6B31E]" /> إدارة الباقات</h2>
                                <p className="text-xs text-[#8A8A8A] mt-1">أي تعديل يُطبَّق فوراً على الصفحة الرئيسية وجميع الأماكن</p>
                            </div>
                            <button onClick={openCreatePlan}
                                className="flex items-center gap-2 bg-[#E6B31E] text-black px-4 py-2 rounded-xl font-bold hover:bg-[#b8973f] transition-all text-sm">
                                <FaPlus size={11} /> باقة جديدة
                            </button>
                        </div>

                        {/* Plans Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            {plansData.map(p => (
                                <div key={p.id}
                                    className={`relative bg-[#2D2D2D] border rounded-2xl p-5 transition-all hover:border-[#4A4535] ${
                                        p.is_popular ? 'border-[#E6B31E]/30' : 'border-[#4A4535]'
                                    } ${!p.is_active ? 'opacity-50' : ''}`}>

                                    {/* Popular badge */}
                                    {p.is_popular && (
                                        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-black"
                                            style={{ background: 'linear-gradient(135deg,#E6B31E,#e8c96a)', color: '#000' }}>
                                            الأكثر شعبية ⭐
                                        </div>
                                    )}
                                    {!p.is_active && (
                                        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-black bg-red-500/20 text-red-400 border border-red-500/30">مُعطَّل</div>
                                    )}

                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <p className="font-bold text-[#FCFAF1] text-base">{p.name_ar}</p>
                                            <p className="text-xs text-gray-600">{p.name}</p>
                                        </div>
                                        <div className="text-left">
                                            <span className="text-2xl font-black text-[#E6B31E]">{Number(p.price) === 0 ? 'مجاني' : `${Number(p.price).toFixed(3)}`}</span>
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
                                            <li key={fi} className="flex items-center gap-2 text-xs text-[#CACACA]">
                                                <span className="text-[#E6B31E]">✓</span> {f}
                                            </li>
                                        ))}
                                    </ul>

                                    {/* Actions */}
                                    <div className="flex gap-2 mt-auto pt-2 border-t border-[#3A3A3A]">
                                        <button onClick={() => openEditPlan(p)}
                                            className="flex-1 py-2 rounded-xl text-xs font-bold bg-[#E6B31E]/15 text-[#E6B31E] hover:bg-[#E6B31E]/25 transition-all">
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
                                <div className="col-span-3 bg-[#2D2D2D] border border-[#4A4535] rounded-2xl p-12 text-center text-[#8A8A8A]">
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
                            <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 bg-[#E6B31E] text-black px-4 py-2 rounded-xl font-medium hover:bg-[#b8973f] transition-all">
                                <FaPlus /> إضافة صالون
                            </button>
                        </div>
                        <div className="bg-[#2D2D2D] border border-[#4A4535] rounded-2xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead><tr className="border-b border-[#4A4535] text-[#8A8A8A] text-sm">
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
                                            <tr key={salon.id} className="border-b border-[#3A3A3A] hover:bg-[#343434] transition-colors">
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-[#3A3A3A] border border-[#4A4535] flex items-center justify-center text-[#E6B31E] font-bold text-lg">{salon.name.charAt(0)}</div>
                                                        <div><p className="font-medium">{salon.name}</p><p className="text-xs text-[#8A8A8A]">{salon.owner_name || salon.slug}</p></div>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center text-sm text-[#CACACA]">{salon.plan_name || '-'}</td>
                                                <td className="p-4 text-center text-sm">{salon.emp_count}</td>
                                                <td className="p-4 text-center text-sm">{salon.month_tx}</td>
                                                <td className="p-4 text-center text-sm text-[#E6B31E]">{Number(salon.month_revenue).toFixed(3)}</td>
                                                <td className="p-4 text-center">{statusBadge(salon.status)}</td>
                                                <td className="p-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button onClick={() => setSelectedSalon(salon)}
                                                            className="text-[#E6B31E]/70 hover:text-[#E6B31E] text-xs bg-[#E6B31E]/10 px-2 py-1 rounded-lg transition-all">
                                                            تفاصيل
                                                        </button>
                                                        {salon.status === "active" ? (
                                                            <button onClick={() => handleStatusChange(salon.id, "suspended")} className="text-yellow-500 hover:text-yellow-400 text-xs bg-yellow-500/10 px-2 py-1 rounded-lg">إيقاف</button>
                                                        ) : (
                                                            <button onClick={() => handleStatusChange(salon.id, "active")} className="text-emerald-500 hover:text-emerald-400 text-xs bg-emerald-500/10 px-2 py-1 rounded-lg">تفعيل</button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {salons.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-[#8A8A8A]">لا يوجد صالونات</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Salon Details Popup ── */}
            {selectedSalon && (
                <SalonDetailsPopup salon={selectedSalon} onClose={() => setSelectedSalon(null)} onStatusChange={handleStatusChange} />
            )}

            {/* ── Create Salon Modal ── */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#2D2D2D] border border-[#4A4535] rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
                        <div className="p-4 sm:p-6 border-b border-[#4A4535] flex justify-between items-center shrink-0">
                            <h3 className="text-lg font-bold text-[#E6B31E]">إنشاء صالون جديد</h3>
                            <button onClick={() => setShowCreateModal(false)} className="text-[#8A8A8A] hover:text-[#FCFAF1] text-xl">&times;</button>
                        </div>
                        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-[#CACACA] mb-1 block">اسم الصالون *</label>
                                    <input value={newSalon.name} onChange={(e) => setNewSalon({ ...newSalon, name: e.target.value })} className="w-full bg-[#343434] border border-[#4A4535] rounded-xl px-3 py-2.5 text-sm focus:border-[#E6B31E] outline-none" placeholder="مثال: صالون النجم" />
                                </div>
                                <div>
                                    <label className="text-sm text-[#CACACA] mb-1 block">الرابط (slug) *</label>
                                    <input value={newSalon.slug} onChange={(e) => setNewSalon({ ...newSalon, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })} className="w-full bg-[#343434] border border-[#4A4535] rounded-xl px-3 py-2.5 text-sm focus:border-[#E6B31E] outline-none" placeholder="star-salon" dir="ltr" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div><label className="text-sm text-[#CACACA] mb-1 block">اسم المالك</label><input value={newSalon.owner_name} onChange={(e) => setNewSalon({ ...newSalon, owner_name: e.target.value })} className="w-full bg-[#343434] border border-[#4A4535] rounded-xl px-3 py-2.5 text-sm focus:border-[#E6B31E] outline-none" /></div>
                                <div><label className="text-sm text-[#CACACA] mb-1 block">رقم الهاتف</label><input value={newSalon.owner_phone} onChange={(e) => setNewSalon({ ...newSalon, owner_phone: e.target.value })} className="w-full bg-[#343434] border border-[#4A4535] rounded-xl px-3 py-2.5 text-sm focus:border-[#E6B31E] outline-none" dir="ltr" /></div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-[#CACACA] mb-1 block">الباقة</label>
                                    <select value={newSalon.subscription_plan_id} onChange={(e) => setNewSalon({ ...newSalon, subscription_plan_id: Number(e.target.value) })} className="w-full bg-[#343434] border border-[#4A4535] rounded-xl px-3 py-2.5 text-sm focus:border-[#E6B31E] outline-none">
                                        {plans.map((p) => <option key={p.id} value={p.id}>{p.name_ar} - {p.price} د.أ</option>)}
                                    </select>
                                </div>
                                <div><label className="text-sm text-[#CACACA] mb-1 block">مدة الاشتراك</label><select value={newSalon.duration_days} onChange={(e) => setNewSalon({ ...newSalon, duration_days: Number(e.target.value) })} className="w-full bg-[#343434] border border-[#4A4535] rounded-xl px-3 py-2.5 text-sm focus:border-[#E6B31E] outline-none"><option value={30}>شهر (30 يوم)</option><option value={180}>6 أشهر (180 يوم)</option><option value={365}>سنة (365 يوم)</option></select></div>
                            </div>
                            <div className="border-t border-[#4A4535] pt-4">
                                <p className="text-sm text-[#E6B31E] mb-3 flex items-center gap-2"><FaCogs /> حساب مدير الصالون</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div><label className="text-sm text-[#CACACA] mb-1 block">اسم الدخول</label><input value={newSalon.admin_username} onChange={(e) => setNewSalon({ ...newSalon, admin_username: e.target.value })} className="w-full bg-[#343434] border border-[#4A4535] rounded-xl px-3 py-2.5 text-sm focus:border-[#E6B31E] outline-none" dir="ltr" /></div>
                                    <div><label className="text-sm text-[#CACACA] mb-1 block">كلمة المرور</label><input type="password" value={newSalon.admin_password} onChange={(e) => setNewSalon({ ...newSalon, admin_password: e.target.value })} className="w-full bg-[#343434] border border-[#4A4535] rounded-xl px-3 py-2.5 text-sm focus:border-[#E6B31E] outline-none" dir="ltr" /></div>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-[#4A4535] flex gap-3 justify-end">
                            <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 rounded-xl border border-[#4A4535] text-[#CACACA] hover:text-[#FCFAF1] transition-all">إلغاء</button>
                            <button onClick={handleCreateSalon} disabled={actionLoading} className="px-6 py-2 rounded-xl bg-[#E6B31E] text-black font-medium hover:bg-[#b8973f] transition-all disabled:opacity-50">
                                {actionLoading ? "جاري الإنشاء..." : "إنشاء الصالون"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Plan Create/Edit Modal ── */}
            {planModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setPlanModal(null)}>
                    <div className="bg-[#2D2D2D] border border-[#4A4535] rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden"
                        onClick={e => e.stopPropagation()}>

                        {/* Header */}
                        <div className="p-5 border-b border-[#4A4535] flex items-center justify-between shrink-0">
                            <h3 className="text-lg font-bold text-[#E6B31E] flex items-center gap-2">
                                <FaCogs size={15} />
                                {planModal === 'create' ? 'إنشاء باقة جديدة' : `تعديل: ${editingPlan?.name_ar}`}
                            </h3>
                            <button onClick={() => setPlanModal(null)} className="text-[#8A8A8A] hover:text-[#FCFAF1] transition-colors"><FaTimes /></button>
                        </div>

                        {/* Body */}
                        <div className="p-5 space-y-4 overflow-y-auto">
                            {/* Names */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-[#8A8A8A] mb-1 block">الاسم بالعربية *</label>
                                    <input value={planForm.name_ar}
                                        onChange={e => setPlanForm({ ...planForm, name_ar: e.target.value })}
                                        className="w-full bg-[#343434] border border-[#4A4535] rounded-xl px-3 py-2 text-sm focus:border-[#E6B31E] outline-none"
                                        placeholder="مثال: احترافي" />
                                </div>
                                <div>
                                    <label className="text-xs text-[#8A8A8A] mb-1 block">الاسم بالإنجليزية *</label>
                                    <input value={planForm.name}
                                        onChange={e => setPlanForm({ ...planForm, name: e.target.value })}
                                        className="w-full bg-[#343434] border border-[#4A4535] rounded-xl px-3 py-2 text-sm focus:border-[#E6B31E] outline-none" dir="ltr"
                                        placeholder="Professional" />
                                </div>
                            </div>

                            {/* Price & Duration */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-[#8A8A8A] mb-1 block">السعر (د.أ / شهر)</label>
                                    <input type="number" min="0" step="0.001" value={planForm.price}
                                        onChange={e => setPlanForm({ ...planForm, price: e.target.value })}
                                        className="w-full bg-[#343434] border border-[#4A4535] rounded-xl px-3 py-2 text-sm focus:border-[#E6B31E] outline-none" dir="ltr"
                                        placeholder="0 = مجاني" />
                                </div>
                                <div>
                                    <label className="text-xs text-[#8A8A8A] mb-1 block">مدة الاشتراك (يوم)</label>
                                    <select value={planForm.duration_days}
                                        onChange={e => setPlanForm({ ...planForm, duration_days: e.target.value })}
                                        className="w-full bg-[#343434] border border-[#4A4535] rounded-xl px-3 py-2 text-sm focus:border-[#E6B31E] outline-none">
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
                                    <label className="text-xs text-[#8A8A8A] mb-1 block">حد الموظفين (999 = غير محدود)</label>
                                    <input type="number" min="1" value={planForm.max_employees}
                                        onChange={e => setPlanForm({ ...planForm, max_employees: e.target.value })}
                                        className="w-full bg-[#343434] border border-[#4A4535] rounded-xl px-3 py-2 text-sm focus:border-[#E6B31E] outline-none" dir="ltr" />
                                </div>
                                <div>
                                    <label className="text-xs text-[#8A8A8A] mb-1 block">حد الخدمات (999 = غير محدود)</label>
                                    <input type="number" min="1" value={planForm.max_services}
                                        onChange={e => setPlanForm({ ...planForm, max_services: e.target.value })}
                                        className="w-full bg-[#343434] border border-[#4A4535] rounded-xl px-3 py-2 text-sm focus:border-[#E6B31E] outline-none" dir="ltr" />
                                </div>
                            </div>

                            {/* Toggles */}
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <div className={`w-10 h-5 rounded-full transition-all relative ${planForm.is_popular ? 'bg-[#E6B31E]' : 'bg-[#333]'}`}
                                        onClick={() => setPlanForm({ ...planForm, is_popular: !planForm.is_popular })}>
                                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${planForm.is_popular ? 'left-5' : 'left-0.5'}`} />
                                    </div>
                                    <span className="text-sm text-[#CACACA]">الأكثر شعبية ⭐</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <div className={`w-10 h-5 rounded-full transition-all relative ${planForm.is_active ? 'bg-emerald-500' : 'bg-[#333]'}`}
                                        onClick={() => setPlanForm({ ...planForm, is_active: !planForm.is_active })}>
                                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${planForm.is_active ? 'left-5' : 'left-0.5'}`} />
                                    </div>
                                    <span className="text-sm text-[#CACACA]">مفعّل</span>
                                </label>
                            </div>

                            {/* Features editor */}
                            <div>
                                <label className="text-xs text-[#8A8A8A] mb-2 block">المزايا</label>
                                {/* Add feature */}
                                <div className="flex gap-2 mb-3">
                                    <input
                                        value={newFeature}
                                        onChange={e => setNewFeature(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter' && newFeature.trim()) { setPlanForm(f => ({ ...f, features: [...f.features, newFeature.trim()] })); setNewFeature(''); }}}
                                        className="flex-1 bg-[#343434] border border-[#4A4535] rounded-xl px-3 py-2 text-sm focus:border-[#E6B31E] outline-none"
                                        placeholder="اكتب ميزة واضغط Enter أو +" />
                                    <button onClick={() => { if (newFeature.trim()) { setPlanForm(f => ({ ...f, features: [...f.features, newFeature.trim()] })); setNewFeature(''); }}}
                                        className="px-3 py-2 bg-[#E6B31E] text-black rounded-xl font-bold hover:bg-[#b8973f] transition-all">
                                        <FaPlus size={12} />
                                    </button>
                                </div>
                                {/* Features list */}
                                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                                    {planForm.features.map((f, fi) => (
                                        <div key={fi} className="flex items-center gap-2 bg-[#343434] border border-[#3A3A3A] rounded-xl px-3 py-1.5">
                                            <span className="text-[#E6B31E] text-xs">✓</span>
                                            <span className="text-sm flex-1 text-[#FCFAF1]">{f}</span>
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
                            <div className="bg-[#343434] border border-[#3A3A3A] rounded-xl p-4">
                                <p className="text-[10px] text-gray-600 mb-3 uppercase tracking-wider">معاينة مباشرة</p>
                                <div className={`rounded-xl p-4 border ${planForm.is_popular ? 'border-[#E6B31E]/30' : 'border-[#4A4535]'}`}
                                    style={{ background: planForm.is_popular ? 'linear-gradient(135deg,rgba(230,179,30,.08),rgba(230,179,30,.02))' : 'rgba(255,255,255,.015)' }}>
                                    <h4 className="font-bold text-[#FCFAF1] mb-1">{planForm.name_ar || 'اسم الباقة'}</h4>
                                    <p className="text-2xl font-black text-[#E6B31E] mb-3">
                                        {parseFloat(planForm.price || '0') === 0 ? 'مجاني' : `${parseFloat(planForm.price || '0').toFixed(3)} د.أ`}
                                        {parseFloat(planForm.price || '0') > 0 && <span className="text-xs text-[#8A8A8A] font-normal mr-1">/شهر</span>}
                                    </p>
                                    <ul className="space-y-1">
                                        {planForm.features.slice(0, 4).map((f, i) => (
                                            <li key={i} className="text-xs text-[#CACACA] flex items-center gap-1.5"><span className="text-[#E6B31E]">✓</span>{f}</li>
                                        ))}
                                        {planForm.features.length > 4 && <li className="text-xs text-gray-600">+{planForm.features.length - 4} مزايا أخرى</li>}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-[#4A4535] flex gap-3 justify-end shrink-0">
                            <button onClick={() => setPlanModal(null)}
                                className="px-4 py-2 rounded-xl border border-[#4A4535] text-[#CACACA] hover:text-[#FCFAF1] transition-all text-sm">
                                إلغاء
                            </button>
                            <button onClick={handleSavePlan} disabled={planSaving}
                                className="px-6 py-2 rounded-xl bg-[#E6B31E] text-black font-bold hover:bg-[#b8973f] transition-all disabled:opacity-50 text-sm flex items-center gap-2">
                                {planSaving ? 'جاري الحفظ...' : planModal === 'create' ? <><FaPlus size={11} /> إنشاء الباقة</> : <><FaCheck size={11} /> حفظ التعديلات</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
