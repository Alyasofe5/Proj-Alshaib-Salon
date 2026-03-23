"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { servicesAPI } from "@/lib/api";
import Modal from "@/components/Modal";
import { FaCut, FaPlus, FaEdit, FaTrash, FaToggleOn, FaToggleOff } from "react-icons/fa";

interface Service {
    id: number;
    name: string;
    price: number;
    is_active: number;
    created_at: string;
}

export default function ServicesPage() {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingSvc, setEditingSvc] = useState<Service | null>(null);
    const [flash, setFlash] = useState<{ type: string; msg: string } | null>(null);
    const [form, setForm] = useState({ name: "", price: 0 });

    const fetchData = async () => {
        try {
            const res = await servicesAPI.getAll();
            setServices(res.data.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const openAdd = () => { setEditingSvc(null); setForm({ name: "", price: 0 }); setShowModal(true); };
    const openEdit = (s: Service) => { setEditingSvc(s); setForm({ name: s.name, price: s.price }); setShowModal(true); };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingSvc) {
                await servicesAPI.update(editingSvc.id, form);
                setFlash({ type: "success", msg: "تم تعديل الخدمة" });
            } else {
                await servicesAPI.create(form);
                setFlash({ type: "success", msg: "تم إضافة الخدمة بنجاح" });
            }
            setShowModal(false);
            fetchData();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            setFlash({ type: "error", msg: error.response?.data?.message || "حدث خطأ" });
        }
    };

    const handleToggle = async (id: number) => {
        try {
            await servicesAPI.toggle(id);
            fetchData();
        } catch (e) { console.error(e); }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("هل أنت متأكد من حذف هذه الخدمة؟")) return;
        try {
            await servicesAPI.delete(id);
            setFlash({ type: "success", msg: "تم حذف الخدمة" });
            fetchData();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            setFlash({ type: "error", msg: error.response?.data?.message || "لا يمكن حذف هذه الخدمة" });
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="spinner" /></div>;

    return (
        <>
            <div className="topbar">
                <div className="topbar-title"><FaCut className="inline ml-2 text-accent-lime" /> إدارة <span>الخدمات</span></div>
                <button className="btn-lime flex items-center gap-2" onClick={openAdd}><FaPlus /> إضافة خدمة</button>
            </div>

            <div className="content-area">
                {flash && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={flash.type === "success" ? "flash-success" : "flash-error"}>{flash.msg}</motion.div>}

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="custom-table">
                    <table>
                        <thead><tr><th>#</th><th>الخدمة</th><th>السعر</th><th>الحالة</th><th>إجراءات</th></tr></thead>
                        <tbody>
                            {services.map((svc, i) => (
                                <tr key={svc.id}>
                                    <td className="text-gray-600">{i + 1}</td>
                                    <td className="text-white font-semibold">{svc.name}</td>
                                    <td className="text-accent-lime font-bold">{Number(svc.price).toFixed(3)} د.أ</td>
                                    <td>
                                        <span className={`badge ${svc.is_active ? "badge-green" : "badge-red"}`}>
                                            {svc.is_active ? "نشطة" : "متوقفة"}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="flex gap-1">
                                            <button onClick={() => handleToggle(svc.id)} className="p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid #333", color: "var(--color-text-muted)" }}>
                                                {svc.is_active ? <FaToggleOn className="text-green-500" size={14} /> : <FaToggleOff size={14} />}
                                            </button>
                                            <button onClick={() => openEdit(svc)} className="p-2 rounded-lg" style={{ background: "rgba(195,216,9,0.1)", border: "1px solid rgba(195,216,9,0.3)", color: "var(--color-accent)" }}>
                                                <FaEdit size={12} />
                                            </button>
                                            <button onClick={() => handleDelete(svc.id)} className="p-2 rounded-lg" style={{ background: "rgba(231,76,60,0.1)", border: "1px solid rgba(231,76,60,0.3)", color: "#e74c3c" }}>
                                                <FaTrash size={12} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </motion.div>
            </div>

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingSvc ? "تعديل خدمة" : "إضافة خدمة"} icon={<FaCut />}
                footer={<><button className="btn-lime" onClick={handleSubmit}>{editingSvc ? "حفظ" : "إضافة"}</button><button className="btn-outline-lime" onClick={() => setShowModal(false)}>إلغاء</button></>}>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4"><label className="form-label">اسم الخدمة *</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
                    <div className="mb-4"><label className="form-label">السعر (د.أ) *</label><input type="number" className="form-input" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} min={0} step={0.001} required /></div>
                </form>
            </Modal>
        </>
    );
}
