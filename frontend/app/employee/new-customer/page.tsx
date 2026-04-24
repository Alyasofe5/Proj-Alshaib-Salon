"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { servicesAPI, transactionsAPI } from "@/lib/api";
import { Scissors, ChevronRight, ReceiptText, MousePointerClick, Banknote, ArrowLeftRight, CheckCircle2, Loader2 } from "lucide-react";
import { FaArrowRight } from "react-icons/fa";
import { tData } from "@/lib/i18n";

interface Service {
    id: number;
    name: string;
    price: number;
}

export default function NewCustomerPage() {
    const router = useRouter();
    const [services, setServices] = useState<Service[]>([]);
    const [selected, setSelected] = useState<Record<number, Service>>({});
    const [paymentMethod, setPaymentMethod] = useState("cash");
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [flash, setFlash] = useState<{ type: string; msg: string } | null>(null);

    useEffect(() => {
        servicesAPI.getAll(true).then(res => setServices(res.data.data)).catch(console.error).finally(() => setLoading(false));
    }, []);

    const toggleService = (svc: Service) => {
        setSelected(prev => {
            const copy = { ...prev };
            if (copy[svc.id]) delete copy[svc.id]; else copy[svc.id] = svc;
            return copy;
        });
    };

    const total = Object.values(selected).reduce((sum, s) => sum + Number(s.price), 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (Object.keys(selected).length === 0) return;
        setSubmitting(true);
        try {
            await transactionsAPI.create({
                service_ids: Object.keys(selected).map(Number),
                payment_method: paymentMethod,
                notes,
            });
            router.push("/employee/dashboard");
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            setFlash({ type: "error", msg: error.response?.data?.message || "حدث خطأ" });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="spinner" /></div>;

    return (
        <>
            <div className="topbar">
                <div className="topbar-title"><Scissors size={18} className="inline ml-2 text-accent-lime" /> تسجيل <span>زبون جديد</span></div>
                <button className="btn-outline-lime flex items-center gap-2" onClick={() => router.push("/employee/dashboard")}>
                    <FaArrowRight /> رجوع
                </button>
            </div>

            <div className="content-area">
                {flash && <div className="flash-error">{flash.msg}</div>}

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                    {/* Services Grid */}
                    <div className="lg:col-span-3 chart-card">
                        <div className="chart-card-title"><Scissors size={16} className="inline ml-2" /> اختر <span>الخدمات</span></div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {services.map(svc => {
                                const isSelected = !!selected[svc.id];
                                return (
                                    <motion.div
                                        key={svc.id}
                                        animate={{ scale: isSelected ? 1.02 : 1 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => toggleService(svc)}
                                        className="cursor-pointer text-center p-4 rounded-xl border-2 transition-colors"
                                        style={{
                                            background: isSelected ? "rgba(195,216,9,0.1)" : "var(--dark4)",
                                            borderColor: isSelected ? "#C3D809" : "#333",
                                        }}
                                    >
                                        <div className="flex justify-center mb-2">
                                            <Scissors size={22} className={isSelected ? "text-accent-lime" : "text-gray-500"} />
                                        </div>
                                        <div className="text-sm font-semibold text-gray-300">{tData(svc.name, 'ar')}</div>
                                        <div className="text-accent-lime font-extrabold mt-1">{Number(svc.price).toFixed(3)} د.أ</div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="lg:col-span-2">
                        <div className="chart-card sticky top-20">
                            <div className="chart-card-title"><ReceiptText size={16} className="inline ml-2" /> ملخص <span>العملية</span></div>

                            {Object.keys(selected).length === 0 ? (
                                <div className="text-gray-600 text-center py-6 text-sm">
                                    <MousePointerClick size={32} className="mx-auto mb-2 opacity-40" />
                                    اختر خدمة من اليسار
                                </div>
                            ) : (
                                <div className="mb-4">
                                    {Object.values(selected).map(svc => (
                                        <div key={svc.id} className="flex justify-between items-center py-2 border-b border-dark-5">
                                            <span className="text-gray-300 text-sm">{tData(svc.name, 'ar')}</span>
                                            <span className="text-accent-lime font-bold">{Number(svc.price).toFixed(3)} د.أ</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="border-t border-gray-700 pt-4 mb-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500 text-sm">الإجمالي:</span>
                                    <span className="text-2xl font-extrabold text-accent-lime">{total.toFixed(3)} د.أ</span>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div className="mb-4">
                                    <label className="form-label">طريقة الدفع</label>
                                    <div className="flex gap-2">
                                        {(["cash", "transfer"] as const).map(m => (
                                            <label
                                                key={m}
                                                className="flex-1 text-center py-3 rounded-lg border-2 cursor-pointer transition-all text-sm"
                                                style={{
                                                    borderColor: paymentMethod === m ? "#C3D809" : "#333",
                                                    background: paymentMethod === m ? "rgba(195,216,9,0.1)" : "transparent",
                                                    color: paymentMethod === m ? "#C3D809" : "var(--color-text-muted)",
                                                }}
                                            >
                                                <input type="radio" name="payment" value={m} checked={paymentMethod === m} onChange={() => setPaymentMethod(m)} className="hidden" />
                                                <span className="flex items-center justify-center gap-1.5">
                                                    {m === "cash" ? <Banknote size={14} /> : <ArrowLeftRight size={14} />}
                                                    {m === "cash" ? "نقداً" : "تحويل"}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label className="form-label">ملاحظات (اختياري)</label>
                                    <textarea className="form-input" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="أي ملاحظات..." />
                                </div>

                                <button
                                    type="submit"
                                    className="btn-lime w-full py-4 text-base flex items-center justify-center gap-2"
                                    disabled={Object.keys(selected).length === 0 || submitting}
                                >
                                    {submitting ? <Loader2 size={20} className="animate-spin" /> : <><CheckCircle2 size={18} /> حفظ العملية</>}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
