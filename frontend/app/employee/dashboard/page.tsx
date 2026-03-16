"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { reportsAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import StatCard from "@/components/StatCard";
import BookingCalendar from "@/components/BookingCalendar";
import { FaUsers, FaCoins, FaPercent, FaCalendarAlt, FaPlusCircle } from "react-icons/fa";
import { ReceiptText } from "lucide-react";

interface EmpDashData {
    employee: { name: string; commission_rate: number };
    stats: { customers: number; income: number; commission: number };
    transactions: Array<{
        id: number;
        services: string;
        notes: string;
        total_amount: number;
        payment_method: string;
        created_at: string;
    }>;
}

export default function EmployeeDashboard() {
    // user data is fetched from API
    const [data, setData] = useState<EmpDashData | null>(null);
    const [monthCommission, setMonthCommission] = useState(0);
    const [monthCustomers, setMonthCustomers] = useState(0);
    const [loading, setLoading] = useState(true);
    const { salon } = useAuthStore();

    useEffect(() => {
        Promise.all([
            reportsAPI.employee({ period: "daily" }),
            reportsAPI.employee({ period: "monthly" }),
        ]).then(([daily, monthly]) => {
            setData(daily.data.data);
            setMonthCommission(monthly.data.data.stats.commission);
            setMonthCustomers(monthly.data.data.stats.customers);
        }).catch(console.error).finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="spinner" /></div>;
    if (!data) return null;

    return (
        <>
            <div className="topbar">
                <div>
                    <div className="topbar-title">أهلاً، <span>{data.employee.name}</span> 👋</div>
                    <div className="topbar-date"><FaCalendarAlt className="inline ml-1" /> {new Date().toLocaleDateString("ar-JO", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>
                </div>
                <Link href="/employee/new-customer" className="btn-gold flex items-center gap-2"><FaPlusCircle /> تسجيل زبون جديد</Link>
            </div>

            <div className="content-area">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    <StatCard icon={<FaUsers />} value={data.stats.customers} label="زبائن اليوم" color="gold" />
                    <StatCard icon={<FaCoins />} value={data.stats.income.toFixed(3)} label="مبيعات اليوم (د.أ)" color="green" />
                    <StatCard icon={<FaPercent />} value={data.stats.commission.toFixed(3)} label="عمولتي اليوم (د.أ)" sub={`${data.employee.commission_rate}% عمولة`} color="blue" />
                    <StatCard icon={<FaCalendarAlt />} value={monthCommission.toFixed(3)} label="عمولة الشهر (د.أ)" sub={`${monthCustomers} زبون هذا الشهر`} color="purple" />
                </div>

                {/* Big CTA */}
                <div className="text-center mb-6">
                    <Link href="/employee/new-customer" className="inline-flex items-center gap-3 px-10 py-5 rounded-xl text-black font-extrabold text-lg transition-all hover:-translate-y-1" style={{ background: "linear-gradient(135deg, var(--gold), var(--gold-light))", boxShadow: "0 8px 30px rgba(230,179,30,0.4)" }}>
                        <FaPlusCircle size={24} /> تسجيل زبون جديد
                    </Link>
                </div>

                {/* Today Transactions */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="custom-table">
                    <div className="p-4 border-b border-white/5 flex justify-between"><span className="text-gray-300 font-bold flex items-center gap-2"><ReceiptText size={15} /> عملياتي اليوم</span></div>
                    <table>
                        <thead><tr><th>#</th><th>الخدمات</th><th>الملاحظات</th><th>المبلغ</th><th>الدفع</th><th>الوقت</th></tr></thead>
                        <tbody>
                            {data.transactions.map((tx, i) => (
                                <tr key={tx.id}>
                                    <td className="text-gray-600">#{i + 1}</td>
                                    <td className="text-gray-300">{tx.services || "-"}</td>
                                    <td className="text-gray-500 text-sm">{tx.notes || "-"}</td>
                                    <td className="text-gold font-bold">{Number(tx.total_amount).toFixed(3)} د.أ</td>
                                    <td><span className="badge badge-green">{tx.payment_method === "cash" ? "نقداً" : "تحويل"}</span></td>
                                    <td className="text-gray-600 text-xs">{new Date(tx.created_at).toLocaleTimeString("ar-JO", { hour: "2-digit", minute: "2-digit" })}</td>
                                </tr>
                            ))}
                            {data.transactions.length === 0 && <tr><td colSpan={6} className="text-center text-gray-600 py-8">لا توجد عمليات اليوم بعد</td></tr>}
                        </tbody>
                    </table>
                </motion.div>

                {/* Booking Calendar — Pro/Enterprise only */}
                {salon?.features?.has_booking_page && ['professional', 'enterprise'].includes(salon?.plan_type || '') && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="chart-card mt-6">
                        <BookingCalendar role="employee" />
                    </motion.div>
                )}
            </div>
        </>
    );
}
