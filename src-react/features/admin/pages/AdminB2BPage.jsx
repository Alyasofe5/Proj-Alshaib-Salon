import React, { useEffect, useState } from "react";
import { fetchB2BClients, insertB2BClient, setB2BStatus } from "../../../lib/api/b2b";
import CustomSelect from "../../../shared/components/CustomSelect";

const SECTOR_OPTIONS = [
  { value: "retail", label: "تجزئة (Retail)" },
  { value: "horeca", label: "HORECA" },
  { value: "corporate", label: "Corporate" },
];

const STATUS_OPTIONS = [
  { value: "pending", label: "بانتظار المراجعة" },
  { value: "active", label: "عضوية نشطة" },
  { value: "suspended", label: "معطل مؤقتاً" },
];

export default function AdminB2BPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", sector: "retail", phone: "", monthly_qty: "" });

  async function refresh() {
    setLoading(true);
    setClients(await fetchB2BClients());
    setLoading(false);
  }
  useEffect(() => { refresh(); }, []);

  async function submitClient() {
    if (!form.name) return window.Swal.fire("تنبيه", "يرجى إدخال اسم الجهة أو المؤسسة", "warning");
    try {
      await insertB2BClient(form);
      window.Swal.fire({ icon: "success", title: "تم تسجيل الشريك", toast: true, position: "top-end", showConfirmButton: false, timer: 3000 });
      setForm({ name: "", sector: "retail", phone: "", monthly_qty: "" });
      refresh();
    } catch (error) { window.Swal.fire("خطأ", "تعذر تسجيل الشريك الجديد", "error"); }
  }

  async function changeStatus(client, status) {
    try {
      await setB2BStatus(client.id, status);
      refresh();
    } catch (error) { window.Swal.fire("خطأ", "عذراً، فشل تحديث حالة العضوية", "error"); }
  }

  return (
    <>
      <div className="admin-header">
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div className="admin-title-icon primary"><i className="fa-solid fa-handshake-angle" /></div>
          <div>
            <h1 className="admin-title">منظومة شركاء النجاح (B2B)</h1>
            <p style={{ fontSize: 13, color: "var(--color-text-muted)", fontWeight: 700 }}>إدارة عملاء الجملة والتوريد المؤسسي</p>
          </div>
        </div>
      </div>

      <div className="admin-overview-layout">
        <div className="admin-overview-main">
          <div className="admin-card-luxe">
            <div className="card-header-luxe">
               <h2 className="card-title-luxe"><i className="fa-solid fa-building-user" /> قائمة الشركاء المسجلين</h2>
               <div className="badge-count luxe">{clients.length} جهة</div>
            </div>
            {loading ? (
              <div style={{ padding: 40, textAlign: "center" }}><div className="react-loader" /></div>
            ) : (
              <div className="admin-modern-table-container">
                <table className="admin-recent-table">
                  <thead>
                     <tr>
                        <th>الاسم التجاري</th>
                        <th>القطاع</th>
                        <th>المدينة</th>
                        <th>الكمية الشهرية</th>
                        <th>الحالة التعاقدية</th>
                     </tr>
                  </thead>
                  <tbody>
                    {clients.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <div className="customer-cell">
                            <div className="avatar-mini" style={{ background: "#0d47a1" }}><i className="fa-solid fa-city" style={{ fontSize: 12 }} /></div>
                            <div style={{ fontWeight: 800 }}>{c.name}</div>
                          </div>
                        </td>
                        <td>{c.sector === "retail" ? "تجزئة" : c.sector === "horeca" ? "مطاعم وفنادق" : "شركة / مؤسسة"}</td>
                        <td>{c.city || "-"}</td>
                        <td>{c.monthly_qty || "-"}</td>
                        <td>
                          <CustomSelect
                            value={c.contract_status || "pending"}
                            options={STATUS_OPTIONS}
                            onChange={(e) => changeStatus(c, e.target.value)}
                          />
                        </td>
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
               <h2 className="card-title-luxe"><i className="fa-solid fa-user-plus" /> تسجيل جهة جديدة</h2>
            </div>
            <div className="luxe-form-stack">
               <div className="luxe-field">
                  <label>الاسم التجاري للهيئة</label>
                  <input placeholder="مثلاً: فندق الفور سيزونز" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
               </div>
               <div className="luxe-grid-2">
                  <div className="luxe-field">
                    <label>القطاع</label>
                    <CustomSelect
                      name="sector"
                      value={form.sector}
                      options={SECTOR_OPTIONS}
                      onChange={(e) => setForm({ ...form, sector: e.target.value })}
                    />
                  </div>
                  <div className="luxe-field">
                    <label>المدينة</label>
                    <input placeholder="عمان" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                  </div>
               </div>
               <div className="luxe-field">
                  <label>رقم التواصل المباشر</label>
                  <input placeholder="07XXXXXXXX" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
               </div>
               <button className="btn btn-primary luxe-full" onClick={submitClient}>إتمام تسجيل الشريك <i className="fa-solid fa-save" /></button>
            </div>
          </div>
          <div className="admin-promo-card enterprise">
              <h3>حلول الشركات المتكاملة</h3>
              <p>قم بتفعيل لوحة التحكم المخصصة لكل شركة لتمكينهم من الطلب المباشر بأسعار الجملة.</p>
              <i className="fa-solid fa-building-shield promo-icon" />
          </div>
        </div>
      </div>
    </>
  );
}
