import React, { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { fetchAllCategories, upsertCategory, deleteCategory } from "../../../lib/api/categories";

const EMPTY_FORM = {
  key: "",
  name: "",
  description: "",
  image_url: "",
  accent_color: "#c8943a",
  icon: "fa-solid fa-box",
  sort_order: 0,
  is_active: true,
};

const ICON_OPTIONS = [
  { value: "fa-solid fa-mug-hot", label: "قهوة" },
  { value: "fa-solid fa-leaf", label: "نباتات" },
  { value: "fa-solid fa-pepper-hot", label: "بهارات" },
  { value: "fa-solid fa-candy-cane", label: "حلويات" },
  { value: "fa-solid fa-wheat-awn", label: "حبوب" },
  { value: "fa-solid fa-bread-slice", label: "مخبوزات" },
  { value: "fa-solid fa-fish", label: "مأكولات بحرية" },
  { value: "fa-solid fa-apple-whole", label: "فواكه" },
  { value: "fa-solid fa-carrot", label: "خضروات" },
  { value: "fa-solid fa-box", label: "عام" },
];

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function refresh() {
    setCategories(await fetchAllCategories());
  }

  useEffect(() => { refresh(); }, []);

  function editCategory(cat) {
    setEditingId(cat.id);
    setForm({
      key: cat.key || "",
      name: cat.name || "",
      description: cat.description || "",
      image_url: cat.image_url || "",
      accent_color: cat.accent_color || "#c8943a",
      icon: cat.icon || "fa-solid fa-box",
      sort_order: cat.sort_order ?? 0,
      is_active: cat.is_active ?? true,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `category-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("products")
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("products").getPublicUrl(filePath);
      setForm((prev) => ({ ...prev, image_url: publicUrl }));

      window.Swal.fire({ icon: "success", title: "تم رفع الصورة", timer: 1500, showConfirmButton: false });
    } catch (err) {
      window.Swal.fire("خطأ", "فشل رفع الصورة: " + err.message, "error");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit() {
    if (!form.key || !form.name) {
      window.Swal.fire("ملاحظة", "المفتاح والاسم حقول أساسية.", "warning");
      return;
    }
    // key must be lowercase letters/numbers/underscores only
    if (!/^[a-z0-9_]+$/.test(form.key)) {
      window.Swal.fire("خطأ", "المفتاح يجب أن يكون حروف إنجليزية صغيرة وأرقام فقط (مثلاً: bakery أو dry_fruits)", "warning");
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, sort_order: Number(form.sort_order) };
      if (editingId) payload.id = editingId;
      await upsertCategory(payload);
      window.Swal.fire({
        icon: "success",
        title: editingId ? "تم التحديث" : "تمت الإضافة",
        timer: 1500,
        showConfirmButton: false,
      });
      cancelEdit();
      refresh();
    } catch (err) {
      window.Swal.fire("خطأ", err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id, name) {
    const confirm = await window.Swal.fire({
      title: `حذف "${name}"؟`,
      text: "سيتم حذف الفئة. المنتجات المرتبطة بها لن تُحذف لكنها ستبقى بدون فئة.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#c0392b",
      confirmButtonText: "نعم، احذف",
      cancelButtonText: "إلغاء",
    });
    if (!confirm.isConfirmed) return;
    try {
      await deleteCategory(id);
      window.Swal.fire({ icon: "success", title: "تم الحذف", timer: 1200, showConfirmButton: false });
      refresh();
    } catch (err) {
      window.Swal.fire("خطأ", err.message, "error");
    }
  }

  async function toggleActive(cat) {
    try {
      await upsertCategory({ id: cat.id, key: cat.key, name: cat.name, is_active: !cat.is_active });
      refresh();
    } catch (err) {
      window.Swal.fire("خطأ", err.message, "error");
    }
  }

  return (
    <div className="admin-page-content">
      <div className="admin-header">
        <h1 className="admin-title">
          {editingId ? "تعديل فئة" : "إضافة فئة جديدة"}
        </h1>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {editingId && (
            <button className="btn btn-outline" onClick={cancelEdit}>
              <i className="fa-solid fa-xmark" style={{ marginLeft: 8 }} /> إلغاء
            </button>
          )}
          <div className="admin-user-profile">
            <div className="profile-text"><b>إدارة الفئات</b><br /><small>تحكم كامل بالأصناف</small></div>
            <div className="avatar"><i className="fa-solid fa-tags" /></div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="admin-card product-card-form" style={{ marginBottom: 40 }}>
        <div className="react-form-grid">

          <div className="react-field">
            <label><i className="fa-solid fa-key" /> مفتاح الفئة (بالإنجليزية)</label>
            <input
              value={form.key}
              onChange={(e) => setForm({ ...form, key: e.target.value.toLowerCase().replace(/\s/g, "_") })}
              placeholder="مثلاً: bakery أو dry_fruits"
              disabled={!!editingId}
            />
            <small style={{ color: "rgba(0,0,0,0.45)", marginTop: 4, display: "block" }}>
              يُستخدم لتصنيف المنتجات — لا يمكن تغييره بعد الإنشاء
            </small>
          </div>

          <div className="react-field">
            <label><i className="fa-solid fa-tag" /> اسم الفئة (عربي)</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="مثلاً: المخبوزات الطازجة"
            />
          </div>


          <div className="react-field">
            <label><i className="fa-solid fa-arrow-up-1-9" /> ترتيب العرض</label>
            <input
              type="number"
              value={form.sort_order}
              onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
              min={0}
            />
          </div>

          <div className="react-field">
            <label><i className="fa-solid fa-toggle-on" /> الحالة</label>
            <select value={form.is_active ? "true" : "false"} onChange={(e) => setForm({ ...form, is_active: e.target.value === "true" })}>
              <option value="true">مفعّلة — تظهر في المتجر</option>
              <option value="false">مخفية — لا تظهر في المتجر</option>
            </select>
          </div>

          <div className="react-field full">
            <label><i className="fa-solid fa-camera" /> صورة الفئة</label>
            <div className="admin-file-upload">
              <input type="file" id="cat-file" accept="image/*" onChange={handleFileUpload} style={{ display: "none" }} />
              <button className="btn btn-outline btn-block" onClick={() => document.getElementById("cat-file").click()} disabled={uploading}>
                {uploading
                  ? <><i className="fa-solid fa-sync fa-spin" style={{ marginLeft: 10 }} /> جاري الرفع...</>
                  : <><i className="fa-solid fa-cloud-arrow-up" style={{ marginLeft: 10 }} /> رفع صورة</>}
              </button>
              <div className="file-url-box">
                <small>رابط الصورة:</small>
                <input
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  placeholder="أو أدخل رابط مباشر..."
                />
              </div>
            </div>
          </div>

          <div className="react-field full">
            <label><i className="fa-solid fa-align-right" /> وصف الفئة</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="وصف مختصر يظهر في الصفحة الرئيسية..."
              rows={3}
            />
          </div>

        </div>

        {/* Preview */}
        {(form.name || form.image_url) && (
          <div style={{ margin: "24px 0 0", padding: "20px", background: "rgba(0,0,0,0.03)", borderRadius: 16, border: "1px dashed #ddd" }}>
            <small style={{ fontWeight: 700, color: "#888", display: "block", marginBottom: 12 }}>معاينة الكارد</small>
            <div style={{
              display: "inline-flex", flexDirection: "column", borderRadius: 16, overflow: "hidden",
              border: `2px solid ${form.accent_color}`, width: 220, background: "#0a1f14"
            }}>
              {form.image_url && (
                <img src={form.image_url} alt="" style={{ width: "100%", height: 130, objectFit: "cover" }} />
              )}
              <div style={{ padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <i className={form.icon} style={{ color: form.accent_color, fontSize: 16 }} />
                  <strong style={{ color: "#fff", fontSize: 15 }}>{form.name || "اسم الفئة"}</strong>
                </div>
                {form.description && (
                  <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, margin: 0, lineHeight: 1.6 }}>
                    {form.description.substring(0, 60)}{form.description.length > 60 ? "..." : ""}
                  </p>
                )}
                <div style={{ marginTop: 10, padding: "8px 12px", borderRadius: 8, background: form.accent_color, color: "#0a1f14", fontSize: 12, fontWeight: 800, textAlign: "center" }}>
                  تصفح الصنف ←
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="form-action-footer">
          <button className="btn btn-primary btn-lg" onClick={handleSubmit} disabled={saving}>
            {saving
              ? <><i className="fa-solid fa-spinner fa-spin" style={{ marginLeft: 10 }} /> جاري الحفظ...</>
              : <><i className="fa-solid fa-shield-check" style={{ marginLeft: 10 }} /> {editingId ? "تحديث الفئة" : "إضافة الفئة"}</>}
          </button>
        </div>
      </div>

      {/* Categories List */}
      <div className="admin-card">
        <div className="card-header-flex">
          <h2 className="admin-card-title"><i className="fa-solid fa-list" /> الفئات المضافة ({categories.length})</h2>
        </div>
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>الفئة</th>
                <th>المفتاح</th>
                <th style={{ width: 90, textAlign: "center" }}>الترتيب</th>
                <th>الحالة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: "center", padding: 40, color: "#999" }}>لا توجد فئات بعد</td></tr>
              )}
              {categories.map((cat) => (
                <tr key={cat.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      {cat.image_url && (
                        <img src={cat.image_url} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover" }} />
                      )}
                      <div>
                        <div style={{ fontWeight: 800 }}>{cat.name}</div>
                        {cat.description && (
                          <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
                            {cat.description.substring(0, 50)}{cat.description.length > 50 ? "..." : ""}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <code style={{ background: "#f5f5f5", padding: "3px 8px", borderRadius: 6, fontSize: 13 }}>{cat.key}</code>
                  </td>
                  <td style={{ textAlign: "center" }}>{cat.sort_order}</td>
                  <td>
                    <span
                      onClick={() => toggleActive(cat)}
                      style={{
                        cursor: "pointer",
                        padding: "5px 14px",
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 700,
                        background: cat.is_active ? "rgba(39,174,96,0.12)" : "rgba(192,57,43,0.1)",
                        color: cat.is_active ? "#27ae60" : "#c0392b",
                        border: `1px solid ${cat.is_active ? "#27ae60" : "#c0392b"}`,
                      }}
                    >
                      {cat.is_active ? "مفعّلة" : "مخفية"}
                    </span>
                  </td>
                  <td>
                    <div className="action-btns">
                      <button className="action-icon edit" onClick={() => editCategory(cat)} title="تعديل">
                        <i className="fa-solid fa-pen-nib" />
                      </button>
                      <button className="action-icon delete" onClick={() => handleDelete(cat.id, cat.name)} title="حذف">
                        <i className="fa-solid fa-trash-can" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
