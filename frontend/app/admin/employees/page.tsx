"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { employeesAPI } from "@/lib/api";
import Modal from "@/components/Modal";
import { FaUsers, FaPlus, FaEdit, FaTrash, FaPhone, FaCalendarTimes, FaExclamationTriangle } from "react-icons/fa";
import { tData } from "@/lib/i18n";

interface Employee {
    id: number;
    name: string;
    phone: string;
    salary_type: string;
    commission_rate: number;
    base_salary: number;
    is_active: number;
    tx_count: number;
    total_sales: number;
}

export default function EmployeesPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
    const [flash, setFlash] = useState<{ type: string; msg: string } | null>(null);

    // Leave Management State
    const [leaveModalEmp, setLeaveModalEmp] = useState<Employee | null>(null);
    const [empLeaves, setEmpLeaves] = useState<any[]>([]);
    const [newLeaveDate, setNewLeaveDate] = useState("");

    const openLeaveModal = async (emp: Employee) => {
        setLeaveModalEmp(emp);
        try {
            const res = await employeesAPI.getLeaves({ employee_id: emp.id.toString() });
            setEmpLeaves(res.data.data);
        } catch (e) { console.error(e); }
    };

    const handleAddLeave = async () => {
        if (!leaveModalEmp || !newLeaveDate) return;
        try {
            await employeesAPI.addLeave({ employee_id: leaveModalEmp.id, leave_date: newLeaveDate });
            setFlash({ type: "success", msg: "تم تسجيل الإجازة" });
            openLeaveModal(leaveModalEmp); // Refresh
            setNewLeaveDate("");
        } catch (e: any) { setFlash({ type: "error", msg: e.response?.data?.message || "حدث خطأ" }); }
    };

    const handleDeleteLeave = async (id: number) => {
        try {
            await employeesAPI.deleteLeave(id);
            if (leaveModalEmp) openLeaveModal(leaveModalEmp);
        } catch (e) { console.error(e); }
    };

    const handleEmergency = async (emp: Employee) => {
        const reason = prompt("ما هو سبب الظرف الطارئ؟", "ظرف طارئ");
        if (!reason) return;
        if (!confirm(`سيتم إلغاء جميع حجوزات ${tData(emp.name, 'ar')} لليوم وإبلاغ العملاء. هل أنت متأكد؟`)) return;
        try {
            await employeesAPI.declareEmergency({ employee_id: emp.id, date: new Date().toISOString().split('T')[0], reason });
            setFlash({ type: "success", msg: "تم إلغاء الحجوزات وتسجيل الإجازة الطارئة" });
            fetchData();
        } catch (e: any) { setFlash({ type: "error", msg: e.response?.data?.message || "حدث خطأ" }); }
    };

    // Form state
    const [form, setForm] = useState({
        name: "",
        phone: "",
        salary_type: "commission",
        commission_rate: 0,
        base_salary: 0,
    });

    const fetchData = async () => {
        try {
            const res = await employeesAPI.getAll();
            setEmployees(res.data.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const openAddModal = () => {
        setEditingEmp(null);
        setForm({ name: "", phone: "", salary_type: "commission", commission_rate: 0, base_salary: 0 });
        setShowModal(true);
    };

    const openEditModal = (emp: Employee) => {
        setEditingEmp(emp);
        setForm({
            name: emp.name,
            phone: emp.phone || "",
            salary_type: emp.salary_type,
            commission_rate: emp.commission_rate,
            base_salary: emp.base_salary,
        });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingEmp) {
                await employeesAPI.update(editingEmp.id, form);
                setFlash({ type: "success", msg: "تم تعديل بيانات الموظف" });
            } else {
                await employeesAPI.create(form);
                setFlash({ type: "success", msg: "تم إضافة الموظف بنجاح" });
            }
            setShowModal(false);
            fetchData();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            setFlash({ type: "error", msg: error.response?.data?.message || "حدث خطأ" });
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("هل أنت متأكد من حذف هذا الموظف نهائياً؟")) return;
        try {
            await employeesAPI.delete(id);
            setFlash({ type: "success", msg: "تم حذف الموظف" });
            fetchData();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            setFlash({ type: "error", msg: error.response?.data?.message || "لا يمكن حذف هذا الموظف" });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="spinner" />
            </div>
        );
    }

    return (
        <>
            <div className="topbar">
                <div className="topbar-title">
                    <FaUsers className="inline-block align-middle ml-2 text-accent-lime" />
                    إدارة <span>الموظفين</span>
                </div>
                <button
                    className="btn-lime inline-flex items-center justify-center gap-2 shrink-0"
                    style={{ padding: "8px 14px", minHeight: "40px" }}
                    onClick={openAddModal}
                    aria-label="إضافة موظف"
                >
                    <FaPlus />
                    <span className="hidden sm:inline">إضافة موظف</span>
                </button>
            </div>

            <div className="content-area">
                {flash && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={flash.type === "success" ? "flash-success" : "flash-error"}
                    >
                        {flash.msg}
                    </motion.div>
                )}

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="custom-table"
                >
                    <table data-mobile-cards>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>الاسم</th>
                                <th>الهاتف</th>
                                <th>نوع الراتب</th>
                                <th>النسبة / الراتب</th>
                                <th>العمليات</th>
                                <th>المبيعات</th>
                                <th>إجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {employees.map((emp, i) => (
                                <tr key={emp.id}>
                                    <td data-label="#" className="text-gray-600">{i + 1}</td>
                                    <td data-label="الاسم" className="text-white font-semibold">{tData(emp.name, 'ar')}</td>
                                    <td data-label="الهاتف">
                                        {emp.phone ? (
                                            <span className="flex items-center gap-1">
                                                <FaPhone className="text-green-500" size={10} />
                                                {emp.phone}
                                            </span>
                                        ) : (
                                            "-"
                                        )}
                                    </td>
                                    <td data-label="نوع الراتب">
                                        <span className={`badge ${emp.salary_type === "commission" ? "badge-lime" : "badge-blue"}`}>
                                            {emp.salary_type === "commission" ? "عمولة %" : "راتب ثابت"}
                                        </span>
                                    </td>
                                    <td data-label="النسبة/الراتب" className="text-accent-lime font-bold">
                                        {emp.salary_type === "commission"
                                            ? `${emp.commission_rate}%`
                                            : `${Number(emp.base_salary).toFixed(3)} د.أ`}
                                    </td>
                                    <td data-label="العمليات">
                                        <span className="badge badge-blue">{emp.tx_count}</span>
                                    </td>
                                    <td data-label="المبيعات" className="text-accent-lime font-bold">
                                        {Number(emp.total_sales).toFixed(3)} د.أ
                                    </td>
                                    <td data-label="إجراءات">
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => openEditModal(emp)}
                                                className="p-2 rounded-lg transition-colors"
                                                title="تعديل"
                                                style={{ background: "rgba(195,216,9,0.1)", border: "1px solid rgba(195,216,9,0.3)", color: "var(--color-accent)" }}
                                            >
                                                <FaEdit size={12} />
                                            </button>
                                            <button 
                                                onClick={() => openLeaveModal(emp)}
                                                className="p-2 rounded-lg transition-colors"
                                                title="الإجازات"
                                                style={{ background: "rgba(255,165,0,0.1)", border: "1px solid rgba(255,165,0,0.3)", color: "orange" }}
                                            >
                                                <FaCalendarTimes size={12} />
                                            </button>
                                            <button 
                                                onClick={() => handleEmergency(emp)}
                                                className="p-2 rounded-lg transition-colors animate-pulse"
                                                title="ظرف طارئ اليوم"
                                                style={{ background: "rgba(231,76,60,0.1)", border: "1px solid rgba(231,76,60,0.3)", color: "#e74c3c" }}
                                            >
                                                <FaExclamationTriangle size={12} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(emp.id)}
                                                className="p-2 rounded-lg transition-colors"
                                                title="حذف"
                                                style={{ background: "rgba(231,76,60,0.1)", border: "1px solid rgba(231,76,60,0.3)", color: "#e74c3c" }}
                                            >
                                                <FaTrash size={12} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {employees.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="text-center text-gray-600 py-8">
                                        لا يوجد موظفون
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </motion.div>
            </div>

            {/* Leave Management Modal */}
            <Modal
                isOpen={!!leaveModalEmp}
                onClose={() => setLeaveModalEmp(null)}
                title={`إجازات الحلاق: ${leaveModalEmp?.name}`}
                icon={<FaCalendarTimes />}
                footer={<button className="btn-outline-lime w-full" onClick={() => setLeaveModalEmp(null)}>إغلاق</button>}
            >
                <div className="space-y-6">
                    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                        <h5 className="text-accent-lime text-xs font-black uppercase tracking-widest mb-4">إضافة يوم إجازة</h5>
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
                         <h5 className="text-white/30 text-[10px] font-black uppercase tracking-[0.2em]">الإجازات القادمة</h5>
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

            {/* Add/Edit Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingEmp ? "تعديل موظف" : "إضافة موظف جديد"}
                icon={<FaUsers />}
                footer={
                    <>
                        <button className="btn-lime" onClick={handleSubmit}>
                            {editingEmp ? "حفظ التعديلات" : "إضافة"}
                        </button>
                        <button className="btn-outline-lime" onClick={() => setShowModal(false)}>
                            إلغاء
                        </button>
                    </>
                }
            >
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="form-label">الاسم الكامل *</label>
                        <input
                            className="form-input"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="form-label">رقم الهاتف</label>
                        <input
                            className="form-input"
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        />
                    </div>
                    <div className="mb-4">
                        <label className="form-label">نوع الراتب</label>
                        <select
                            className="form-input"
                            value={form.salary_type}
                            onChange={(e) => setForm({ ...form, salary_type: e.target.value })}
                        >
                            <option value="commission">عمولة %</option>
                            <option value="fixed">راتب ثابت</option>
                        </select>
                    </div>
                    {form.salary_type === "commission" ? (
                        <div className="mb-4">
                            <label className="form-label">نسبة العمولة (%)</label>
                            <input
                                type="number"
                                className="form-input"
                                value={form.commission_rate}
                                onChange={(e) =>
                                    setForm({ ...form, commission_rate: Number(e.target.value) })
                                }
                                min={0}
                                max={100}
                            />
                        </div>
                    ) : (
                        <div className="mb-4">
                            <label className="form-label">الراتب الأساسي (د.أ)</label>
                            <input
                                type="number"
                                className="form-input"
                                value={form.base_salary}
                                onChange={(e) =>
                                    setForm({ ...form, base_salary: Number(e.target.value) })
                                }
                                min={0}
                                step={0.001}
                            />
                        </div>
                    )}
                </form>
            </Modal>
        </>
    );
}
