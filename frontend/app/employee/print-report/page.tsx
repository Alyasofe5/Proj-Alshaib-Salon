"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { reportsAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import {
    Printer, ArrowRight, CalendarDays, CalendarRange,
    User, ClipboardList, Banknote, ArrowLeftRight,
    TrendingUp, Users, Percent, FileText
} from "lucide-react";
import { tData } from "@/lib/i18n";

export default function PrintReportPage() {
    const { user, salon } = useAuthStore();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState("daily");
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

    useEffect(() => {
        setLoading(true);
        const params: Record<string, string> = { period };
        if (period === "daily") params.date = date;
        if (period === "monthly") params.month = month;

        reportsAPI.employee(params)
            .then((res) => setData(res.data.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [period, date, month]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="spinner" />
        </div>
    );
    if (!data) return null;

    const totalSales = Number(data.stats?.income || 0);
    const commission = Number(data.stats?.commission || 0);
    const commissionRate = data.employee?.commission_rate || 0;
    const empName = tData(data.employee?.name || user?.employee_name || user?.name, 'ar') || "موظف";
    const transactions = data.transactions || [];
    const dateLabel = period === "daily" ? date : month;
    const salonName = tData(salon?.name, 'ar') || "Maqass";

    return (
        <div style={{ direction: "rtl" }}>

            {/* ===== Control Bar (Screen Only) ===== */}
            <div className="no-print topbar" style={{ gap: "12px", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <Link href="/employee/dashboard"
                        style={{ display: "flex", alignItems: "center", gap: "6px", color: "#C3D809", textDecoration: "none", fontSize: "13px", fontWeight: 600 }}>
                        <ArrowRight size={14} /> العودة
                    </Link>
                    <div className="topbar-title">
                        <FileText size={16} className="inline-block align-middle ml-2 text-accent-lime" />
                        طباعة <span>التقرير</span>
                    </div>
                </div>

                <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", marginRight: "auto" }}>
                    {/* Period Toggle */}
                    <div style={{ display: "flex", gap: "6px", background: "var(--dark4)", borderRadius: "10px", padding: "4px" }}>
                        {[
                            { value: "daily", label: "يومي", Icon: CalendarDays },
                            { value: "monthly", label: "شهري", Icon: CalendarRange },
                        ].map(({ value, label, Icon }) => (
                            <button
                                key={value}
                                onClick={() => setPeriod(value)}
                                style={{
                                    display: "flex", alignItems: "center", gap: "5px",
                                    padding: "6px 14px", borderRadius: "7px", border: "none",
                                    cursor: "pointer", fontSize: "12px", fontWeight: 700,
                                    background: period === value ? "linear-gradient(135deg, #C3D809, #D4EC0A)" : "transparent",
                                    color: period === value ? "var(--color-cards)" : "var(--color-text-muted)",
                                    transition: "all .2s",
                                }}
                            >
                                <Icon size={13} />
                                {label}
                            </button>
                        ))}
                    </div>

                    {period === "daily" ? (
                        <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                            style={{ background: "var(--dark4)", border: "1px solid #C3D809", color: "#fff", padding: "7px 12px", borderRadius: "8px", fontFamily: "Noto Sans Arabic", fontSize: "13px" }} />
                    ) : (
                        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)}
                            style={{ background: "var(--dark4)", border: "1px solid #C3D809", color: "#fff", padding: "7px 12px", borderRadius: "8px", fontFamily: "Noto Sans Arabic", fontSize: "13px" }} />
                    )}

                    <button
                        onClick={() => window.print()}
                        style={{
                            display: "flex", alignItems: "center", gap: "7px",
                            background: "linear-gradient(135deg, #C3D809, #e6c65a)",
                            color: "var(--color-cards)", border: "none", padding: "8px 20px",
                            borderRadius: "8px", fontWeight: 700, cursor: "pointer",
                            fontFamily: "Noto Sans Arabic", fontSize: "13px",
                            boxShadow: "0 4px 15px rgba(195,216,9,.3)",
                        }}>
                        <Printer size={14} /> طباعة
                    </button>
                </div>
            </div>

            {/* ===== Printable Report ===== */}
            <div style={{ maxWidth: "800px", margin: "24px auto", background: "#fff", borderRadius: "12px", overflow: "hidden", boxShadow: "0 8px 40px rgba(0,0,0,0.15)", fontFamily: "Noto Sans Arabic, sans-serif" }}>

                {/* Report Header */}
                <div style={{ background: "linear-gradient(135deg, var(--color-cards) 0%, #1e1e1e 100%)", color: "#fff", padding: "32px", textAlign: "center", borderBottom: "3px solid #C3D809" }}>
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}>
                        <div style={{ width: "54px", height: "54px", borderRadius: "14px", background: "linear-gradient(135deg, #C3D809, #e6c65a)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-cards)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="6" cy="6" r="3" /><path d="M8.12 8.12 12 12" /><path d="M20 4 8.12 15.88" />
                                <circle cx="6" cy="18" r="3" /><path d="M14.8 14.8 20 20" />
                            </svg>
                        </div>
                    </div>
                    <h1 style={{ fontSize: "clamp(16px, 4.5vw, 22px)", color: "var(--color-accent)", letterSpacing: "0.5px", margin: "0 0 6px", fontWeight: 900, overflowWrap: "anywhere" }}>
                        {salonName}
                    </h1>
                    <h2 style={{ fontSize: "14px", color: "#aaa", fontWeight: 400, margin: "0 0 14px" }}>
                        تقرير {period === "daily" ? "يومي" : "شهري"} — {dateLabel}
                    </h2>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "var(--border-subtle)", border: "1px solid rgba(195,216,9,.35)", borderRadius: "30px", padding: "6px 18px", fontSize: "13px", color: "var(--color-accent)" }}>
                        <User size={13} />
                        {empName}
                    </div>
                    <div style={{ fontSize: "11px", color: "#666", marginTop: "10px" }}>
                        تاريخ الطباعة: {new Date().toLocaleString("ar-JO")}
                    </div>
                </div>

                {/* Summary Cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1px", background: "#e8dfc5" }}>
                    {[
                        { Icon: ClipboardList, value: transactions.length, label: "عدد العمليات", color: "var(--color-accent)" },
                        { Icon: TrendingUp, value: `${totalSales.toFixed(3)} د.أ`, label: "إجمالي المبيعات", color: "var(--color-accent)" },
                        { Icon: Percent, value: `${commission.toFixed(3)} د.أ`, label: `عمولتي (${commissionRate}%)`, color: "#27ae60" },
                    ].map(({ Icon, value, label, color }, i) => (
                        <div key={i} style={{ background: "#fff", padding: "20px 16px", textAlign: "center" }}>
                            <div style={{ display: "flex", justifyContent: "center", marginBottom: "6px" }}>
                                <Icon size={20} color={color} />
                            </div>
                            <div style={{ fontSize: "22px", fontWeight: 900, color }}>{value}</div>
                            <div style={{ fontSize: "11px", color: "#999", marginTop: "3px" }}>{label}</div>
                        </div>
                    ))}
                </div>

                {/* Section Title */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#f5eed8", color: "#7a5c14", fontWeight: 700, fontSize: "12px", padding: "10px 18px", borderRight: "4px solid #C3D809" }}>
                    <ClipboardList size={14} />
                    تفاصيل العمليات ({transactions.length})
                </div>

                {/* Transactions Table */}
                {transactions.length === 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px", color: "#bbb" }}>
                        <Users size={40} strokeWidth={1} />
                        <p style={{ marginTop: "12px", fontSize: "14px" }}>لا توجد عمليات في هذه الفترة</p>
                    </div>
                ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                        <thead>
                            <tr style={{ background: "#1e1e1e" }}>
                                {["#", "الخدمات", "المبلغ (د.أ)", "طريقة الدفع", "الملاحظات", "الوقت"].map((h, i) => (
                                    <th key={i} style={{ color: "var(--color-accent)", padding: "9px 12px", textAlign: "right", fontWeight: 700, fontSize: "11px" }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map((tx: any, i: number) => (
                                <tr key={tx.id} style={{ borderBottom: "1px solid #f0e8d0", background: i % 2 === 0 ? "#fff" : "#fdf9f0" }}>
                                    <td style={{ padding: "8px 12px", color: "#bbb", fontWeight: 600 }}>{i + 1}</td>
                                    <td style={{ padding: "8px 12px", color: "#333" }}>{tx.services || "—"}</td>
                                    <td style={{ padding: "8px 12px", color: "var(--color-accent)", fontWeight: 800 }}>{Number(tx.total_amount).toFixed(3)}</td>
                                    <td style={{ padding: "8px 12px" }}>
                                        <span style={{
                                            display: "inline-flex", alignItems: "center", gap: "4px",
                                            padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700,
                                            background: tx.payment_method === "cash" ? "rgba(39,174,96,.12)" : "rgba(52,152,219,.12)",
                                            color: tx.payment_method === "cash" ? "#27ae60" : "#2980b9",
                                        }}>
                                            {tx.payment_method === "cash"
                                                ? <><Banknote size={11} /> نقد</>
                                                : <><ArrowLeftRight size={11} /> تحويل</>}
                                        </span>
                                    </td>
                                    <td style={{ padding: "8px 12px", color: "#999" }}>{tx.notes || "—"}</td>
                                    <td style={{ padding: "8px 12px", color: "#bbb" }}>{new Date(tx.created_at).toLocaleTimeString("ar-JO", { hour: "2-digit", minute: "2-digit" })}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr style={{ background: "#f9f3e3" }}>
                                <td colSpan={2} style={{ padding: "9px 12px", fontWeight: 800, color: "#555" }}>الإجمالي</td>
                                <td style={{ padding: "9px 12px", color: "var(--color-accent)", fontWeight: 900, fontSize: "14px" }}>{totalSales.toFixed(3)}</td>
                                <td colSpan={3} style={{ padding: "9px 12px", color: "#27ae60", fontWeight: 700 }}>عمولتي: {commission.toFixed(3)} د.أ</td>
                            </tr>
                        </tfoot>
                    </table>
                )}

                {/* Report Footer */}
                <div style={{ background: "#f9f3e3", padding: "14px 24px", textAlign: "center", fontSize: "11px", color: "#bbb", borderTop: "1px solid #e8dfc5" }}>
                    <span style={{ color: "var(--color-accent)", fontWeight: 700 }}>{salonName}</span>
                    {" "} — تقرير {empName} — {new Date().toLocaleString("ar-JO")}
                </div>
            </div>

            <style>{`
                @media print {
                    /* Hide everything except the report */
                    .no-print,
                    .sidebar,
                    .sidebar-overlay,
                    .bottom-nav,
                    .topbar,
                    nav,
                    header,
                    footer { display: none !important; }

                    /* Reset the main content area */
                    .main-content {
                        margin: 0 !important;
                        padding: 0 !important;
                        width: 100% !important;
                    }

                    /* Full page white background */
                    html, body {
                        background: #fff !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    /* Report card takes full width */
                    div[style*="margin: 24px auto"],
                    div[style*="margin:24px auto"] {
                        margin: 0 !important;
                        max-width: 100% !important;
                        border-radius: 0 !important;
                        box-shadow: none !important;
                    }

                    /* Remove page margins */
                    @page {
                        margin: 8mm;
                        size: A4 portrait;
                    }
                }
            `}</style>
        </div>
    );
}
