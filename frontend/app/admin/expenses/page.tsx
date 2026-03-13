"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { expensesAPI } from "@/lib/api";
import Modal from "@/components/Modal";
import StatCard from "@/components/StatCard";
import { FaPlus, FaTrash, FaArrowTrendUp, FaArrowTrendDown, FaCoins, FaPercent } from "react-icons/fa6";
import { TrendingUp, Layers, ClipboardList, BarChart2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface Expense {
    id: number;
    title: string;
    amount: number;
    type: string;
    notes: string;
    created_at: string;
}

interface Summary {
    total_income: number;
    total_expenses: number;
    net_profit: number;
    transactions_count: number;
}

const typeLabels: Record<string, string> = {
    rent: "إيجار", salary: "رواتب", supplies: "مستلزمات",
    utilities: "خدمات", other: "أخرى",
};

export default function ExpensesPage() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [byType, setByType] = useState<Record<string, number>>({});
    const [chartData, setChartData] = useState<Array<{ month: string; income: number; expenses: number }>>([]);
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [flash, setFlash] = useState<{ type: string; msg: string } | null>(null);
    const [form, setForm] = useState({ title: "", amount: 0, type: "rent", notes: "" });

    const fetchData = async () => {
        try {
            const res = await expensesAPI.getAll({ month });
            const d = res.data.data;
            setExpenses(d.expenses);
            setSummary(d.summary);
            setByType(d.by_type);
            setChartData(
                d.chart.months.map((m: string, i: number) => ({
                    month: m, income: d.chart.income[i], expenses: d.chart.expenses[i],
                }))
            );
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { setLoading(true); fetchData(); }, [month]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await expensesAPI.create(form);
            setFlash({ type: "success", msg: "تم إضافة المصروف بنجاح" });
            setShowModal(false);
            fetchData();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            setFlash({ type: "error", msg: error.response?.data?.message || "حدث خطأ" });
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("حذف هذا المصروف؟")) return;
        try {
            await expensesAPI.delete(id);
            setFlash({ type: "success", msg: "تم حذف المصروف" });
            fetchData();
        } catch (e) { console.error(e); }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="spinner" /></div>;

    const isProfit = (summary?.net_profit ?? 0) >= 0;

    return (
        <>
            <div className="topbar">
                <div className="topbar-title"><BarChart2 size={18} className="inline ml-2 text-gold" /> المالية <span>والمصاريف</span></div>
                <div className="flex gap-2 items-center">
                    <input type="month" className="form-input" style={{ width: 160 }} value={month} onChange={e => setMonth(e.target.value)} />
                    <button className="btn-gold flex items-center gap-2" onClick={() => { setForm({ title: "", amount: 0, type: "rent", notes: "" }); setShowModal(true); }}>
                        <FaPlus /> إضافة مصروف
                    </button>
                </div>
            </div>

            <div className="content-area">
                {flash && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={flash.type === "success" ? "flash-success" : "flash-error"}>{flash.msg}</motion.div>}

                {/* Stat Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    <StatCard icon={<FaArrowTrendUp />} value={summary?.total_income?.toFixed(3) || "0"} label="إجمالي الدخل (د.أ)" sub={`${summary?.transactions_count || 0} عملية`} color="green" />
                    <StatCard icon={<FaArrowTrendDown />} value={summary?.total_expenses?.toFixed(3) || "0"} label="إجمالي المصاريف (د.أ)" sub={`${expenses.length} بند`} color="red" />
                    <StatCard icon={<FaCoins />} value={Math.abs(summary?.net_profit ?? 0).toFixed(3)} label={`صافي ${isProfit ? "الربح" : "الخسارة"} (د.أ)`} sub={isProfit ? "✅ ربح" : "❌ خسارة"} color={isProfit ? "gold" : "red"} />
                    <StatCard icon={<FaPercent />} value={`${summary?.total_income ? Math.abs(Math.round(((summary?.net_profit ?? 0) / summary.total_income) * 100)) : 0}%`} label={`هامش ${isProfit ? "الربح" : "الخسارة"}`} sub="من إجمالي الدخل" color={isProfit ? "green" : "red"} />
                </div>

                {/* Chart + By Type */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="md:col-span-2 chart-card">
                        <div className="chart-card-title"><TrendingUp size={16} className="inline ml-2" /> مقارنة <span>آخر 6 أشهر</span></div>
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                <XAxis dataKey="month" tick={{ fill: "#888", fontSize: 12 }} />
                                <YAxis tick={{ fill: "#888", fontSize: 12 }} />
                                <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 8, direction: "rtl" }} />
                                <Bar dataKey="income" fill="rgba(46,204,113,0.7)" name="الدخل" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="expenses" fill="rgba(231,76,60,0.7)" name="المصاريف" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="chart-card">
                        <div className="chart-card-title"><Layers size={16} className="inline ml-2" /> <span>تفصيل المصاريف</span></div>
                        {Object.keys(byType).length === 0 ?
                            <p className="text-gray-600 text-center mt-8">لا توجد مصاريف</p> :
                            Object.entries(byType).map(([type, amount]) => {
                                const pct = (summary?.total_expenses ?? 0) > 0 ? Math.round((amount / summary!.total_expenses) * 100) : 0;
                                return (
                                    <div key={type} className="mb-3">
                                        <div className="flex justify-between mb-1">
                                            <span className="text-sm text-gray-400">{typeLabels[type] || type}</span>
                                            <span className="text-sm text-gold font-bold">{amount.toFixed(3)} د.أ</span>
                                        </div>
                                        <div className="h-2 bg-dark-1 rounded"><div className="h-full bg-red-500 rounded" style={{ width: `${pct}%` }} /></div>
                                        <span className="text-xs text-gray-600">{pct}%</span>
                                    </div>
                                );
                            })}
                    </div>
                </div>

                {/* Expenses Table */}
                <div className="custom-table">
                    <div className="p-4 border-b border-white/5 flex justify-between items-center">
                        <span className="text-gray-300 font-bold text-sm flex items-center gap-2"><ClipboardList size={15} /> تفاصيل المصاريف</span>
                        <span className="text-red-500 text-sm font-bold">{summary?.total_expenses?.toFixed(3) || "0"} د.أ</span>
                    </div>
                    <table>
                        <thead><tr><th>#</th><th>العنوان</th><th>النوع</th><th>المبلغ</th><th>الملاحظات</th><th>التاريخ</th><th>حذف</th></tr></thead>
                        <tbody>
                            {expenses.map((exp, i) => (
                                <tr key={exp.id}>
                                    <td className="text-gray-600">{i + 1}</td>
                                    <td className="text-white font-semibold">{exp.title}</td>
                                    <td><span className="badge badge-gold">{typeLabels[exp.type] || exp.type}</span></td>
                                    <td className="text-red-500 font-bold">{Number(exp.amount).toFixed(3)} د.أ</td>
                                    <td className="text-gray-500 text-sm">{exp.notes || "-"}</td>
                                    <td className="text-gray-600 text-xs">{new Date(exp.created_at).toLocaleDateString("ar-JO")}</td>
                                    <td>
                                        <button onClick={() => handleDelete(exp.id)} className="p-2 rounded-lg" style={{ background: "rgba(231,76,60,0.15)", border: "1px solid rgba(231,76,60,0.3)", color: "#e74c3c" }}>
                                            <FaTrash size={12} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {expenses.length === 0 && <tr><td colSpan={7} className="text-center text-gray-600 py-8">لا توجد مصاريف لهذا الشهر</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Modal */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="إضافة مصروف جديد" icon={<FaPlus />}
                footer={<><button className="btn-gold" onClick={handleSubmit}>حفظ</button><button className="btn-outline-gold" onClick={() => setShowModal(false)}>إلغاء</button></>}>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4"><label className="form-label">عنوان المصروف *</label><input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required placeholder="مثال: إيجار المحل" /></div>
                    <div className="mb-4"><label className="form-label">المبلغ (د.أ) *</label><input type="number" className="form-input" value={form.amount} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} min={0} step={0.001} required /></div>
                    <div className="mb-4">
                        <label className="form-label">النوع</label>
                        <select className="form-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                            <option value="rent">إيجار</option><option value="salary">رواتب</option><option value="supplies">مستلزمات</option>
                            <option value="utilities">خدمات (كهرباء/ماء)</option><option value="other">أخرى</option>
                        </select>
                    </div>
                    <div className="mb-4"><label className="form-label">ملاحظات</label><textarea className="form-input" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="اختياري..." /></div>
                </form>
            </Modal>
        </>
    );
}
