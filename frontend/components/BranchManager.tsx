"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/lib/store";
import api from "@/lib/api";
import {
    FaPlus, FaTimes, FaBuilding, FaUsers, FaChartLine,
    FaCheckCircle, FaTimesCircle, FaSpinner, FaExchangeAlt,
    FaCrown, FaLock, FaTrash, FaExclamationTriangle,
} from "react-icons/fa";
import UpgradeCard from "@/components/UpgradeCard";
import { assetUrl } from "@/lib/assets";
import { tData } from "@/lib/i18n";

interface Branch {
    id: number;
    name: string;
    slug: string;
    status: string;
    logo: string | null;
    plan_name: string | null;
    plan_type: string | null;
    days_left: number | null;
    emp_count: number;
    month_revenue: number;
    is_current: boolean;
}

interface CreateBranchForm {
    name: string;
    slug: string;
    city: string;
    phone: string;
}

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
    active:    { label: "نشط", color: "text-green-400 bg-green-400/10" },
    suspended: { label: "موقوف", color: "text-red-400 bg-red-400/10" },
    expired:   { label: "منتهي", color: "text-orange-400 bg-orange-400/10" },
};

function slugify(str: string): string {
    return str
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^\w\-]/g, "")
        .replace(/--+/g, "-")
        .replace(/^-+|-+$/g, "");
}

export default function BranchManager() {
    const { salon, isEnterprise, switchSalon } = useAuthStore();
    const [branches, setBranches]   = useState<Branch[]>([]);
    const [loading, setLoading]     = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [creating, setCreating]   = useState(false);
    const [switching, setSwitching] = useState<number | null>(null);
    const [deleting, setDeleting]   = useState<number | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<Branch | null>(null);
    const [error, setError]         = useState("");
    const [form, setForm]           = useState<CreateBranchForm>({
        name: "", slug: "", city: "", phone: ""
    });

    const canManage = isEnterprise();

    const loadBranches = useCallback(async () => {
        if (!canManage) { setLoading(false); return; }
        try {
            const res = await api.get("/branches/");
            setBranches(res.data.data || []);
        } catch {
            // silently fail — user may not have feature
        } finally {
            setLoading(false);
        }
    }, [canManage]);

    useEffect(() => { loadBranches(); }, [loadBranches]);

    const handleNameChange = (name: string) => {
        setForm(f => ({ ...f, name, slug: slugify(name) }));
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim() || !form.slug.trim()) return;
        setCreating(true);
        setError("");
        try {
            await api.post("/branches/", form);
            setShowCreate(false);
            setForm({ name: "", slug: "", city: "", phone: "" });
            await loadBranches();
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            setError(e.response?.data?.message || "حدث خطأ غير متوقع");
        } finally {
            setCreating(false);
        }
    };

    const handleSwitch = async (branch: Branch) => {
        if (branch.is_current) return;
        setSwitching(branch.id);
        try {
            const res = await api.post("/auth/switch-salon.php", { salon_id: branch.id });
            const { token, salon: newSalon, branches: newBranches } = res.data.data;
            switchSalon(newSalon, token, newBranches);
            window.location.replace("/admin/dashboard");
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            alert(e.response?.data?.message || "فشل التبديل");
        } finally {
            setSwitching(null);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!confirmDelete) return;
        setDeleting(confirmDelete.id);
        try {
            await api.delete(`/branches/?id=${confirmDelete.id}`);
            setConfirmDelete(null);
            await loadBranches();
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            alert(e.response?.data?.message || "فشل الحذف");
        } finally {
            setDeleting(null);
        }
    };

    // ── If not enterprise, show upgrade prompt
    if (!canManage) {
        return (
            <UpgradeCard
                plan="professional"
                featureName="الباقة الاحترافية الشاملة"
            />
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <FaBuilding className="text-accent-lime" />
                        إدارة الفروع
                    </h3>
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{branches.length} فرع / منشأة</p>
                </div>
                <button
                    onClick={() => setShowCreate(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-accent-lime text-black hover:bg-[#C3D809] transition-all"
                >
                    <FaPlus size={10} /> فرع جديد
                </button>
            </div>

            {/* Branch List */}
            {loading ? (
                <div className="flex justify-center py-8">
                    <FaSpinner className="animate-spin text-accent-lime text-xl" />
                </div>
            ) : branches.length === 0 ? (
                <div className="text-center py-8 text-[var(--color-text-muted)] text-sm">
                    <FaBuilding className="mx-auto text-2xl mb-2 opacity-30" />
                    لا توجد فروع بعد. ابدأ بإنشاء فرع جديد
                </div>
            ) : (
                <div className="space-y-2">
                    {branches.map((branch) => {
                        const badge = STATUS_BADGE[branch.status] || STATUS_BADGE.suspended;
                        return (
                            <motion.div
                                key={branch.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`rounded-xl border p-3 flex items-center gap-3 transition-all ${
                                    branch.is_current
                                        ? "border-accent-lime/40 bg-accent-lime/5"
                                        : "border-[var(--color-surface)] bg-[var(--color-surface)] hover:border-[var(--border-subtle)]"
                                }`}
                            >
                                {/* Logo / Initial */}
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm overflow-hidden"
                                    style={{ background: branch.is_current ? "rgba(195,216,9,0.15)" : "var(--color-surface)", color: branch.is_current ? "var(--color-accent)" : "var(--color-text-muted)" }}>
                                    {assetUrl(branch.logo) ? (
                                        <img
                                            src={assetUrl(branch.logo)!}
                                            alt={tData(branch.name, "ar")}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = "none";
                                                const fallback = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
                                                if (fallback) fallback.style.display = "flex";
                                            }}
                                        />
                                    ) : null}
                                    <span style={{ display: assetUrl(branch.logo) ? "none" : "flex" }}>{tData(branch.name, "ar").charAt(0).toUpperCase()}</span>
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-white truncate">{tData(branch.name, "ar")}</span>
                                        {branch.is_current && (
                                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-accent-lime/20 text-accent-lime font-bold flex-shrink-0">الحالي</span>
                                        )}
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold flex-shrink-0 ${badge.color}`}>{badge.label}</span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                        <span className="text-[10px] text-[var(--color-text-muted)] truncate max-w-[80px]">/{branch.slug}</span>
                                        <span className="text-[10px] text-[var(--color-text-muted)] flex items-center gap-1">
                                            <FaUsers size={8} /> {branch.emp_count}
                                        </span>
                                        <span className="text-[10px] text-[var(--color-text-muted)] flex items-center gap-1">
                                            <FaChartLine size={8} /> {branch.month_revenue.toFixed(3)} د.أ
                                        </span>
                                        {branch.days_left !== null && branch.days_left <= 7 && (
                                            <span className="text-[10px] text-orange-400">{branch.days_left}د متبقية</span>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                    {!branch.is_current && (
                                        <button
                                            onClick={() => handleSwitch(branch)}
                                            disabled={switching === branch.id || branch.status !== "active"}
                                            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-bold bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-accent-lime hover:text-black transition-all disabled:opacity-50"
                                        >
                                            {switching === branch.id ? <FaSpinner className="animate-spin" size={10} /> : <FaExchangeAlt size={10} />}
                                            انتقل
                                        </button>
                                    )}
                                    {!branch.is_current && (
                                        <button
                                            onClick={() => setConfirmDelete(branch)}
                                            className="p-1.5 rounded-lg text-red-400/50 hover:text-red-400 hover:bg-red-400/10 transition-all"
                                        >
                                            <FaTrash size={10} />
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Create Branch Modal */}
            <AnimatePresence>
                {showCreate && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-card-dark border border-[var(--border-subtle)] rounded-2xl w-full max-w-md overflow-hidden"
                        >
                            {/* Modal Header */}
                            <div className="p-5 border-b border-[var(--border-subtle)] flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-accent-lime flex items-center gap-2">
                                        <FaPlus size={12} /> إنشاء فرع جديد
                                    </h3>
                                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                                        سيرث الفرع نفس مدة اشتراك المنشأة الرئيسية
                                    </p>
                                </div>
                                <button onClick={() => setShowCreate(false)} className="text-[var(--color-text-muted)] hover:text-white transition-colors">
                                    <FaTimes />
                                </button>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleCreate} className="p-5 space-y-4">
                                <div>
                                    <label className="text-xs text-[var(--color-text-secondary)] mb-1.5 block font-medium">اسم الفرع *</label>
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={(e) => handleNameChange(e.target.value)}
                                        placeholder="مثال: صالون الشايب - عمان"
                                        className="w-full bg-card-dark border border-[var(--border-subtle)] rounded-xl px-3 py-2.5 text-sm focus:border-accent-lime outline-none placeholder:text-[var(--color-text-muted)] transition-colors"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-xs text-[var(--color-text-secondary)] mb-1.5 block font-medium">الرابط المخصص *</label>
                                    <div className="relative">
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--color-text-muted)]">maqas.site/book/</span>
                                        <input
                                            type="text"
                                            value={form.slug}
                                            onChange={(e) => setForm(f => ({ ...f, slug: slugify(e.target.value) }))}
                                            placeholder="branch-name"
                                            className="w-full bg-card-dark border border-[var(--border-subtle)] rounded-xl px-3 py-2.5 text-sm focus:border-accent-lime outline-none pl-3 text-left font-mono"
                                            dir="ltr"
                                            required
                                        />
                                    </div>
                                    <p className="text-[10px] text-[var(--color-text-muted)] mt-1">حروف إنجليزية صغيرة، أرقام، شرطات فقط</p>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs text-[var(--color-text-secondary)] mb-1.5 block font-medium">المدينة</label>
                                        <input
                                            type="text"
                                            value={form.city}
                                            onChange={(e) => setForm(f => ({ ...f, city: e.target.value }))}
                                            placeholder="عمان"
                                            className="w-full bg-card-dark border border-[var(--border-subtle)] rounded-xl px-3 py-2.5 text-sm focus:border-accent-lime outline-none transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-[var(--color-text-secondary)] mb-1.5 block font-medium">رقم الهاتف</label>
                                        <input
                                            type="tel"
                                            value={form.phone}
                                            onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                                            placeholder="07xxxxxxxx"
                                            className="w-full bg-card-dark border border-[var(--border-subtle)] rounded-xl px-3 py-2.5 text-sm focus:border-accent-lime outline-none transition-colors"
                                            dir="ltr"
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <div className="flex items-center gap-2 text-xs text-red-400 bg-red-400/10 px-3 py-2 rounded-xl">
                                        <FaExclamationTriangle size={10} /> {error}
                                    </div>
                                )}

                                <div className="flex gap-3 pt-1">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreate(false)}
                                        className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[#4A4A4A] transition-all"
                                    >
                                        إلغاء
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={creating || !form.name.trim() || !form.slug.trim()}
                                        className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-accent-lime text-black hover:bg-[#C3D809] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {creating ? <FaSpinner className="animate-spin" size={12} /> : <FaPlus size={12} />}
                                        {creating ? "جاري الإنشاء..." : "إنشاء الفرع"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Confirm Modal */}
            <AnimatePresence>
                {confirmDelete && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                            className="bg-card-dark border border-red-400/20 rounded-2xl w-full max-w-sm p-5 text-center"
                        >
                            <div className="w-12 h-12 rounded-full bg-red-400/10 flex items-center justify-center mx-auto mb-4">
                                <FaExclamationTriangle className="text-red-400 text-xl" />
                            </div>
                            <h3 className="font-bold text-white mb-2">إيقاف الفرع</h3>
                            <p className="text-sm text-[var(--color-text-muted)] mb-5">
                                هل تريد إيقاف فرع <strong className="text-white">{confirmDelete.name}</strong>؟<br/>
                                يمكن إعادة تفعيله لاحقاً من لوحة المشرف العام.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setConfirmDelete(null)}
                                    className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[#4A4A4A] transition-all"
                                >
                                    إلغاء
                                </button>
                                <button
                                    onClick={handleDeleteConfirm}
                                    disabled={deleting === confirmDelete.id}
                                    className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {deleting === confirmDelete.id ? <FaSpinner className="animate-spin" size={12} /> : null}
                                    إيقاف الفرع
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
