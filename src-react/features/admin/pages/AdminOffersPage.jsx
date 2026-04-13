import React, { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { fetchProducts } from "../../../lib/api/products";
import { formatCurrency } from "../../../utils/formatCurrency";
import { normalizeImagePath, detectLegacyCategory } from "../../../utils/imageUtils";

const EMPTY_FORM = {
  sale_price: "",
  sale_ends_at: "",
  badge_label: "",
  is_on_sale: true,
};

export default function AdminOffersPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null); // productId being saved
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // all | on_sale | off_sale
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  async function refresh() {
    setLoading(true);
    const data = await fetchProducts();
    // include drafts too for admin
    const { data: all } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    setProducts(all || data || []);
    setLoading(false);
  }

  useEffect(() => { refresh(); }, []);

  function openEdit(product) {
    setEditingId(product.id);
    setForm({
      sale_price: product.sale_price ?? "",
      sale_ends_at: product.sale_ends_at ? product.sale_ends_at.slice(0, 10) : "",
      badge_label: product.badge_label ?? "",
      is_on_sale: !!product.is_on_sale,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function saveOffer(product) {
    if (!form.sale_price || Number(form.sale_price) <= 0) {
      window.Swal.fire("ملاحظة", "أدخل سعر العرض أولاً.", "warning");
      return;
    }
    if (Number(form.sale_price) >= Number(product.price)) {
      window.Swal.fire("ملاحظة", "سعر العرض يجب أن يكون أقل من السعر الأصلي.", "warning");
      return;
    }
    setSaving(product.id);
    try {
      const { error } = await supabase.from("products").update({
        is_on_sale: form.is_on_sale,
        sale_price: Number(form.sale_price),
        sale_ends_at: form.sale_ends_at ? new Date(form.sale_ends_at).toISOString() : null,
        badge_label: form.badge_label || null,
      }).eq("id", product.id);

      if (error) throw error;

      window.Swal.fire({ icon: "success", title: "تم الحفظ", text: "تم تحديث العرض بنجاح.", timer: 1400, showConfirmButton: false });
      cancelEdit();
      refresh();
    } catch (e) {
      window.Swal.fire("خطأ", e.message, "error");
    } finally {
      setSaving(null);
    }
  }

  async function toggleSale(product) {
    const newVal = !product.is_on_sale;
    try {
      await supabase.from("products").update({ is_on_sale: newVal }).eq("id", product.id);
      setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, is_on_sale: newVal } : p));
    } catch (e) {
      window.Swal.fire("خطأ", e.message, "error");
    }
  }

  async function removeOffer(product) {
    const res = await window.Swal.fire({
      title: "إزالة العرض؟",
      text: "سيُلغى العرض ويعود السعر الأصلي.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#c0392b",
      confirmButtonText: "نعم، إزالة",
      cancelButtonText: "إلغاء",
    });
    if (!res.isConfirmed) return;
    await supabase.from("products").update({
      is_on_sale: false, sale_price: null, sale_ends_at: null, badge_label: null
    }).eq("id", product.id);
    refresh();
  }

  const filtered = products.filter((p) => {
    const matchSearch = (p.name || "").toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" ? true : filter === "on_sale" ? p.is_on_sale : !p.is_on_sale;
    return matchSearch && matchFilter;
  });

  const onSaleCount = products.filter((p) => p.is_on_sale).length;
  const totalSavings = products.filter(p => p.is_on_sale && p.sale_price).reduce((s, p) => s + (p.price - p.sale_price), 0);

  return (
    <div className="admin-page-content">
      {/* ── Header ── */}
      <div className="admin-header">
        <div>
          <h1 className="admin-title">إدارة العروض</h1>
          <p style={{ color: "rgba(10,31,20,0.5)", fontSize: 14, marginTop: 4 }}>
            تحكم كامل بعروض المنتجات وأسعارها المخفضة
          </p>
        </div>
        <div className="admin-user-profile">
          <div className="profile-text"><b>المدير العام</b><br /><small>نظام العروض</small></div>
          <div className="avatar"><i className="fa-solid fa-tag" /></div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="offers-admin-stats">
        <div className="offers-admin-stat-card">
          <i className="fa-solid fa-fire offers-admin-stat-icon" style={{ color: "#e74c3c" }} />
          <div>
            <strong>{onSaleCount}</strong>
            <span>منتج في العروض</span>
          </div>
        </div>
        <div className="offers-admin-stat-card">
          <i className="fa-solid fa-boxes-stacked offers-admin-stat-icon" style={{ color: "#3498db" }} />
          <div>
            <strong>{products.length}</strong>
            <span>إجمالي المنتجات</span>
          </div>
        </div>
        <div className="offers-admin-stat-card">
          <i className="fa-solid fa-coins offers-admin-stat-icon" style={{ color: "var(--color-secondary)" }} />
          <div>
            <strong>{formatCurrency(totalSavings)}</strong>
            <span>إجمالي التوفير للعميل</span>
          </div>
        </div>
        <div className="offers-admin-stat-card">
          <i className="fa-solid fa-percent offers-admin-stat-icon" style={{ color: "#27ae60" }} />
          <div>
            <strong>
              {onSaleCount > 0
                ? Math.round((products.filter(p => p.is_on_sale && p.sale_price).reduce((s, p) => s + ((p.price - p.sale_price) / p.price) * 100, 0) / onSaleCount))
                : 0}%
            </strong>
            <span>متوسط نسبة الخصم</span>
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="admin-card" style={{ marginBottom: 24 }}>
        <div className="card-header-flex">
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { key: "all",      label: "الكل" },
              { key: "on_sale",  label: "في العروض" },
              { key: "off_sale", label: "بدون عرض" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                style={{
                  padding: "8px 18px", borderRadius: 50, border: "1.5px solid",
                  borderColor: filter === f.key ? "var(--color-primary)" : "#ddd",
                  background: filter === f.key ? "var(--color-primary)" : "white",
                  color: filter === f.key ? "var(--color-secondary)" : "rgba(10,31,20,0.6)",
                  fontFamily: "var(--font-base)", fontWeight: 700, fontSize: 13, cursor: "pointer",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="admin-search-box">
            <i className="fa-solid fa-magnifying-glass" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث عن منتج..." />
          </div>
        </div>
      </div>

      {/* ── Products Table ── */}
      <div className="admin-card">
        <h2 className="admin-card-title" style={{ marginBottom: 20 }}>
          <i className="fa-solid fa-list" /> قائمة المنتجات
        </h2>

        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "rgba(10,31,20,0.4)" }}>
            <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 32, marginBottom: 16, display: "block" }} />
            جارِ التحميل...
          </div>
        ) : (
          <div className="offers-admin-list">
            {filtered.map((product) => {
              const isEditing = editingId === product.id;
              const discount = product.sale_price
                ? Math.round(((product.price - product.sale_price) / product.price) * 100)
                : 0;
              const cat = product.category || detectLegacyCategory(product.name, product.image_url);

              return (
                <div key={product.id} className={`offers-admin-row ${product.is_on_sale ? "is-on-sale" : ""} ${isEditing ? "is-editing" : ""}`}>
                  {/* Product info */}
                  <div className="offers-admin-row-info">
                    <img
                      src={normalizeImagePath(product.image_url, cat)}
                      alt={product.name}
                      className="offers-admin-row-img"
                      onError={(e) => { e.target.src = "assets/images/logo-gold.svg"; }}
                    />
                    <div className="offers-admin-row-meta">
                      <div className="offers-admin-row-name">{product.name}</div>
                      <div className="offers-admin-row-cat">{product.category}</div>
                      <div className="offers-admin-row-price">
                        <span className="price-original">{formatCurrency(product.price)}</span>
                        {product.sale_price && (
                          <>
                            <span style={{ color: "#e74c3c", fontWeight: 900 }}>← {formatCurrency(product.sale_price)}</span>
                            <span className="offers-admin-discount-badge">-{discount}%</span>
                          </>
                        )}
                      </div>
                      {product.sale_ends_at && (
                        <div style={{ fontSize: 12, color: "#e74c3c", marginTop: 4 }}>
                          <i className="fa-regular fa-clock" /> ينتهي: {new Date(product.sale_ends_at).toLocaleDateString("ar-JO")}
                        </div>
                      )}
                      {product.badge_label && (
                        <span style={{ display: "inline-block", marginTop: 4, background: "var(--color-primary)", color: "var(--color-secondary)", fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20 }}>
                          {product.badge_label}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status toggle */}
                  <div className="offers-admin-row-status">
                    <button
                      className={`offers-toggle-btn ${product.is_on_sale ? "active" : ""}`}
                      onClick={() => toggleSale(product)}
                      title={product.is_on_sale ? "إيقاف العرض" : "تفعيل العرض"}
                    >
                      <i className={`fa-solid ${product.is_on_sale ? "fa-toggle-on" : "fa-toggle-off"}`} />
                      {product.is_on_sale ? "فعّال" : "موقوف"}
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="offers-admin-row-actions">
                    {!isEditing ? (
                      <>
                        <button className="action-icon edit" onClick={() => openEdit(product)} title="تعديل العرض">
                          <i className="fa-solid fa-pen-nib" />
                        </button>
                        {product.sale_price && (
                          <button className="action-icon delete" onClick={() => removeOffer(product)} title="إزالة العرض">
                            <i className="fa-solid fa-xmark" />
                          </button>
                        )}
                      </>
                    ) : (
                      <button className="action-icon" onClick={cancelEdit} title="إلغاء" style={{ background: "#f0f0f0", color: "#666" }}>
                        <i className="fa-solid fa-xmark" />
                      </button>
                    )}
                  </div>

                  {/* Edit form — inline */}
                  {isEditing && (
                    <div className="offers-admin-edit-form">
                      <div className="offers-admin-edit-grid">
                        <div className="offers-admin-edit-field">
                          <label><i className="fa-solid fa-tag" /> سعر العرض (JOD)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={form.sale_price}
                            onChange={(e) => setForm({ ...form, sale_price: e.target.value })}
                            placeholder={`أقل من ${product.price}`}
                          />
                          {form.sale_price && Number(form.sale_price) < Number(product.price) && (
                            <small style={{ color: "#27ae60", fontWeight: 700 }}>
                              خصم {Math.round(((product.price - form.sale_price) / product.price) * 100)}% ✓
                            </small>
                          )}
                        </div>

                        <div className="offers-admin-edit-field">
                          <label><i className="fa-regular fa-calendar" /> تاريخ انتهاء العرض</label>
                          <input
                            type="date"
                            value={form.sale_ends_at}
                            onChange={(e) => setForm({ ...form, sale_ends_at: e.target.value })}
                          />
                        </div>

                        <div className="offers-admin-edit-field">
                          <label><i className="fa-solid fa-star" /> شارة مخصصة (اختياري)</label>
                          <input
                            type="text"
                            value={form.badge_label}
                            onChange={(e) => setForm({ ...form, badge_label: e.target.value })}
                            placeholder="مثال: الأكثر مبيعاً، جديد، محدود"
                          />
                        </div>

                        <div className="offers-admin-edit-field" style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <label style={{ margin: 0 }}>
                            <i className="fa-solid fa-toggle-on" /> تفعيل العرض فوراً
                          </label>
                          <input
                            type="checkbox"
                            checked={form.is_on_sale}
                            onChange={(e) => setForm({ ...form, is_on_sale: e.target.checked })}
                            style={{ width: 20, height: 20, cursor: "pointer" }}
                          />
                        </div>
                      </div>

                      <button
                        className="btn btn-primary"
                        onClick={() => saveOffer(product)}
                        disabled={saving === product.id}
                        style={{ marginTop: 16 }}
                      >
                        {saving === product.id
                          ? <><i className="fa-solid fa-spinner fa-spin" /> جارِ الحفظ...</>
                          : <><i className="fa-solid fa-shield-check" /> حفظ العرض</>
                        }
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div style={{ textAlign: "center", padding: 60, color: "rgba(10,31,20,0.4)" }}>
                <i className="fa-solid fa-search" style={{ fontSize: 36, marginBottom: 12, display: "block" }} />
                لا توجد منتجات مطابقة
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
