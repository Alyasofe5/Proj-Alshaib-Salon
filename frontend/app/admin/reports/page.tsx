"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { reportsAPI } from "@/lib/api";
import StatCard from "@/components/StatCard";
import {
    Users, Banknote, Receipt, TrendingUp, TrendingDown,
    UserCheck, BarChart3, CalendarDays
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

type Period = "daily" | "monthly" | "yearly";

export default function ReportsPage() {
    const [period, setPeriod] = useState<Period>("daily");
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
    const [year, setYear] = useState(new Date().getFullYear().toString());
    const [data, setData] = useState<Record<string, unknown> | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchReport = async () => {
        setLoading(true);
        try {
            let res;
            if (period === "daily") res = await reportsAPI.daily({ date });
            else if (period === "monthly") res = await reportsAPI.monthly({ month });
            else res = await reportsAPI.yearly({ year });
            setData(res.data.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchReport(); }, [period, date, month, year]);

    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="spinner" /></div>;

    return (
        <>
            {/* ===== Topbar ===== */}
            <div className="topbar">
                <div className="topbar-title">
                    <BarChart3 size={18} style={{ display: "inline", marginLeft: "8px", color: "var(--gold)", verticalAlign: "middle" }} />
                    <span>التقارير الشاملة</span>
                </div>
                <div className="flex gap-2">
                    {(["daily", "monthly", "yearly"] as Period[]).map((p) => (
                        <button
                            key={p}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${period === p ? "btn-gold" : "btn-outline-gold"}`}
                            onClick={() => setPeriod(p)}
                        >
                            {p === "daily" ? "يومي" : p === "monthly" ? "شهري" : "سنوي"}
                        </button>
                    ))}
                </div>
            </div>

            <div className="content-area">
                {/* ===== Date Picker ===== */}
                <div className="mb-6 flex items-center gap-3">
                    <label className="text-gray-500 flex items-center gap-1 text-sm">
                        <CalendarDays size={14} />
                        {period === "daily" ? "اختر التاريخ:" : period === "monthly" ? "اختر الشهر:" : "اختر السنة:"}
                    </label>
                    {period === "daily" && (
                        <input type="date" className="form-input" style={{ width: 200 }} value={date} onChange={e => setDate(e.target.value)} />
                    )}
                    {period === "monthly" && (
                        <input type="month" className="form-input" style={{ width: 200 }} value={month} onChange={e => setMonth(e.target.value)} />
                    )}
                    {period === "yearly" && (
                        <select className="form-input" style={{ width: 140 }} value={year} onChange={e => setYear(e.target.value)}>
                            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    )}
                </div>

                {/* ===== Daily Report ===== */}
                {period === "daily" && data && (
                    <>
                        <div className="grid grid-cols-3 gap-3 mb-6">
                            <StatCard icon={<Users size={18} />} value={(data as { total_customers: number }).total_customers} label="زبائن اليوم" color="gold" />
                            <StatCard icon={<Banknote size={18} />} value={Number((data as { total_income: number }).total_income).toFixed(3)} label="دخل اليوم (د.أ)" color="green" />
                            <StatCard icon={<UserCheck size={18} />} value={((data as { employee_stats: unknown[] }).employee_stats || []).length} label="موظفون عملوا" color="blue" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="custom-table">
                                <div className="p-4 border-b border-white/5 flex items-center gap-2">
                                    <UserCheck size={14} color="var(--gold)" />
                                    <span className="text-gray-300 font-bold">أداء الموظفين</span>
                                </div>
                                <table>
                                    <thead><tr><th>الموظف</th><th>الزبائن</th><th>المبيعات</th><th>العمولة</th></tr></thead>
                                    <tbody>
                                        {((data as { employee_stats: Array<{ name: string; cnt: number; total: number; salary_type: string; commission_rate: number }> }).employee_stats || []).map((e, i) => (
                                            <tr key={i}>
                                                <td>{e.name}</td>
                                                <td><span className="badge badge-blue">{e.cnt}</span></td>
                                                <td className="text-gold font-bold">{Number(e.total).toFixed(3)} د.أ</td>
                                                <td className="text-green-500">{e.salary_type === "commission" ? `${(Number(e.total) * e.commission_rate / 100).toFixed(3)} د.أ` : <span className="text-gray-600">ثابت</span>}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </motion.div>
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="custom-table">
                                <div className="p-4 border-b border-white/5 flex items-center gap-2">
                                    <Receipt size={14} color="var(--gold)" />
                                    <span className="text-gray-300 font-bold">تفاصيل العمليات</span>
                                </div>
                                <table>
                                    <thead><tr><th>#</th><th>الموظف</th><th>المبلغ</th><th>الدفع</th><th>الوقت</th></tr></thead>
                                    <tbody>
                                        {((data as { transactions: Array<{ id: number; emp_name: string; total_amount: number; payment_method: string; created_at: string }> }).transactions || []).map((tx, i) => (
                                            <tr key={tx.id}>
                                                <td className="text-gray-600">#{i + 1}</td>
                                                <td>{tx.emp_name}</td>
                                                <td className="text-gold font-bold">{Number(tx.total_amount).toFixed(3)} د.أ</td>
                                                <td><span className="badge badge-green">{tx.payment_method === "cash" ? "نقداً" : "تحويل"}</span></td>
                                                <td className="text-gray-600 text-xs">{new Date(tx.created_at).toLocaleTimeString("ar-JO", { hour: "2-digit", minute: "2-digit" })}</td>
                                            </tr>
                                        ))}
                                        {((data as { transactions: unknown[] }).transactions || []).length === 0 && <tr><td colSpan={5} className="text-center text-gray-600 py-6">لا توجد عمليات</td></tr>}
                                    </tbody>
                                </table>
                            </motion.div>
                        </div>
                    </>
                )}

                {/* ===== Monthly Report ===== */}
                {period === "monthly" && data && (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                            <StatCard icon={<Users size={18} />} value={(data as { total_customers: number }).total_customers} label="إجمالي الزبائن" color="blue" />
                            <StatCard icon={<Banknote size={18} />} value={Number((data as { total_sales: number }).total_sales).toFixed(3)} label="إجمالي المبيعات" color="gold" />
                            <StatCard icon={<Receipt size={18} />} value={Number((data as { total_expenses: number }).total_expenses).toFixed(3)} label="إجمالي المصاريف" color="red" />
                            <StatCard
                                icon={Number((data as { net_profit: number }).net_profit) >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                                value={Math.abs(Number((data as { net_profit: number }).net_profit)).toFixed(3)}
                                label="صافي الربح"
                                color={Number((data as { net_profit: number }).net_profit) >= 0 ? "green" : "red"}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2 chart-card">
                                <div className="chart-card-title flex items-center gap-2">
                                    <BarChart3 size={15} color="var(--gold)" /> المبيعات <span>اليومية</span>
                                </div>
                                <ResponsiveContainer width="100%" height={220}>
                                    <LineChart data={((data as { chart: { labels: number[]; data: number[] } }).chart?.labels || []).map((d: number, i: number) => ({ day: d, sales: ((data as { chart: { data: number[] } }).chart?.data || [])[i] }))} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                        <XAxis dataKey="day" tick={{ fill: "#888", fontSize: 11 }} />
                                        <YAxis orientation="right" tick={{ fill: "#888", fontSize: 11 }} width={30} />
                                        <Tooltip contentStyle={{ background: "#3A3A3A", border: "1px solid #333", borderRadius: 8 }} />
                                        <Line type="monotone" dataKey="sales" stroke="#E6B31E" strokeWidth={2} dot={{ fill: "#E6B31E", r: 3 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="custom-table">
                                <div className="p-4 border-b border-white/5 flex items-center gap-2">
                                    <UserCheck size={14} color="var(--gold)" />
                                    <span className="text-gray-300 font-bold">أداء الموظفين</span>
                                </div>
                                <table>
                                    <thead><tr><th>الموظف</th><th>المبيعات</th><th>العمولة</th></tr></thead>
                                    <tbody>
                                        {((data as { employee_stats: Array<{ name: string; total: number; salary_type: string; commission_rate: number }> }).employee_stats || []).map((e, i) => (
                                            <tr key={i}>
                                                <td>{e.name}</td>
                                                <td className="text-gold font-bold">{Number(e.total).toFixed(3)} د.أ</td>
                                                <td className="text-green-500">{e.salary_type === "commission" ? `${(Number(e.total) * e.commission_rate / 100).toFixed(3)} د.أ` : <span className="text-gray-600">ثابت</span>}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        {/* Monthly Transactions Table */}
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="custom-table mt-4">
                            <div className="p-4 border-b border-white/5 flex items-center gap-2">
                                <Receipt size={14} color="var(--gold)" />
                                <span className="text-gray-300 font-bold">تفاصيل العمليات</span>
                            </div>
                            <table>
                                <thead><tr><th>#</th><th>الموظف</th><th>المبلغ</th><th>الدفع</th><th>التاريخ</th></tr></thead>
                                <tbody>
                                    {((data as { transactions: Array<{ id: number; emp_name: string; total_amount: number; payment_method: string; created_at: string }> }).transactions || []).map((tx, i) => (
                                        <tr key={tx.id}>
                                            <td className="text-gray-600">#{i + 1}</td>
                                            <td>{tx.emp_name}</td>
                                            <td className="text-gold font-bold">{Number(tx.total_amount).toFixed(3)} د.أ</td>
                                            <td><span className="badge badge-green">{tx.payment_method === "cash" ? "نقداً" : "تحويل"}</span></td>
                                            <td className="text-gray-600 text-xs">{new Date(tx.created_at).toLocaleDateString("ar-JO", { day: "numeric", month: "short" })} {new Date(tx.created_at).toLocaleTimeString("ar-JO", { hour: "2-digit", minute: "2-digit" })}</td>
                                        </tr>
                                    ))}
                                    {((data as { transactions: unknown[] }).transactions || []).length === 0 && <tr><td colSpan={5} className="text-center text-gray-600 py-6">لا توجد عمليات</td></tr>}
                                </tbody>
                            </table>
                        </motion.div>
                    </>
                )}

                {/* ===== Yearly Report ===== */}
                {period === "yearly" && data && (
                    <>
                        {/* Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                            <StatCard icon={<Users size={18} />} value={(data as { total_customers: number }).total_customers} label="إجمالي الزبائن" color="blue" />
                            <StatCard icon={<Banknote size={18} />} value={Number((data as { total_sales: number }).total_sales).toFixed(3)} label="إجمالي المبيعات (د.أ)" color="gold" />
                            <StatCard icon={<Receipt size={18} />} value={Number((data as { total_expenses: number }).total_expenses).toFixed(3)} label="إجمالي المصاريف (د.أ)" color="red" />
                            <StatCard
                                icon={Number((data as { net_profit: number }).net_profit) >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                                value={Math.abs(Number((data as { net_profit: number }).net_profit)).toFixed(3)}
                                label={`صافي ${Number((data as { net_profit: number }).net_profit) >= 0 ? "الربح" : "الخسارة"} (د.أ)`}
                                color={Number((data as { net_profit: number }).net_profit) >= 0 ? "green" : "red"}
                            />
                        </div>

                        {/* Chart - Monthly Breakdown */}
                        <div className="chart-card mb-6">
                            <div className="chart-card-title flex items-center gap-2">
                                <BarChart3 size={15} color="var(--gold)" />
                                المبيعات والمصاريف <span>الشهرية ({year})</span>
                            </div>
                            <ResponsiveContainer width="100%" height={260}>
                                <BarChart
                                    data={((data as { chart: { labels: string[]; sales: number[]; expenses: number[] } }).chart?.labels || []).map((label: string, i: number) => ({
                                        month: label,
                                        sales: ((data as { chart: { sales: number[] } }).chart?.sales || [])[i],
                                        expenses: ((data as { chart: { expenses: number[] } }).chart?.expenses || [])[i],
                                    }))}
                                    barGap={4}
                                    margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                    <XAxis dataKey="month" tick={{ fill: "#888", fontSize: 11 }} />
                                    <YAxis orientation="right" tick={{ fill: "#888", fontSize: 11 }} width={30} />
                                    <Tooltip contentStyle={{ background: "#3A3A3A", border: "1px solid #333", borderRadius: 8, direction: "rtl" }}
                                        formatter={(value, name) => [`${Number(value).toFixed(3)} د.أ`, name === "sales" ? "المبيعات" : "المصاريف"]}
                                    />
                                    <Legend formatter={(v) => v === "sales" ? "المبيعات" : "المصاريف"} wrapperStyle={{ color: "#888", fontSize: 12 }} />
                                    <Bar dataKey="sales" fill="#E6B31E" radius={[4, 4, 0, 0]} name="sales" />
                                    <Bar dataKey="expenses" fill="rgba(231,76,60,0.7)" radius={[4, 4, 0, 0]} name="expenses" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Employee Stats */}
                        <div className="custom-table">
                            <div className="p-4 border-b border-white/5 flex items-center gap-2">
                                <UserCheck size={15} color="var(--gold)" />
                                <span className="text-gray-300 font-bold">أداء الموظفين سنة {year}</span>
                            </div>
                            <table>
                                <thead><tr><th>الموظف</th><th>العمليات</th><th>المبيعات</th><th>العمولة</th></tr></thead>
                                <tbody>
                                    {((data as { employee_stats: Array<{ name: string; cnt: number; total: number; salary_type: string; commission_rate: number }> }).employee_stats || []).map((e, i) => (
                                        <tr key={i}>
                                            <td className="font-semibold text-white">{e.name}</td>
                                            <td><span className="badge badge-blue">{e.cnt}</span></td>
                                            <td className="text-gold font-bold">{Number(e.total).toFixed(3)} د.أ</td>
                                            <td className="text-green-500">{e.salary_type === "commission" ? `${(Number(e.total) * e.commission_rate / 100).toFixed(3)} د.أ` : <span className="text-gray-600">ثابت</span>}</td>
                                        </tr>
                                    ))}
                                    {((data as { employee_stats: unknown[] }).employee_stats || []).length === 0 && (
                                        <tr><td colSpan={4} className="text-center text-gray-600 py-8">لا توجد بيانات لهذا العام</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}
