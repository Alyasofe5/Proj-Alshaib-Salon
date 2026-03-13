"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { dashboardAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import StatCard from "@/components/StatCard";
import {
    Users,
    Banknote,
    TrendingUp,
    TrendingDown,
    Receipt,
    Trophy,
    CalendarDays,
    ChevronLeft,
    Palette,
    BarChart3,
    UserCheck,
    ArrowUpRight,
    Minus,
    Wallet,
    Bell,
    X,
    AlarmClock,
} from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

interface DashboardData {
    today: { customers: number; income: number };
    month: { customers: number; income: number; expenses: number; net_profit: number };
    best_employee: { name: string; cnt: number; total: number } | null;
    employees_today: Array<{
        name: string;
        cnt: number;
        total: number;
        commission_rate: number;
        salary_type: string;
    }>;
    chart: { labels: string[]; data: number[] };
    last_transactions: Array<{
        id: number;
        emp_name: string;
        total_amount: number;
        payment_method: string;
        created_at: string;
    }>;
    salon?: { name: string; days_left: number | null };
}

export default function DashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [warnDismissed, setWarnDismissed] = useState(false);
    const { salon } = useAuthStore();

    useEffect(() => {
        dashboardAPI
            .getStats()
            .then((res) => setData(res.data.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="spinner" />
            </div>
        );
    }

    if (!data) return null;

    const chartData = data.chart.labels.map((label, i) => ({
        day: label,
        income: data.chart.data[i],
    }));

    const isProfit = data.month.net_profit >= 0;

    // Subscription warning
    const daysLeft = data.salon?.days_left ?? salon?.days_left ?? null;
    const showWarning = !warnDismissed && daysLeft !== null && daysLeft <= 7;
    const isUrgent = daysLeft !== null && daysLeft <= 2;

    return (
        <>
            {/* ========== Subscription Expiry Warning ========== */}
            {showWarning && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="mx-4 mt-3 mb-0 rounded-2xl px-5 py-4 flex items-center justify-between gap-4"
                    style={{
                        background: isUrgent ? "rgba(231,76,60,.12)" : "rgba(251,191,36,.08)",
                        border: `1px solid ${isUrgent ? "rgba(231,76,60,.3)" : "rgba(251,191,36,.25)"}`,
                    }}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: isUrgent ? "rgba(231,76,60,.15)" : "rgba(251,191,36,.12)" }}>
                            <AlarmClock size={20} color={isUrgent ? "#e74c3c" : "#fbbf24"} />
                        </div>
                        <div>
                            <p className="font-bold text-sm" style={{ color: isUrgent ? "#e74c3c" : "#fbbf24" }}>
                                {daysLeft === 0 ? "اشتراكك ينتهي اليوم!" : `متبقي على انتهاء اشتراكك ${daysLeft} ${daysLeft === 1 ? "يوم" : "أيام"}`}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                                سارع لتجديد اشتراكك لضمان استمرارية خدماتك بدون انقطاع
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <a
                            href={`https://wa.me/962781717990?text=${encodeURIComponent(`مرحبا، أريد تجديد اشتراك صالون ${salon?.name || ""}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105"
                            style={{ background: isUrgent ? "rgba(231,76,60,.2)" : "rgba(251,191,36,.15)", color: isUrgent ? "#e74c3c" : "#fbbf24" }}
                        >
                            <Bell size={13} />
                            جدد الاشتراك
                        </a>
                        <button onClick={() => setWarnDismissed(true)} className="text-gray-600 hover:text-gray-400 transition-colors">
                            <X size={16} />
                        </button>
                    </div>
                </motion.div>
            )}

            <div className="topbar">
                <div>
                    <div className="topbar-title">
                        لوحة <span>التحكم</span>
                    </div>
                    <div className="topbar-date">
                        <CalendarDays size={12} style={{ display: "inline", marginLeft: "5px", verticalAlign: "middle" }} />
                        {new Date().toLocaleDateString("ar-JO", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                        })}
                    </div>
                </div>
            </div>


            <div className="content-area">
                {/* ===== Stat Cards ===== */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    <StatCard
                        icon={<Users size={18} />}
                        value={data.today.customers}
                        label="زبائن اليوم"
                        color="gold"
                    />
                    <StatCard
                        icon={<Banknote size={18} />}
                        value={data.today.income.toFixed(3)}
                        label="دخل اليوم (د.أ)"
                        color="green"
                    />
                    <StatCard
                        icon={<Receipt size={18} />}
                        value={data.month.income.toFixed(3)}
                        label="مبيعات الشهر (د.أ)"
                        sub={`${data.month.customers} زبون`}
                        color="blue"
                    />
                    <StatCard
                        icon={isProfit ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                        value={data.month.net_profit.toFixed(3)}
                        label="صافي ربح الشهر"
                        sub={isProfit ? "ربح" : "خسارة"}
                        color={isProfit ? "green" : "red"}
                    />
                </div>



                {/* ===== Booking Settings Card ===== */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="chart-card mb-6 cursor-pointer hover:border-[#c8a96e]/30 transition-all"
                    onClick={() => window.location.href = "/admin/booking-settings"}
                    style={{ border: "1px solid rgba(255,255,255,.06)" }}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(200,169,110,.15)" }}>
                                <Palette size={18} color="#c8a96e" />
                            </div>
                            <div>
                                <p className="text-white font-bold text-sm">تخصيص صفحة الحجز</p>
                                <p className="text-gray-500 text-xs mt-0.5">تعديل معلومات الصالون، صور الخدمات، وصورة الخلفية</p>
                            </div>
                        </div>
                        <ChevronLeft size={16} color="#c8a96e" />
                    </div>
                </motion.div>

                {/* ===== Chart + Best Employee ===== */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {/* Chart */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="md:col-span-2 chart-card"
                    >
                        <div className="chart-card-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <BarChart3 size={16} color="#C9A84C" />
                            مبيعات <span>آخر 7 أيام</span>
                        </div>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                <XAxis dataKey="day" tick={{ fill: "#888", fontSize: 12 }} />
                                <YAxis tick={{ fill: "#888", fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{
                                        background: "#1a1a1a",
                                        border: "1px solid #333",
                                        borderRadius: 8,
                                        direction: "rtl",
                                    }}
                                    formatter={(value) => [
                                        `${Number(value).toFixed(3)} د.أ`,
                                        "المبيعات",
                                    ]}
                                />
                                <Bar
                                    dataKey="income"
                                    fill="#C9A84C"
                                    radius={[6, 6, 0, 0]}
                                    name="المبيعات"
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </motion.div>

                    {/* Best Employee */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="chart-card flex flex-col justify-center items-center text-center"
                    >
                        <div className="chart-card-title w-full" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <Trophy size={16} color="#C9A84C" />
                            أفضل <span>موظف اليوم</span>
                        </div>

                        {data.best_employee ? (
                            <>
                                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3"
                                    style={{ background: "linear-gradient(135deg, var(--gold), var(--gold-light))" }}>
                                    <Trophy size={28} color="#000" />
                                </div>
                                <div className="text-lg font-bold text-white">
                                    {data.best_employee.name}
                                </div>
                                <div className="text-gold font-bold text-xl mt-1">
                                    {Number(data.best_employee.total).toFixed(3)} د.أ
                                </div>
                                <div className="text-gray-500 text-sm">
                                    {data.best_employee.cnt} زبون
                                </div>
                            </>
                        ) : (
                            <p className="text-gray-500 mt-6">لا توجد عمليات اليوم بعد</p>
                        )}

                        {/* معادلة الربح */}
                        <div className="mt-4 p-3 rounded-lg w-full" style={{ background: "rgba(255,255,255,0.03)" }}>
                            <div className="text-gray-500 text-xs mb-2 flex items-center justify-center gap-1">
                                <Wallet size={11} />
                                معادلة الربح (الشهر)
                            </div>
                            <div className="text-gray-300 text-sm flex items-center justify-between">
                                <span className="text-gray-500 flex items-center gap-1"><ArrowUpRight size={12} /> مبيعات</span>
                                <span>{data.month.income.toFixed(3)} د.أ</span>
                            </div>
                            <div className="text-red-400 text-sm flex items-center justify-between mt-1">
                                <span className="flex items-center gap-1"><Minus size={12} /> مصاريف</span>
                                <span>{data.month.expenses.toFixed(3)} د.أ</span>
                            </div>
                            <div className="border-t border-gray-700 my-1.5" />
                            <div className={`text-sm font-bold flex items-center justify-between ${isProfit ? "text-green-400" : "text-red-400"}`}>
                                <span className="flex items-center gap-1">
                                    {isProfit ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                    صافي
                                </span>
                                <span>{data.month.net_profit.toFixed(3)} د.أ</span>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* ===== Tables ===== */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Employees Today */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="custom-table"
                    >
                        <div className="p-4 border-b border-white/5" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <UserCheck size={15} color="#C9A84C" />
                            <span className="text-gray-300 font-bold text-sm">أداء الموظفين اليوم</span>
                        </div>
                        <table>
                            <thead>
                                <tr>
                                    <th>الموظف</th>
                                    <th>الزبائن</th>
                                    <th>المبيعات</th>
                                    <th>العمولة</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.employees_today.map((emp, i) => (
                                    <tr key={i}>
                                        <td className="text-white font-semibold">{emp.name}</td>
                                        <td>
                                            <span className="badge badge-blue">{emp.cnt}</span>
                                        </td>
                                        <td className="text-gold font-bold">
                                            {Number(emp.total).toFixed(3)} د.أ
                                        </td>
                                        <td className="text-green-400">
                                            {emp.salary_type === "commission"
                                                ? `${(Number(emp.total) * emp.commission_rate / 100).toFixed(3)} د.أ`
                                                : <span className="text-gray-500">ثابت</span>
                                            }
                                        </td>
                                    </tr>
                                ))}
                                {data.employees_today.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="text-center text-gray-600 py-8">
                                            لا توجد عمليات اليوم
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </motion.div>

                    {/* Last Transactions */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="custom-table"
                    >
                        <div className="p-4 border-b border-white/5" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <Receipt size={15} color="#C9A84C" />
                            <span className="text-gray-300 font-bold text-sm">آخر العمليات</span>
                        </div>
                        <table>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>الموظف</th>
                                    <th>المبلغ</th>
                                    <th>الدفع</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.last_transactions.map((tx, i) => (
                                    <tr key={tx.id}>
                                        <td className="text-gray-600">#{i + 1}</td>
                                        <td>{tx.emp_name}</td>
                                        <td className="text-gold font-bold">
                                            {Number(tx.total_amount).toFixed(3)} د.أ
                                        </td>
                                        <td>
                                            <span className="badge badge-green">
                                                {tx.payment_method === "cash" ? "نقداً" : "تحويل"}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {data.last_transactions.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="text-center text-gray-600 py-8">
                                            لا توجد عمليات
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </motion.div>
                </div>
            </div>
        </>
    );
}
