import React, { useEffect, useState } from "react";
import { fetchCoupons, insertCoupon } from "../../../lib/api/coupons";

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ code: "", discount_value: "", discount_type: "percent", is_active: true });

  async function refresh() {
    setLoading(true);
    setCoupons(await fetchCoupons());
    setLoading(false);
  }
  useEffect(() => { refresh(); }, []);

  async function createCoupon() {
    if (!form.code || !form.discount_value) return window.Swal.fire("تنبيه", "يرجى تعبئة كافة الحقول", "warning");
    try {
      await insertCoupon({ ...form, code: form.code.toUpperCase().trim(), discount_value: Number(form.discount_value) });
      window.Swal.fire({ icon: "success", title: "تم تفعيل الكوبون", toast: true, position: "top-end", showConfirmButton: false, timer: 3000 });
      setForm({ code: "", discount_value: "", discount_type: "percent", is_active: true });
      refresh();
    } catch (error) { window.Swal.fire("خطأ", "فشل إنشاء كوبون جديد", "error"); }
  }

  return (
    <>
      <div className="admin-header">
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div className="admin-title-icon secondary"><i className="fa-solid fa-tags" /></div>
          <div>
            <h1 className="admin-title">نظام إدارة التخفيضات والكوبونات</h1>
            <p style={{ fontSize: 13, color: "var(--color-text-muted)", fontWeight: 700 }}>محرك الخصومات الذكي • v3.0</p>
          </div>
        </div>
      </div>

      <div className="admin-overview-layout">
        <div className="admin-overview-main">
          <div className="admin-card-luxe">
            <div className="card-header-luxe">
               <h2 className="card-title-luxe"><i className="fa-solid fa-ticket-simple" /> الكوبونات النشطة حالياً</h2>
            </div>
            {loading ? (
              <div style={{ padding: 40, textAlign: "center" }}><div className="react-loader" /></div>
            ) : (
              <div className="admin-modern-table-container">
                <table className="admin-recent-table">
                  <thead>
                    <tr>
                      <th>كود الخصم</th>
                      <th>قيمة التخفيض</th>
                      <th>النوع</th>
                      <th>الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coupons.map((c) => (
                      <tr key={c.id}>
                        <td style={{ fontWeight: 950, color: "var(--color-secondary)", letterSpacing: 1.5, fontSize: 16 }}>{c.code}</td>
                        <td style={{ fontWeight: 900, fontSize: 18 }}>{c.discount_value}{c.discount_type === "percent" ? "%" : ""}</td>
                        <td style={{ fontWeight: 700, color: "var(--color-text-muted)" }}>{c.discount_type === "percent" ? "نسبة مئوية" : "مبلغ ثابت (JOD)"}</td>
                        <td><span className={`status-pill ${c.is_active ? "completed" : "pending"}`}>{c.is_active ? "نشط وفعال" : "متوقف"}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="admin-overview-aside">
          <div className="admin-card-luxe">
            <div className="card-header-luxe">
               <h2 className="card-title-luxe"><i className="fa-solid fa-plus-circle" /> إصدار كوبون جديد</h2>
            </div>
            <div className="luxe-form-stack">
               <div className="luxe-field">
                  <label>رمز الكوبون الإعلاني</label>
                  <input placeholder="مثلاً: ALHASON2025" style={{ textTransform: "uppercase" }} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
               </div>
               <div className="luxe-grid-2">
                  <div className="luxe-field">
                    <label>القيمة</label>
                    <input type="number" placeholder="20" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: e.target.value })} />
                  </div>
                  <div className="luxe-field">
                    <label>النوع</label>
                    <select value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })}>
                       <option value="percent">نسبة مئوية (%)</option>
                       <option value="fixed">مبلغ ثابت (JOD)</option>
                    </select>
                  </div>
               </div>
               <button className="btn btn-primary luxe-full" onClick={createCoupon}>تنشيط الكوبون فوراً <i className="fa-solid fa-bolt" /></button>
            </div>
          </div>
          <div className="coupon-visual-preview">
             <div className="ticket-cut" />
             <div className="ticket-info">
                <span>{form.code || "----"}</span>
                <small>{form.discount_value || "0"}{form.discount_type === "percent" ? "% OFF" : " JOD OFF"}</small>
             </div>
          </div>
        </div>
      </div>
    </>
  );
}
