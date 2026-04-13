import React, { useEffect, useState } from "react";
import { fetchOrders, updateOrderStatus } from "../../../lib/api/orders";
import { formatCurrency } from "../../../utils/formatCurrency";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  async function refresh() {
    setLoading(true);
    const data = await fetchOrders();
    setOrders(data);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function changeStatus(order, status) {
    try {
      const confirm = await window.Swal.fire({
        title: "تحديث حالة الشحنة؟",
        text: `هل تود نقل الطلب إلى حالة "${status === "pending" ? "جديد" : status === "processing" ? "جاري التجهيز" : status === "shipped" ? "تم الشحن" : "مكتمل"}"؟`,
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "var(--color-primary)",
        cancelButtonText: "إلغاء",
        confirmButtonText: "تأكيد التحديث"
      });
      if (!confirm.isConfirmed) return;

      await updateOrderStatus(order, status);
      window.Swal.fire({
        icon: "success",
        title: "تم التحديث",
        text: "تم تحديث الحالة وإرسال إشعار للمستودع.",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000
      });
      refresh();
    } catch (error) {
      window.Swal.fire("خطأ", error.message || "تعذر تحديث الطلب", "error");
    }
  }

  const counts = {
    all: orders.length,
    pending: orders.filter((order) => (order.status || "pending") === "pending").length,
    processing: orders.filter((order) => order.status === "processing").length,
    shipped: orders.filter((order) => order.status === "shipped").length,
    completed: orders.filter((order) => order.status === "completed").length
  };

  const filteredOrders = orders.filter((order) => {
    const status = order.status || "pending";
    const matchesFilter = filter === "all" || status === filter;
    const haystack = `${order.customer_name || order.name || ""} ${order.phone || ""} ${order.order_ref || order.id || ""}`.toLowerCase();
    const matchesSearch = !search || haystack.includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <>
      <div className="admin-header">
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div className="admin-title-icon secondary"><i className="fa-solid fa-boxes-packing" /></div>
          <div>
            <h1 className="admin-title">نظام إدارة الطلبات الفردية</h1>
            <p style={{ fontSize: 13, color: "var(--color-text-muted)", fontWeight: 700 }}>إتمام عمليات التجارة الإلكترونية • مباشر</p>
          </div>
        </div>
        <div className="admin-actions" style={{ gap: 10, display: "flex", alignItems: "center" }}>
          <button className="btn btn-outline" style={{ background: "white", display: "flex", alignItems: "center", gap: 8, fontWeight: 700, padding: "10px 20px", borderRadius: 12, border: "1.5px solid #ddd", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", cursor: "pointer" }}>
            <i className="fa-solid fa-file-csv" style={{ color: "var(--color-primary)", fontSize: 16 }} />
            تصدير مالي
          </button>
          <button className="btn btn-primary" onClick={refresh} style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, padding: "10px 20px", borderRadius: 12, cursor: "pointer" }}>
            <i className="fa-solid fa-rotate-right" />
            مزامنة الطلبات
          </button>
        </div>
      </div>

      <div className="admin-filter-bar-luxe">
         <div className="filter-stats-luxe">
            {[
              { id: "all", label: "الكل", count: counts.all, icon: "fa-list" },
              { id: "pending", label: "جديد", count: counts.pending, icon: "fa-clock" },
              { id: "processing", label: "تجهيز", count: counts.processing, icon: "fa-box-open" },
              { id: "shipped", label: "شحن", count: counts.shipped, icon: "fa-truck" },
              { id: "completed", label: "مكتمل", count: counts.completed, icon: "fa-check-double" }
            ].map(f => (
              <button key={f.id} className={`filter-item-luxe ${filter === f.id ? "active" : ""}`} onClick={() => setFilter(f.id)}>
                 <span className="filter-icon"><i className={`fa-solid ${f.icon}`} /></span>
                 <span className="filter-label">{f.label}</span>
                 <span className="filter-badge">{f.count}</span>
              </button>
            ))}
         </div>
         <div className="filter-search-luxe">
            <i className="fa-solid fa-magnifying-glass" />
            <input placeholder="ابحث برقم الطلب، الاسم، أو الهاتف..." value={search} onChange={(e) => setSearch(e.target.value)} />
         </div>
      </div>

      <div className="admin-card-luxe">
        {loading ? (
          <div style={{ textAlign: "center", padding: 80 }}><div className="react-loader" /></div>
        ) : (
          <div className="admin-modern-table-container">
            <table className="admin-recent-table">
              <thead>
                <tr>
                  <th>رقم المرجع</th>
                  <th>صاحب الطلب</th>
                  <th>تاريخ العمليّة</th>
                  <th>المبلغ الإجمالي</th>
                  <th>الحالة اللوجستية</th>
                  <th>تغيير الحالة</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length ? filteredOrders.map((o) => (
                  <tr key={o.id || o.order_ref}>
                    <td style={{ fontWeight: 950, color: "var(--color-secondary)", fontFamily: "monospace", fontSize: 16 }}>#{o.order_ref || String(o.id || "").slice(0, 8) || "---"}</td>
                    <td>
                      <div className="customer-cell">
                        <div className="avatar-mini">{o.customer_name?.[0] || o.name?.[0] || "U"}</div>
                        <div>
                          <div style={{ fontWeight: 800 }}>{o.customer_name || o.name || "عميل"}</div>
                          <div style={{ fontSize: 11, opacity: 0.6 }}>{o.phone || "---"}</div>
                        </div>
                      </div>
                    </td>
                    <td>{o.created_at ? new Date(o.created_at).toLocaleDateString("ar-JO") : "---"}</td>
                    <td style={{ fontWeight: 900 }}>{formatCurrency(o.total)}</td>
                    <td><span className={`status-pill ${o.status || "pending"}`}>{o.status === "pending" ? "جديد" : o.status === "processing" ? "قيد التجهيز" : o.status === "shipped" ? "تم الشحن" : "مكتمل"}</span></td>
                    <td>
                       <select className="luxe-select" value={o.status || "pending"} onChange={(e) => changeStatus(o, e.target.value)}>
                          <option value="pending">جديد (New)</option>
                          <option value="processing">جاري التجهيز (Processing)</option>
                          <option value="shipped">تم الشحن (Shipped)</option>
                          <option value="completed">مكتمل (Completed)</option>
                       </select>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="6" style={{ textAlign: "center", padding: 60, opacity: 0.5, fontWeight: 800 }}>لا توجد طلبات تطابق معايير البحث الحالية.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
