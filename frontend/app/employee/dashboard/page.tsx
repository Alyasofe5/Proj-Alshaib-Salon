"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { reportsAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import StatCard from "@/components/StatCard";

import { FaUsers, FaCoins, FaPercent, FaCalendarAlt, FaPlusCircle, FaCalendarTimes, FaExclamationTriangle, FaTrash } from "react-icons/fa";
import { ReceiptText, AlertCircle } from "lucide-react";
import { employeesAPI } from "@/lib/api";
import Modal from "@/components/Modal";
import { tData } from "@/lib/i18n";

interface EmpDashData {
    employee: { id: number; name: string; commission_rate: number };
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
    const { salon, user } = useAuthStore();
    const [flash, setFlash] = useState<{ type: string; msg: string } | null>(null);

    // Leave Management State
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [empLeaves, setEmpLeaves] = useState<any[]>([]);
    const [newLeaveDate, setNewLeaveDate] = useState("");

    const fetchLeaves = async () => {
        if (!user?.employee_id) return;
        try {
            const res = await employeesAPI.getLeaves({ employee_id: user.employee_id.toString() });
            setEmpLeaves(res.data.data);
        } catch (e) { console.error(e); }
    };

    const handleAddLeave = async () => {
        if (!user?.employee_id || !newLeaveDate) return;
        try {
            await employeesAPI.addLeave({ employee_id: user.employee_id, leave_date: newLeaveDate });
            setFlash({ type: "success", msg: "تم تسجيل الإجازة" });
            fetchLeaves();
            setNewLeaveDate("");
        } catch (e: any) { setFlash({ type: "error", msg: e.response?.data?.message || "حدث خطأ" }); }
    };

    const handleDeleteLeave = async (id: number) => {
        try {
            await employeesAPI.deleteLeave(id);
            fetchLeaves();
        } catch (e) { console.error(e); }
    };

    const handleEmergency = async () => {
        if (!user?.employee_id) return;
        const reason = prompt("ما هو سبب الظرف الطارئ؟", "ظرف طارئ");
        if (!reason) return;
        if (!confirm(`سيتم إلغاء جميع حجوزاتك لليوم وإبلاغ العملاء. هل أنت متأكد؟`)) return;
        try {
            await employeesAPI.declareEmergency({ employee_id: user.employee_id, date: new Date().toISOString().split('T')[0], reason });
            setFlash({ type: "success", msg: "تم إلغاء الحجوزات اليومية" });
        } catch (e: any) { setFlash({ type: "error", msg: e.response?.data?.message || "حدث خطأ" }); }
    };

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

    useEffect(() => {
        if (showLeaveModal) fetchLeaves();
    }, [showLeaveModal]);

    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="spinner" /></div>;
    if (!data) return null;

    return (
        <>
            {flash && (
                <div className={`fixed top-4 left-4 right-4 z-50 p-4 rounded-xl text-white text-center font-bold animate-bounce ${flash.type === "success" ? "bg-green-500" : "bg-red-500"}`} onClick={() => setFlash(null)}>
                    {flash.msg}
                </div>
            )}

            <div className="topbar">
                <div>
                    <div className="topbar-title">أهلاً، <span>{tData(data.employee.name, 'ar')}</span> 👋</div>
                    <div className="topbar-date"><FaCalendarAlt className="inline ml-1" /> {new Date().toLocaleDateString("ar-JO", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowLeaveModal(true)} className="btn-outline-lime px-4 py-2 border flex items-center gap-2"><FaCalendarTimes /> إجازاتي</button>
                    <Link href="/employee/new-customer" className="btn-lime flex items-center gap-2"><FaPlusCircle /> تسجيل زبون</Link>
                </div>
            </div>

            <div className="content-area">
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                    <StatCard icon={<FaUsers />} value={data.stats.customers} label="زبائن اليوم" color="lime" />
                    <StatCard icon={<FaCoins />} value={data.stats.income.toFixed(3)} label="مبيعات اليوم" color="green" />
                    <StatCard icon={<FaPercent />} value={data.stats.commission.toFixed(3)} label="عمولتي اليوم" color="blue" />
                    <StatCard icon={<FaExclamationTriangle />} value="ظرف طارئ" label="يجب إلغاء الحجوزات" onClick={handleEmergency} color="red" />
                </div>

                {/* Big CTA */}
                <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
                    <Link href="/employee/new-customer" className="inline-flex items-center gap-3 px-10 py-5 rounded-xl text-black font-extrabold text-lg transition-all hover:-translate-y-1" style={{ background: "linear-gradient(135deg, #C3D809, #D4EC0A)", boxShadow: "0 8px 30px rgba(195,216,9,0.4)" }}>
                        <FaPlusCircle size={24} /> تسجيل زبون جديد
                    </Link>
                    <button onClick={handleEmergency} className="inline-flex items-center gap-3 px-10 py-5 rounded-xl text-white font-extrabold text-lg transition-all hover:-translate-y-1 bg-red-600 shadow-lg shadow-red-900/20">
                        <FaExclamationTriangle size={24} /> ظرف طارئ اليوم
                    </button>
                </div>

                {/* Today Transactions */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="custom-table">
                    <div className="p-4 border-b border-white/5 flex justify-between"><span className="text-gray-300 font-bold flex items-center gap-2"><ReceiptText size={15} /> عملياتي اليوم</span></div>
                    <table data-mobile-cards>
                        <thead><tr><th>#</th><th>الخدمات</th><th>الملاحظات</th><th>المبلغ</th><th>الدفع</th><th>الوقت</th></tr></thead>
                        <tbody>
                            {data.transactions.map((tx, i) => (
                                <tr key={tx.id}>
                                    <td data-label="#" className="text-gray-600">#{i + 1}</td>
                                    <td data-label="الخدمات" className="text-gray-300">{tx.services || "-"}</td>
                                    <td data-label="الملاحظات" className="text-gray-500 text-sm">{tx.notes || "-"}</td>
                                    <td data-label="المبلغ" className="text-accent-lime font-bold">{Number(tx.total_amount).toFixed(3)} د.أ</td>
                                    <td data-label="الدفع"><span className="badge badge-green">{tx.payment_method === "cash" ? "نقداً" : "تحويل"}</span></td>
                                    <td data-label="الوقت" className="text-gray-600 text-xs">{new Date(tx.created_at).toLocaleTimeString("ar-JO", { hour: "2-digit", minute: "2-digit" })}</td>
                                </tr>
                            ))}
                            {data.transactions.length === 0 && <tr><td colSpan={6} className="text-center text-gray-600 py-8">لا توجد عمليات اليوم بعد</td></tr>}
                        </tbody>
                    </table>
                </motion.div>
            </div>

            {/* Leave Modal */}
            <Modal
                isOpen={showLeaveModal}
                onClose={() => setShowLeaveModal(false)}
                title="إدارة إجازاتي"
                icon={<FaCalendarTimes />}
                footer={<button className="btn-outline-lime w-full" onClick={() => setShowLeaveModal(false)}>إغلاق</button>}
            >
                <div className="space-y-6">
                    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                        <h5 className="text-accent-lime text-xs font-black uppercase tracking-widest mb-4">طلب إجازة جديدة</h5>
                        <div className="flex gap-2">
                            <input 
                                type="date" 
                                className="form-input flex-1" 
                                value={newLeaveDate} 
                                onChange={e => setNewLeaveDate(e.target.value)} 
                                min={new Date().toISOString().split('T')[0]}
                            />
                            <button className="btn-lime px-4" onClick={handleAddLeave} disabled={!newLeaveDate}>إضافة</button>
                        </div>
                    </div>

                    <div className="space-y-2">
                         <h5 className="text-white/30 text-[10px] font-black uppercase tracking-[0.2em]">إجازاتي القادمة</h5>
                         <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2">
                            {empLeaves.map(l => (
                                <div key={l.id} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-lg border border-white/5">
                                    <span className="text-white font-bold">{l.leave_date}</span>
                                    <button onClick={() => handleDeleteLeave(l.id)} className="text-red-500 hover:scale-110 transition-transform"><FaTrash size={12} /></button>
                                </div>
                            ))}
                            {empLeaves.length === 0 && <p className="text-center py-4 text-white/10 text-xs">لا يوجد إجازات مسجلة</p>}
                         </div>
                    </div>
                </div>
            </Modal>
        </>
    );
}
