"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { employeesAPI } from "@/lib/api";
import Modal from "@/components/Modal";
import { FaUsers, FaPlus, FaEdit, FaTrash, FaPhone } from "react-icons/fa";

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
                    <FaUsers className="inline ml-2 text-gold" />
                    إدارة <span>الموظفين</span>
                </div>
                <button className="btn-gold flex items-center gap-2" onClick={openAddModal}>
                    <FaPlus /> إضافة موظف
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
                    <table>
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
                                    <td className="text-gray-600">{i + 1}</td>
                                    <td className="text-white font-semibold">{emp.name}</td>
                                    <td>
                                        {emp.phone ? (
                                            <span className="flex items-center gap-1">
                                                <FaPhone className="text-green-500" size={10} />
                                                {emp.phone}
                                            </span>
                                        ) : (
                                            "-"
                                        )}
                                    </td>
                                    <td>
                                        <span className={`badge ${emp.salary_type === "commission" ? "badge-gold" : "badge-blue"}`}>
                                            {emp.salary_type === "commission" ? "عمولة %" : "راتب ثابت"}
                                        </span>
                                    </td>
                                    <td className="text-gold font-bold">
                                        {emp.salary_type === "commission"
                                            ? `${emp.commission_rate}%`
                                            : `${Number(emp.base_salary).toFixed(3)} د.أ`}
                                    </td>
                                    <td>
                                        <span className="badge badge-blue">{emp.tx_count}</span>
                                    </td>
                                    <td className="text-gold font-bold">
                                        {Number(emp.total_sales).toFixed(3)} د.أ
                                    </td>
                                    <td>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => openEditModal(emp)}
                                                className="p-2 rounded-lg transition-colors"
                                                style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.3)", color: "#C9A84C" }}
                                            >
                                                <FaEdit size={12} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(emp.id)}
                                                className="p-2 rounded-lg transition-colors"
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

            {/* Add/Edit Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingEmp ? "تعديل موظف" : "إضافة موظف جديد"}
                icon={<FaUsers />}
                footer={
                    <>
                        <button className="btn-gold" onClick={handleSubmit}>
                            {editingEmp ? "حفظ التعديلات" : "إضافة"}
                        </button>
                        <button className="btn-outline-gold" onClick={() => setShowModal(false)}>
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
