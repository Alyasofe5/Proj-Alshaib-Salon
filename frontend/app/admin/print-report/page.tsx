"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { reportsAPI, expensesAPI } from "@/lib/api";
import { FaPrint, FaArrowRight, FaFileAlt, FaCoins, FaMoneyBillWave, FaChartLine, FaUsers, FaCalendarAlt } from "react-icons/fa";

export default function AdminPrintReportPage() {
    const [data, setData] = useState<any>(null);
    const [expensesData, setExpensesData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState("daily");
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

    const fetchReport = () => {
        setLoading(true);
        const params: Record<string, string> = { period };
        if (period === "daily") params.date = date;
        if (period === "monthly") params.month = month;

        const reportPromise = period === "daily"
            ? reportsAPI.daily(params)
            : reportsAPI.monthly(params);

        const expensePromise = expensesAPI.getAll({ month: period === "daily" ? date.slice(0, 7) : month });

        Promise.all([reportPromise, expensePromise])
            .then(([reportRes, expenseRes]) => {
                setData(reportRes.data.data);
                setExpensesData(expenseRes.data.data);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchReport(); }, [period, date, month]);

    if (loading) return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div className="spinner" />
        </div>
    );
    if (!data) return null;

    const totalRevenue = Number(data.total_income || data.income || 0);
    const transactions = data.transactions || [];
    const empStats = data.employee_stats || [];
    const expenses = expensesData?.expenses || [];
    const totalExpenses = Number(expensesData?.summary?.total_expenses || 0);
    const netProfit = totalRevenue - totalExpenses;
    const isProfit = netProfit >= 0;
    const dateLabel = period === "daily" ? date : month;

    return (
        <div style={{ direction: "rtl", fontFamily: "Tajawal, sans-serif" }}>

            {/* ===== Control Bar (Screen Only) ===== */}
            <div className="no-print topbar flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <Link href="/admin/reports" className="btn-secondary" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
                        <FaArrowRight />
                        <span className="hidden md:inline">العودة للتقارير</span>
                    </Link>
                    <div className="topbar-title m-0">
                        <FaFileAlt style={{ display: "inline", marginLeft: "8px", color: "var(--gold)" }} />
                        <span>طباعة التقرير</span>
                    </div>
                </div>

                <div className="flex gap-2.5 items-center flex-wrap w-full md:w-auto">
                    <button
                        onClick={() => setPeriod("daily")}
                        className={period === "daily" ? "btn-gold flex-1 md:flex-none justify-center" : "btn-outline-gold flex-1 md:flex-none justify-center"}
                        style={{ fontSize: "13px", padding: "8px 16px" }}
                    >
                        يومي
                    </button>
                    <button
                        onClick={() => setPeriod("monthly")}
                        className={period === "monthly" ? "btn-gold flex-1 md:flex-none justify-center" : "btn-outline-gold flex-1 md:flex-none justify-center"}
                        style={{ fontSize: "13px", padding: "8px 16px" }}
                    >
                        شهري
                    </button>

                    <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
                        {period === "daily" ? (
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="form-input flex-1 md:w-[160px]"
                            />
                        ) : (
                            <input
                                type="month"
                                value={month}
                                onChange={(e) => setMonth(e.target.value)}
                                className="form-input flex-1 md:w-[160px]"
                            />
                        )}

                        <button
                            onClick={() => window.print()}
                            className="btn-gold justify-center flex-1 md:flex-none"
                            style={{ display: "flex", alignItems: "center", gap: "8px" }}
                        >
                            <FaPrint />
                            <span className="md:inline">طباعة</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* ===== Printable Report ===== */}
            <div className="content-area print-area">

                {/* Report Header */}
                <div className="print-header" style={{
                    textAlign: "center",
                    borderBottom: "2px solid var(--gold)",
                    paddingBottom: "20px",
                    marginBottom: "28px"
                }}>
                    <div style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "60px",
                        height: "60px",
                        background: "linear-gradient(135deg, var(--gold), var(--gold-light))",
                        borderRadius: "14px",
                        fontSize: "26px",
                        marginBottom: "12px",
                        color: "#000"
                    }}>
                        ✂️
                    </div>
                    <h1 style={{ fontSize: "24px", fontWeight: 900, color: "var(--gold)", letterSpacing: "2px", margin: "0 0 6px" }}>
                        AL SHAYEB
                    </h1>
                    <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#e0e0e0", margin: "0 0 8px" }}>
                        تقرير {period === "daily" ? "يومي" : "شهري"}: {dateLabel}
                    </h2>
                    <p style={{ fontSize: "12px", color: "#666", margin: 0 }}>
                        <FaCalendarAlt style={{ display: "inline", marginLeft: "6px" }} />
                        تاريخ الإصدار: {new Date().toLocaleString("ar-JO")} | Salon Management System
                    </p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-7">
                    {/* Total Revenue */}
                    <div className="stat-card" style={{ borderColor: "rgba(201, 168, 76, 0.3)", textAlign: "center" }}>
                        <div className="stat-icon gold" style={{ margin: "0 auto 12px" }}>
                            <FaCoins />
                        </div>
                        <div className="stat-value" style={{ fontSize: "22px" }}>{totalRevenue.toFixed(3)}</div>
                        <div className="stat-label">إجمالي الدخل (د.أ)</div>
                    </div>

                    {/* Total Expenses */}
                    <div className="stat-card" style={{ borderColor: "rgba(231, 76, 60, 0.3)", textAlign: "center" }}>
                        <div className="stat-icon red" style={{ margin: "0 auto 12px" }}>
                            <FaMoneyBillWave />
                        </div>
                        <div className="stat-value" style={{ fontSize: "22px", color: "#e74c3c" }}>{totalExpenses.toFixed(3)}</div>
                        <div className="stat-label">إجمالي المصاريف (د.أ)</div>
                    </div>

                    {/* Net Profit */}
                    <div className="stat-card" style={{ borderColor: isProfit ? "rgba(46, 204, 113, 0.3)" : "rgba(231, 76, 60, 0.3)", textAlign: "center" }}>
                        <div className={`stat-icon ${isProfit ? "green" : "red"}`} style={{ margin: "0 auto 12px" }}>
                            <FaChartLine />
                        </div>
                        <div className="stat-value" style={{ fontSize: "22px", color: isProfit ? "#2ecc71" : "#e74c3c" }}>
                            {Math.abs(netProfit).toFixed(3)}
                        </div>
                        <div className="stat-label">صافي {isProfit ? "الربح" : "الخسارة"} (د.أ)</div>
                    </div>

                    {/* Transactions Count */}
                    <div className="stat-card" style={{ textAlign: "center" }}>
                        <div className="stat-icon blue" style={{ margin: "0 auto 12px" }}>
                            <FaUsers />
                        </div>
                        <div className="stat-value" style={{ fontSize: "22px" }}>{transactions.length}</div>
                        <div className="stat-label">عدد العمليات</div>
                    </div>
                </div>

                {/* Financial Status Banner */}
                <div style={{
                    padding: "14px 20px",
                    borderRadius: "10px",
                    marginBottom: "28px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontWeight: 700,
                    fontSize: "14px",
                    background: isProfit ? "rgba(46, 204, 113, 0.08)" : "rgba(231, 76, 60, 0.08)",
                    border: `1px solid ${isProfit ? "rgba(46, 204, 113, 0.3)" : "rgba(231, 76, 60, 0.3)"}`,
                    color: isProfit ? "#2ecc71" : "#e74c3c"
                }}>
                    <span>{isProfit ? "✅ الوضع المالي: أنت في ربح" : "❌ الوضع المالي: أنت في خسارة"}</span>
                    <span style={{ fontSize: "16px" }}>{Math.abs(netProfit).toFixed(3)} د.أ</span>
                </div>

                {/* ===== Transactions Table ===== */}
                <div style={{ marginBottom: "28px" }}>
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        marginBottom: "14px",
                        paddingBottom: "10px",
                        borderBottom: "1px solid rgba(201, 168, 76, 0.2)"
                    }}>
                        <div style={{
                            width: "4px",
                            height: "20px",
                            background: "var(--gold)",
                            borderRadius: "2px"
                        }} />
                        <span style={{ fontSize: "15px", fontWeight: 800, color: "#ddd" }}>
                            📋 تفاصيل العمليات
                        </span>
                        <span className="badge badge-gold" style={{ marginRight: "auto" }}>
                            {transactions.length} عملية
                        </span>
                    </div>

                    {transactions.length === 0 ? (
                        <div style={{
                            textAlign: "center",
                            padding: "32px",
                            color: "#555",
                            background: "var(--dark3)",
                            borderRadius: "12px",
                            border: "1px solid rgba(255,255,255,0.04)"
                        }}>
                            لا توجد عمليات في هذه الفترة
                        </div>
                    ) : (
                        <div className="custom-table overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr>
                                        <th style={{ color: "var(--gold)" }}>#</th>
                                        <th>الموظف</th>
                                        <th>المبلغ</th>
                                        <th>طريقة الدفع</th>
                                        <th>الوقت</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.map((tx: any, i: number) => (
                                        <tr key={tx.id}>
                                            <td style={{ color: "#555", fontSize: "12px" }}>{i + 1}</td>
                                            <td style={{ fontWeight: 600, color: "#ddd" }}>{tx.emp_name || "—"}</td>
                                            <td>
                                                <span style={{ color: "var(--gold)", fontWeight: 700 }}>
                                                    {Number(tx.total_amount).toFixed(3)}
                                                </span>
                                                <span style={{ color: "#555", fontSize: "11px", marginRight: "4px" }}>د.أ</span>
                                            </td>
                                            <td>
                                                <span className={`badge ${tx.payment_method === "cash" ? "badge-green" : "badge-blue"}`}>
                                                    {tx.payment_method === "cash" ? "💵 نقد" : "🏦 تحويل"}
                                                </span>
                                            </td>
                                            <td style={{ color: "#666", fontSize: "12px" }}>
                                                {new Date(tx.created_at).toLocaleTimeString("ar-JO", { hour: "2-digit", minute: "2-digit" })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr style={{ background: "rgba(201, 168, 76, 0.05)", borderTop: "1px solid rgba(201, 168, 76, 0.2)" }}>
                                        <td colSpan={2} style={{ padding: "12px 18px", color: "#aaa", fontWeight: 700 }}>الإجمالي</td>
                                        <td style={{ padding: "12px 18px", color: "var(--gold)", fontWeight: 800, fontSize: "15px" }}>
                                            {totalRevenue.toFixed(3)} د.أ
                                        </td>
                                        <td colSpan={2} />
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </div>

                {/* ===== Expenses Table ===== */}
                <div style={{ marginBottom: "28px" }}>
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        marginBottom: "14px",
                        paddingBottom: "10px",
                        borderBottom: "1px solid rgba(231, 76, 60, 0.2)"
                    }}>
                        <div style={{
                            width: "4px",
                            height: "20px",
                            background: "#e74c3c",
                            borderRadius: "2px"
                        }} />
                        <span style={{ fontSize: "15px", fontWeight: 800, color: "#ddd" }}>
                            💸 المصاريف
                        </span>
                        <span className="badge badge-red" style={{ marginRight: "auto" }}>
                            {expenses.length} بند
                        </span>
                    </div>

                    {expenses.length === 0 ? (
                        <div style={{
                            textAlign: "center",
                            padding: "32px",
                            color: "#555",
                            background: "var(--dark3)",
                            borderRadius: "12px",
                            border: "1px solid rgba(255,255,255,0.04)"
                        }}>
                            لا توجد مصاريف في هذه الفترة
                        </div>
                    ) : (
                        <div className="custom-table overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr>
                                        <th style={{ color: "#e74c3c" }}>#</th>
                                        <th>العنوان</th>
                                        <th>النوع</th>
                                        <th>المبلغ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {expenses.map((e: any, i: number) => (
                                        <tr key={e.id}>
                                            <td style={{ color: "#555", fontSize: "12px" }}>{i + 1}</td>
                                            <td style={{ fontWeight: 600, color: "#ddd" }}>{e.title}</td>
                                            <td>
                                                <span className="badge" style={{
                                                    background: "rgba(255,255,255,0.04)",
                                                    color: "#888",
                                                    border: "1px solid rgba(255,255,255,0.06)"
                                                }}>
                                                    {e.type}
                                                </span>
                                            </td>
                                            <td>
                                                <span style={{ color: "#e74c3c", fontWeight: 700 }}>
                                                    {Number(e.amount).toFixed(3)}
                                                </span>
                                                <span style={{ color: "#555", fontSize: "11px", marginRight: "4px" }}>د.أ</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr style={{ background: "rgba(231, 76, 60, 0.05)", borderTop: "1px solid rgba(231, 76, 60, 0.2)" }}>
                                        <td colSpan={3} style={{ padding: "12px 18px", color: "#aaa", fontWeight: 700 }}>الإجمالي</td>
                                        <td style={{ padding: "12px 18px", color: "#e74c3c", fontWeight: 800, fontSize: "15px" }}>
                                            {totalExpenses.toFixed(3)} د.أ
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </div>

                {/* ===== Employee Stats Table ===== */}
                {empStats.length > 0 && (
                    <div style={{ marginBottom: "28px" }}>
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            marginBottom: "14px",
                            paddingBottom: "10px",
                            borderBottom: "1px solid rgba(52, 152, 219, 0.2)"
                        }}>
                            <div style={{
                                width: "4px",
                                height: "20px",
                                background: "#3498db",
                                borderRadius: "2px"
                            }} />
                            <span style={{ fontSize: "15px", fontWeight: 800, color: "#ddd" }}>
                                👷 أداء الموظفين
                            </span>
                            <span className="badge badge-blue" style={{ marginRight: "auto" }}>
                                {empStats.length} موظف
                            </span>
                        </div>

                        <div className="custom-table overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr>
                                        <th style={{ color: "#3498db" }}>الموظف</th>
                                        <th>عدد العمليات</th>
                                        <th>الدخل</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {empStats.map((e: any, i: number) => (
                                        <tr key={i}>
                                            <td style={{ fontWeight: 700, color: "#ddd" }}>{e.name || "غير محدد"}</td>
                                            <td>
                                                <span className="badge badge-blue">{e.cnt}</span>
                                            </td>
                                            <td>
                                                <span style={{ color: "var(--gold)", fontWeight: 700 }}>
                                                    {Number(e.total).toFixed(3)}
                                                </span>
                                                <span style={{ color: "#555", fontSize: "11px", marginRight: "4px" }}>د.أ</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Report Footer */}
                <div style={{
                    textAlign: "center",
                    marginTop: "40px",
                    paddingTop: "20px",
                    borderTop: "1px solid rgba(255,255,255,0.06)",
                    color: "#444",
                    fontSize: "12px"
                }}>
                    <span style={{ color: "var(--gold)", fontWeight: 700 }}>AL SHAYEB</span> Management System
                    &nbsp;|&nbsp; تقرير آلي — {new Date().toLocaleString("ar-JO")}
                </div>
            </div>

            {/* ===== Print Styles ===== */}
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
                        margin-right: 0 !important;
                        padding: 0 !important;
                        width: 100% !important;
                    }

                    .print-area { padding: 20px !important; }

                    /* Full page white background */
                    html, body {
                        background: #fff !important;
                        color: #2D2D2D !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    
                    /* Override dark theme for print */
                    .stat-card {
                        background: #f9f9f9 !important;
                        border: 1px solid #ddd !important;
                        break-inside: avoid;
                    }
                    .custom-table {
                        background: #fff !important;
                        border: 1px solid #ddd !important;
                    }
                    .custom-table th {
                        background: #E6B31E !important;
                        color: #000 !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .custom-table td {
                        color: #333 !important;
                        border-bottom: 1px solid #eee !important;
                    }
                    .stat-value { color: #2D2D2D !important; }
                    .stat-label { color: #555 !important; }
                    .badge { -webkit-print-color-adjust: exact; print-color-adjust: exact; }

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
