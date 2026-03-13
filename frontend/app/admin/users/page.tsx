"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { usersAPI } from "@/lib/api";
import Modal from "@/components/Modal";
import { useAuthStore } from "@/lib/store";
import { FaUserCog, FaUserPlus, FaKey, FaTrash, FaBan, FaCheck, FaCrown, FaUserTie } from "react-icons/fa";

interface User {
    id: number;
    name: string;
    username: string;
    role: string;
    employee_id: number | null;
    is_active: number;
    emp_name: string | null;
}

interface EmployeeOption {
    id: number;
    name: string;
}

export default function UsersPage() {
    const { user: currentUser } = useAuthStore();
    const [users, setUsers] = useState<User[]>([]);
    const [employees, setEmployees] = useState<EmployeeOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetUser, setResetUser] = useState<User | null>(null);
    const [flash, setFlash] = useState<{ type: string; msg: string } | null>(null);
    const [form, setForm] = useState({ name: "", username: "", password: "", role: "employee", employee_id: "" });
    const [newPassword, setNewPassword] = useState("");

    const fetchData = async () => {
        try {
            const res = await usersAPI.getAll();
            setUsers(res.data.data.users);
            setEmployees(res.data.data.employees);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await usersAPI.create({ ...form, employee_id: form.employee_id ? Number(form.employee_id) : null });
            setFlash({ type: "success", msg: "تم إضافة المستخدم بنجاح" });
            setShowAddModal(false);
            fetchData();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            setFlash({ type: "error", msg: error.response?.data?.message || "حدث خطأ" });
        }
    };

    const handleResetPassword = async () => {
        if (!resetUser || !newPassword) return;
        try {
            await usersAPI.resetPassword(resetUser.id, newPassword);
            setFlash({ type: "success", msg: "تم تغيير كلمة المرور" });
            setShowResetModal(false);
            setNewPassword("");
        } catch (e) { console.error(e); }
    };

    const handleToggle = async (id: number) => {
        try { await usersAPI.toggle(id); fetchData(); } catch (e) { console.error(e); }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("هل أنت متأكد من حذف هذا المستخدم نهائياً؟")) return;
        try {
            await usersAPI.delete(id);
            setFlash({ type: "success", msg: "تم حذف المستخدم" });
            fetchData();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            setFlash({ type: "error", msg: error.response?.data?.message || "حدث خطأ" });
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="spinner" /></div>;

    return (
        <>
            <div className="topbar flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                    <FaUserCog className="text-gold" /> إدارة <span className="text-gold font-black">المستخدمين</span>
                </div>
                <button className="btn-gold flex items-center justify-center gap-2 px-4 py-2" onClick={() => { setForm({ name: "", username: "", password: "", role: "employee", employee_id: "" }); setShowAddModal(true); }}>
                    <FaUserPlus /> إضافة مستخدم
                </button>
            </div>

            <div className="content-area">
                {flash && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={flash.type === "success" ? "flash-success" : "flash-error"}>{flash.msg}</motion.div>}

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="custom-table overflow-x-auto">
                    <table className="min-w-full">
                        <thead><tr><th>#</th><th>الاسم</th><th>اسم الدخول</th><th>الدور</th><th>الموظف المرتبط</th><th>الحالة</th><th>إجراءات</th></tr></thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id}>
                                    <td className="text-gray-600">{u.id}</td>
                                    <td className="text-white font-semibold">{u.name}</td>
                                    <td className="text-gray-500 font-mono">{u.username}</td>
                                    <td>
                                        <span className={`badge ${u.role === "admin" ? "badge-gold" : "badge-blue"}`}>
                                            {u.role === "admin" ? <><FaCrown className="inline ml-1" size={10} /> مدير</> : <><FaUserTie className="inline ml-1" size={10} /> موظف</>}
                                        </span>
                                    </td>
                                    <td className="text-gray-500">{u.emp_name || "-"}</td>
                                    <td><span className={`badge ${u.is_active ? "badge-green" : "badge-red"}`}>{u.is_active ? "نشط" : "موقوف"}</span></td>
                                    <td>
                                        <div className="flex gap-1">
                                            <button onClick={() => { setResetUser(u); setNewPassword(""); setShowResetModal(true); }} className="p-2 rounded-lg" style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.3)", color: "#C9A84C" }}>
                                                <FaKey size={11} />
                                            </button>
                                            {u.id !== currentUser?.id && (
                                                <>
                                                    <button onClick={() => handleToggle(u.id)} className="p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid #333", color: "#888" }}>
                                                        {u.is_active ? <FaBan size={11} /> : <FaCheck size={11} />}
                                                    </button>
                                                    <button onClick={() => handleDelete(u.id)} className="p-2 rounded-lg" style={{ background: "rgba(231,76,60,0.15)", border: "1px solid rgba(231,76,60,0.3)", color: "#e74c3c" }}>
                                                        <FaTrash size={11} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </motion.div>
            </div>

            {/* Add User Modal */}
            <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="إضافة مستخدم جديد" icon={<FaUserPlus />}
                footer={<><button className="btn-gold" onClick={handleAdd}>حفظ</button><button className="btn-outline-gold" onClick={() => setShowAddModal(false)}>إلغاء</button></>}>
                <form onSubmit={handleAdd}>
                    <div className="mb-4"><label className="form-label">الاسم الكامل *</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
                    <div className="mb-4"><label className="form-label">اسم الدخول *</label><input className="form-input" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required /></div>
                    <div className="mb-4"><label className="form-label">كلمة المرور *</label><input type="password" className="form-input" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required /></div>
                    <div className="mb-4">
                        <label className="form-label">الدور</label>
                        <select className="form-input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                            <option value="employee">موظف (حلاق)</option><option value="admin">مدير</option>
                        </select>
                    </div>
                    {form.role === "employee" && (
                        <div className="mb-4">
                            <label className="form-label">ربط بموظف</label>
                            <select className="form-input" value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })}>
                                <option value="">-- اختر موظف --</option>
                                {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                            </select>
                        </div>
                    )}
                </form>
            </Modal>

            {/* Reset Password Modal */}
            <Modal isOpen={showResetModal} onClose={() => setShowResetModal(false)} title="تغيير كلمة المرور" icon={<FaKey />}
                footer={<><button className="btn-gold" onClick={handleResetPassword}>تغيير</button><button className="btn-outline-gold" onClick={() => setShowResetModal(false)}>إلغاء</button></>}>
                <p className="text-gray-400 mb-4">تغيير كلمة مرور: <strong className="text-gold">{resetUser?.name}</strong></p>
                <div className="mb-4"><label className="form-label">كلمة المرور الجديدة *</label><input type="password" className="form-input" value={newPassword} onChange={e => setNewPassword(e.target.value)} required /></div>
            </Modal>
        </>
    );
}
