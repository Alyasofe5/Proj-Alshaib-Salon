"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { reportsAPI } from "@/lib/api";
import StatCard from "@/components/StatCard";
import { FaUsers, FaCoins, FaPercent, FaChartLine } from "react-icons/fa";
import { TrendingUp, BarChart3 } from "lucide-react";
import {
    BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

function ReportsContent() {
    const searchParams = useSearchParams();
    const period = searchParams.get("period") || "daily";

    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
    const [year, setYear] = useState(new Date().getFullYear().toString());

    useEffect(() => {
        setLoading(true);
        const params: Record<string, string> = { period };
        if (period === "daily") params.date = date;
        if (period === "monthly") params.month = month;
        if (period === "yearly") params.year = year;

        reportsAPI.employee(params)
            .then((res) => setData(res.data.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [period, date, month, year]);

    if (loading) return <div className="min-h-[400px] flex items-center justify-center"><div className="spinner" /></div>;
    if (!data) return null;

    const totalCustomers = data.stats?.customers || 0;
    const totalSales = data.stats?.income || 0;
    const commission = data.stats?.commission || 0;
    const commissionRate = data.employee?.commission_rate || 0;

    return (
        <>
            <div className="topbar">
                <div className="topbar-title"><TrendingUp size={18} className="inline ml-2 text-gold" /> تقاريري <span>الشخصية</span></div>
                <div className="flex gap-2">
                    <Link href="/employee/reports?period=daily"
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${period === "daily" ? "btn-gold" : "btn-outline-gold"}`}>يومي</Link>
                    <Link href="/employee/reports?period=monthly"
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${period === "monthly" ? "btn-gold" : "btn-outline-gold"}`}>شهري</Link>
                    <Link href="/employee/reports?period=yearly"
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${period === "yearly" ? "btn-gold" : "btn-outline-gold"}`}>سنوي</Link>
                </div>
            </div>

            <div className="content-area">
                {/* Date filter */}
                <div className="mb-4 flex items-center gap-3">
                    {period === "daily" && (
                        <><label className="text-gray-400">التاريخ:</label>
                            <input type="date" className="form-input w-[150px]" value={date}
                                onChange={(e) => setDate(e.target.value)} /></>
                    )}
                    {period === "monthly" && (
                        <><label className="text-gray-400">الشهر:</label>
                            <input type="month" className="form-input w-[150px]" value={month}
                                onChange={(e) => setMonth(e.target.value)} /></>
                    )}
                    {period === "yearly" && (
                        <><label className="text-gray-400">السنة:</label>
                            <select className="form-input w-[120px]" value={year}
                                onChange={(e) => setYear(e.target.value)}>
                                {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i).map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select></>
                    )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                    <StatCard icon={<FaUsers />} value={totalCustomers} label="عدد الزبائن" color="gold" />
                    <StatCard icon={<FaCoins />} value={Number(totalSales).toFixed(3)} label="مجموع المبيعات (د.أ)" color="green" />
                    <StatCard icon={<FaPercent />} value={Number(commission).toFixed(3)} label={`عمولتي (${commissionRate}%)`} color="blue" />
                    {period === "yearly" && data.avg_monthly !== undefined && (
                        <StatCard icon={<FaChartLine />} value={Number(data.avg_monthly).toFixed(3)} label="متوسط الدخل الشهري" color="purple" />
                    )}
                </div>

                {/* Daily — Transactions table */}
                {period === "daily" && data.transactions && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="custom-table">
                        <div className="p-4 border-b border-white/5">
                            <span className="text-gray-300 font-bold">تفاصيل العمليات</span>
                        </div>
                        <table>
                            <thead><tr><th>#</th><th>الخدمات</th><th>الملاحظات</th><th>المبلغ</th><th>الدفع</th><th>الوقت</th></tr></thead>
                            <tbody>
                                {data.transactions.map((tx: any, i: number) => (
                                    <tr key={tx.id}>
                                        <td className="text-gray-600">#{i + 1}</td>
                                        <td className="text-gray-300">{tx.services || "—"}</td>
                                        <td className="text-gray-500 text-sm">{tx.notes || "—"}</td>
                                        <td className="text-gold font-bold">{Number(tx.total_amount).toFixed(3)} د.أ</td>
                                        <td><span className="badge badge-green">{tx.payment_method === "cash" ? "نقداً" : "تحويل"}</span></td>
                                        <td className="text-gray-600 text-xs">{new Date(tx.created_at).toLocaleTimeString("ar-JO", { hour: "2-digit", minute: "2-digit" })}</td>
                                    </tr>
                                ))}
                                {data.transactions.length === 0 && <tr><td colSpan={6} className="text-center text-gray-600 py-8">لا توجد عمليات</td></tr>}
                            </tbody>
                        </table>
                    </motion.div>
                )}

                {/* Monthly — Chart + table */}
                {period === "monthly" && data.daily_breakdown && (
                    <>
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="chart-card mb-4">
                            <div className="chart-card-title"><BarChart3 size={16} className="inline ml-2 text-gold" /> مبيعاتي اليومية</div>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={data.daily_breakdown.filter((d: any) => d.cnt > 0)} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                    <XAxis dataKey="day" tick={{ fill: "#888", fontSize: 12 }} />
                                    <YAxis orientation="right" tick={{ fill: "#888", fontSize: 12 }} width={30} />
                                    <Tooltip contentStyle={{ background: "#3A3A3A", border: "1px solid #333", borderRadius: 8, direction: "rtl" }} />
                                    <Bar dataKey="total" fill="#E6B31E" radius={[6, 6, 0, 0]} name="المبيعات" cursor={false as unknown as undefined} />
                                </BarChart>
                            </ResponsiveContainer>
                        </motion.div>
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="custom-table">
                            <table>
                                <thead><tr><th>اليوم</th><th>الزبائن</th><th>المبيعات</th><th>العمولة</th></tr></thead>
                                <tbody>
                                    {data.daily_breakdown.filter((d: any) => d.cnt > 0).map((dd: any) => (
                                        <tr key={dd.day}>
                                            <td className="text-gray-400">{dd.day}</td>
                                            <td><span className="badge badge-blue">{dd.cnt}</span></td>
                                            <td className="text-gold">{Number(dd.total).toFixed(3)} د.أ</td>
                                            <td className="text-green-400">{(Number(dd.total) * commissionRate / 100).toFixed(3)} د.أ</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </motion.div>
                    </>
                )}

                {/* Yearly — Chart + table */}
                {period === "yearly" && data.monthly_breakdown && (
                    <>
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="chart-card mb-4">
                            <div className="chart-card-title"><BarChart3 size={16} className="inline ml-2 text-gold" /> مبيعاتي الشهرية - {year}</div>
                            <ResponsiveContainer width="100%" height={250}>
                                <LineChart data={data.monthly_breakdown} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                    <XAxis dataKey="month" tick={{ fill: "#888", fontSize: 12 }} />
                                    <YAxis orientation="right" tick={{ fill: "#888", fontSize: 12 }} width={30} />
                                    <Tooltip contentStyle={{ background: "#3A3A3A", border: "1px solid #333", borderRadius: 8, direction: "rtl" }} />
                                    <Line type="monotone" dataKey="total" stroke="#E6B31E" strokeWidth={2} dot={{ fill: "#E6B31E" }} name="المبيعات" />
                                </LineChart>
                            </ResponsiveContainer>
                        </motion.div>
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="custom-table">
                            <table>
                                <thead><tr><th>الشهر</th><th>الزبائن</th><th>المبيعات</th><th>العمولة</th></tr></thead>
                                <tbody>
                                    {data.monthly_breakdown.map((md: any, i: number) => (
                                        <tr key={i}>
                                            <td className="text-gray-400">{md.month}</td>
                                            <td><span className="badge badge-blue">{md.cnt}</span></td>
                                            <td className="text-gold">{Number(md.total).toFixed(3)} د.أ</td>
                                            <td className="text-green-400">{(Number(md.total) * commissionRate / 100).toFixed(3)} د.أ</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </motion.div>
                    </>
                )}
            </div>
        </>
    );
}

export default function EmployeeReportsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="spinner" /></div>}>
            <ReportsContent />
        </Suspense>
    );
}
