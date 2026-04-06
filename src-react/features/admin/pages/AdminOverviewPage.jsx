import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchProducts } from "../../../lib/api/products";
import { fetchOrders } from "../../../lib/api/orders";
import { fetchCoupons } from "../../../lib/api/coupons";
import { fetchB2BCount } from "../../../lib/api/b2b";
import { fetchBookings } from "../../../lib/api/bookings";
import { formatCurrency } from "../../../utils/formatCurrency";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

export default function AdminOverviewPage() {
  const [stats, setStats] = useState({ products: 0, orders: 0, coupons: 0, b2b: 0, todayBookings: 0, totalSales: 0, pendingOrders: 0, growth: "+12.5%" });
  const [latestOrders, setLatestOrders] = useState([]);
  const [todayBookingsList, setTodayBookingsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const today = new Date().toISOString().split("T")[0];
      const [products, orders, coupons, b2b, bookings] = await Promise.all([
        fetchProducts(),
        fetchOrders(),
        fetchCoupons(),
        fetchB2BCount(),
        fetchBookings(today)
      ]);
      if (!mounted) return;

      const totalSales = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
      const pendingOrders = orders.filter((order) => (order.status || "pending") === "pending").length;

      setStats({
        products: products.length,
        orders: orders.length,
        coupons: coupons.length,
        b2b,
        todayBookings: bookings.length,
        totalSales,
        pendingOrders,
        growth: orders.length > 5 ? "+18.2%" : "+5.0%"
      });
      setLatestOrders(orders.slice(0, 5));
      setTodayBookingsList(bookings.slice(0, 6));
      setLoading(false);
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const metrics = [
    { label: "إجمالي المبيعات", value: stats.totalSales, icon: "fa-solid fa-coins", tone: "success", meta: "JOD", growth: stats.growth },
    { label: "إجمالي الطلبات", value: stats.orders, icon: "fa-solid fa-receipt", tone: "secondary", meta: "طلب", growth: "+4.1%" },
    { label: "قيد المراجعة", value: stats.pendingOrders, icon: "fa-solid fa-hourglass-half", tone: "danger", meta: "جديد", growth: "-2.5%" },
    { label: "شركاء B2B", value: stats.b2b, icon: "fa-solid fa-handshake", tone: "primary", meta: "شريك", growth: "+1" }
  ];

  async function generatePDF() {
    setPdfLoading(true);
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" });

    // Build a hidden printable div
    const container = document.createElement("div");
    container.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:794px;background:white;font-family:Tajawal,Arial,sans-serif;direction:rtl;display:inline-block;";
    container.innerHTML = `
      <div style="background:#0a1f14;padding:32px;text-align:center;">
        <div style="color:#c8943a;font-size:22px;font-weight:900;letter-spacing:2px;">AL-HASOON</div>
        <div style="color:#fff;font-size:13px;margin-top:6px;opacity:0.85;">تقرير الأداء الاستراتيجي</div>
        <div style="color:#aaa;font-size:11px;margin-top:4px;">${dateStr}</div>
      </div>

      <div style="padding:28px 32px;">
        <div style="font-size:14px;font-weight:800;color:#0a1f14;margin-bottom:10px;border-bottom:2px solid #c8943a;padding-bottom:6px;">مؤشرات الأداء الرئيسية</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:28px;">
          <div style="background:#f7f7f7;border-radius:10px;padding:16px 18px;">
            <div style="font-size:11px;color:#888;margin-bottom:6px;">إجمالي المبيعات</div>
            <div style="font-size:20px;font-weight:900;color:#0a1f14;">${formatCurrency(stats.totalSales)}</div>
            <div style="font-size:11px;color:#27ae60;margin-top:4px;">${stats.growth}</div>
          </div>
          <div style="background:#f7f7f7;border-radius:10px;padding:16px 18px;">
            <div style="font-size:11px;color:#888;margin-bottom:6px;">إجمالي الطلبات</div>
            <div style="font-size:20px;font-weight:900;color:#0a1f14;">${stats.orders} طلب</div>
            <div style="font-size:11px;color:#27ae60;margin-top:4px;">+4.1%</div>
          </div>
          <div style="background:#f7f7f7;border-radius:10px;padding:16px 18px;">
            <div style="font-size:11px;color:#888;margin-bottom:6px;">قيد المراجعة</div>
            <div style="font-size:20px;font-weight:900;color:#0a1f14;">${stats.pendingOrders} جديد</div>
            <div style="font-size:11px;color:#c0392b;margin-top:4px;">-2.5%</div>
          </div>
          <div style="background:#f7f7f7;border-radius:10px;padding:16px 18px;">
            <div style="font-size:11px;color:#888;margin-bottom:6px;">شركاء B2B</div>
            <div style="font-size:20px;font-weight:900;color:#0a1f14;">${stats.b2b} شريك</div>
            <div style="font-size:11px;color:#27ae60;margin-top:4px;">+1</div>
          </div>
        </div>

        <div style="font-size:14px;font-weight:800;color:#0a1f14;margin-bottom:10px;border-bottom:2px solid #c8943a;padding-bottom:6px;">أحدث الطلبات</div>
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
          <thead>
            <tr style="background:#0a1f14;color:white;">
              <th style="padding:10px 12px;text-align:right;">العميل</th>
              <th style="padding:10px 12px;text-align:right;">التاريخ</th>
              <th style="padding:10px 12px;text-align:right;">الحالة</th>
              <th style="padding:10px 12px;text-align:right;">المبلغ</th>
              <th style="padding:10px 12px;text-align:right;">المرجع</th>
            </tr>
          </thead>
          <tbody>
            ${latestOrders.map((order, i) => `
              <tr style="background:${i % 2 === 0 ? "#fafafa" : "#f2f2f2"};">
                <td style="padding:10px 12px;">${order.customer_name || order.name || "---"}</td>
                <td style="padding:10px 12px;">${order.created_at ? new Date(order.created_at).toLocaleDateString("en-GB") : "---"}</td>
                <td style="padding:10px 12px;color:${order.status === "completed" ? "#27ae60" : order.status === "cancelled" ? "#c0392b" : "#e67e22"};">
                  ${order.status === "completed" ? "مكتمل" : order.status === "cancelled" ? "ملغي" : "قيد المراجعة"}
                </td>
                <td style="padding:10px 12px;font-weight:700;">${formatCurrency(order.total)}</td>
                <td style="padding:10px 12px;font-size:11px;color:#888;">${order.order_ref || order.id || "---"}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>

      <div style="background:#0a1f14;padding:14px;text-align:center;color:#aaa;font-size:10px;">
        Al-Hasoon Luxury Goods  •  Confidential Report  •  Generated by Admin System
      </div>
    `;

    document.body.appendChild(container);
    try {
      const canvas = await html2canvas(container, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const W = pdf.internal.pageSize.getWidth();
      const H = pdf.internal.pageSize.getHeight();
      const imgH = (canvas.height * W) / canvas.width;
      let y = 0;
      while (y < imgH) {
        if (y > 0) pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, -y, W, imgH);
        y += H;
      }
      pdf.save(`al-hasoon-report-${now.toISOString().split("T")[0]}.pdf`);
    } finally {
      document.body.removeChild(container);
      setPdfLoading(false);
    }
  }

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh", flexDirection: "column", gap: 20 }}>
      <div className="react-loader" />
      <p style={{ fontWeight: 800, color: "var(--color-primary)", opacity: 0.6 }}>جاري تحليل الأداء الاستراتيجي للمنظومة...</p>
    </div>
  );

  return (
    <>
      <div className="admin-header">
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div className="admin-title-icon"><i className="fa-solid fa-chart-line" /></div>
          <div>
            <h1 className="admin-title" style={{ marginBottom: 5 }}>نظرة عامة على الأداء الاستراتيجي</h1>
            <p style={{ fontSize: 13, color: "var(--color-text-muted)", fontWeight: 700 }}>البيانات المباشرة من المحرك السحابي • v.4.5</p>
          </div>
        </div>
        <div className="admin-actions" style={{ gap: 10, display: "flex", alignItems: "center" }}>
          <button
            className="btn btn-outline"
            onClick={generatePDF}
            disabled={pdfLoading}
            style={{ background: "white", display: "flex", alignItems: "center", gap: 8, fontWeight: 700, padding: "10px 20px", borderRadius: 12, border: "1.5px solid #ddd", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", cursor: pdfLoading ? "wait" : "pointer", opacity: pdfLoading ? 0.7 : 1 }}
          >
            <i className={pdfLoading ? "fa-solid fa-spinner fa-spin" : "fa-solid fa-file-pdf"} style={{ color: "#c0392b", fontSize: 16 }} />
            {pdfLoading ? "جاري التوليد..." : "تقرير PDF"}
          </button>
          <button
            className="btn btn-primary"
            onClick={() => window.location.reload()}
            style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, padding: "10px 20px", borderRadius: 12, cursor: "pointer" }}
          >
            <i className="fa-solid fa-arrows-rotate" />
            تحديث
          </button>
        </div>
      </div>

      <div className="react-admin-grid">
        {metrics.map((m) => (
          <div className={`admin-metric-card-luxe ${m.tone}`} key={m.label}>
             <div className="metric-header">
                <div className="metric-icon-box-luxe"><i className={m.icon} /></div>
                <div className={`metric-badge ${m.growth?.startsWith("-") ? "down" : "up"}`}>{m.growth}</div>
             </div>
             <div className="metric-info-luxe">
                <div className="metric-label-luxe">{m.label}</div>
                <div className="metric-value-luxe">
                   {typeof m.value === "number" && m.label.includes("المبيعات") ? m.value.toLocaleString("en-US", { minimumFractionDigits: 2 }) : m.value}
                   <small className="metric-unit-luxe">{m.meta}</small>
                </div>
                <div className="metric-sparkline">
                  <svg width="100%" height="30" viewBox="0 0 100 30" preserveAspectRatio="none">
                    <path
                      d={m.tone === "danger" ? "M0,20 Q25,25 50,15 T100,25" : "M0,25 Q25,20 50,25 T100,5"}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      style={{ opacity: 0.6 }}
                    />
                  </svg>
                </div>
             </div>
          </div>
        ))}
      </div>

      <div className="admin-overview-layout">
        <div className="admin-overview-main">
          <div className="admin-card-luxe">
            <div className="card-header-luxe">
               <h2 className="card-title-luxe"><i className="fa-solid fa-receipt" /> أحدث العمليات النشطة</h2>
               <Link to="/admin/orders" className="link-all">عرض الشامل <i className="fa-solid fa-chevron-left" /></Link>
            </div>
            <div className="admin-modern-table-container">
               <table className="admin-recent-table">
                  <thead>
                     <tr>
                        <th>العميل</th>
                        <th>التاريخ</th>
                        <th>الحالة</th>
                        <th>المبلغ</th>
                        <th>إجراء</th>
                     </tr>
                  </thead>
                  <tbody>
                    {latestOrders.length ? latestOrders.map((order) => (
                      <tr key={order.id || order.order_ref}>
                        <td className="customer-cell">
                          <div className="avatar-mini">{order.customer_name?.[0] || order.name?.[0] || "C"}</div>
                          <span>{order.customer_name || order.name || "عميل مجهول"}</span>
                        </td>
                        <td>{order.created_at ? new Date(order.created_at).toLocaleDateString("ar-JO") : "---"}</td>
                        <td>
                          <span className={`status-pill ${(order.status || "pending")}`}>
                             {order.status === "pending" ? "قيد المراجعة" : order.status === "completed" ? "مكتمل" : "ملغي"}
                          </span>
                        </td>
                        <td className="amount-cell">{formatCurrency(order.total)}</td>
                        <td><Link to="/admin/orders" className="btn-icon-sml"><i className="fa-solid fa-eye" /></Link></td>
                      </tr>
                    )) : (
                      <tr><td colSpan="5" style={{ textAlign: "center", padding: 40, color: "var(--color-text-muted)" }}>لا توجد بيانات متاحة حالياً.</td></tr>
                    )}
                  </tbody>
               </table>
            </div>
          </div>
        </div>

        <div className="admin-overview-aside">
          <div className="admin-card-luxe">
             <div className="card-header-luxe">
                <h2 className="card-title-luxe"><i className="fa-solid fa-calendar-star" /> مواعيد اليوم</h2>
                <div className="badge-count">{todayBookingsList.length}</div>
             </div>
             <div className="booking-list-luxe">
                {todayBookingsList.length ? todayBookingsList.map((booking) => (
                  <div className="booking-item-luxe" key={booking.id}>
                    <div className="booking-time-luxe">{booking.booking_time || "00:00"}</div>
                    <div className="booking-content-luxe">
                       <div className="booking-name-luxe">{booking.customer_name || booking.title}</div>
                       <div className="booking-type-luxe">{booking.booking_type || "تذوق قهوة"}</div>
                    </div>
                    <div className="booking-status-dot" />
                  </div>
                )) : (
                  <div className="booking-empty-state">
                     <i className="fa-solid fa-mug-hot" />
                     <p>يوم هادئ في المحامص.<br/>لا توجد مواعيد مجدولة.</p>
                  </div>
                )}
             </div>
             <Link to="/admin/calendar" className="btn btn-outline" style={{ width: "100%", marginTop: 20, borderRadius: 12 }}>دخول التقويم المركزي</Link>
          </div>

          <div className="admin-promo-card">
              <h3>عضوية النخبة الحصرية</h3>
              <p>استمتع بكافة الميزات المتقدمة وتقارير الذكاء الاصطناعي في نسخة Platinum v4.5.</p>
              <i className="fa-solid fa-crown promo-icon" />
          </div>
        </div>
      </div>
    </>
  );
}
