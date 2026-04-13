import React, { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { fetchProducts, upsertProduct } from "../../../lib/api/products";
import { fetchAllCategories } from "../../../lib/api/categories";
import { normalizeImagePath } from "../../../utils/imageUtils";
import { formatCurrency } from "../../../utils/formatCurrency";

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("basic");
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    image_url: "",
    category: "coffee",
    inventory: 100,
    weight_options: "250g, 500g, 1kg",
    origin: "",
    roast_level: "",
    taste_profile: "",
    on_sale: false,
    is_on_sale: false,
    sale_price: "",
    sale_ends_at: "",
    badge_label: "",
    stock_status: "in_stock"
  });

  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState([]);

  async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `product-images/${fileName}`;

      const { data, error: uploadError } = await supabase.storage
        .from("products")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("products")
        .getPublicUrl(filePath);

      setForm((prev) => ({ ...prev, image_url: publicUrl }));

      window.Swal.fire({
        icon: "success",
        title: "تم التحميل بنجاح",
        text: "تم رفع الصورة وتحديث الملحق البصري للمنتج.",
        timer: 1500,
        showConfirmButton: false
      });
    } catch (err) {
      console.error("Upload Error:", err);
      window.Swal.fire("عذراً", "فشل تحميل الصورة. يجب إنشاء Bucket باسم 'products' في Supabase للسماح بالتحميل.", "error");
    } finally {
      setUploading(false);
    }
  }

  async function refresh() {
    setProducts(await fetchProducts());
  }

  useEffect(() => {
    refresh();
    fetchAllCategories().then(setCategories);
  }, []);

  function editProduct(product) {
    setEditingId(product.id);
    setForm({
      name: product.name || "",
      description: product.description || "",
      price: product.price || "",
      image_url: product.image_url || "",
      category: product.category || "coffee",
      inventory: product.inventory || 0,
      weight_options: product.weight_options || "250g, 500g, 1kg",
      origin: product.origin || "",
      roast_level: product.roast_level || "",
      taste_profile: product.taste_profile || "",
      on_sale: !!product.on_sale || !!product.is_on_sale,
      is_on_sale: !!product.is_on_sale,
      sale_price: product.sale_price || "",
      sale_ends_at: product.sale_ends_at ? product.sale_ends_at.slice(0, 10) : "",
      badge_label: product.badge_label || "",
      stock_status: product.stock_status || "in_stock"
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submitProduct() {
    if (!form.name || !form.price) {
        window.Swal.fire("ملاحظة", "الاسم والسعر حقول أساسية للمنتج.", "warning");
        return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        inventory: Number(form.inventory),
        is_on_sale: form.on_sale,
        sale_price: form.on_sale && form.sale_price ? Number(form.sale_price) : null,
        sale_ends_at: form.on_sale && form.sale_ends_at ? new Date(form.sale_ends_at).toISOString() : null,
        badge_label: form.badge_label || null,
      };
      if (editingId) payload.id = editingId;
      await upsertProduct(payload);

      window.Swal.fire({
        icon: "success",
        title: editingId ? "تم التحديث" : "تمت الإضافة",
        text: editingId ? "تم تحديث بيانات المنتج بنجاح." : "تم إدراج المنتج الجديد في قائمة المحمصة.",
        confirmButtonColor: "#0a1f14"
      });

      setEditingId(null);
      setForm({ name: "", description: "", price: "", image_url: "", category: "coffee", inventory: 100, weight_options: "250g, 500g, 1kg", origin: "", roast_level: "", taste_profile: "", on_sale: false, is_on_sale: false, sale_price: "", sale_ends_at: "", badge_label: "", stock_status: "in_stock" });
      refresh();
    } catch (error) {
      window.Swal.fire("فشل الحفظ", error.message || "حدث خطأ غير متوقع", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    const confirm = await window.Swal.fire({
      title: "هل أنت متأكد؟",
      text: "سيتم حذف المنتج نهائياً من المتجر وقاعدة البيانات.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#c0392b",
      confirmButtonText: "نعم، حذف نهائي"
    });
    if (confirm.isConfirmed) {
      try {
        await supabase.from("products").delete().eq("id", id);
        window.Swal.fire("تم الحذف", "أصبح المنتج غير متوفر الآن.", "success");
        refresh();
      } catch (e) {
        window.Swal.fire("خطأ", "فشل الحذف", "error");
      }
    }
  }

  const filteredProducts = products.filter((p) =>
    (p.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.category || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-page-content">
      <div className="admin-header">
        <h1 className="admin-title">{editingId ? "تحديث مقتنيات النخبة" : "إضافة إصدار جديد"}</h1>
        <div style={{ display: "flex", gap: 15, alignItems: "center" }}>
          {editingId && (
            <button className="btn btn-outline" onClick={() => { setEditingId(null); setForm({ name: "", description: "", price: "", image_url: "", category: "coffee", inventory: 100, weight_options: "250g, 500g, 1kg", origin: "", roast_level: "", taste_profile: "" }); }} style={{ background: "white", display: "flex", alignItems: "center", gap: 8, fontWeight: 700, padding: "10px 20px", borderRadius: 12, border: "1.5px solid #ddd", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", cursor: "pointer" }}>
              <i className="fa-solid fa-xmark" style={{ fontSize: 16 }} />
              إلغاء الوضع الحالي
            </button>
          )}
          <div className="admin-user-profile">
            <div className="profile-text"><b>المدير العام</b><br/><small>نظام التحكم الماسي</small></div>
            <div className="avatar"><i className="fa-solid fa-user-gear" /></div>
          </div>
        </div>
      </div>

      <div className="product-admin-layout">
        <div className="admin-form-panel">
          <div className="admin-tabs">
            <button className={activeTab === "basic" ? "active" : ""} onClick={() => setActiveTab("basic")}><i className="fa-solid fa-info-circle" /> المعلومات الأساسية</button>
            <button className={activeTab === "tech" ? "active" : ""} onClick={() => setActiveTab("tech")}><i className="fa-solid fa-flask" /> تفاصيل المحصول</button>
            <button className={activeTab === "stock" ? "active" : ""} onClick={() => setActiveTab("stock")}><i className="fa-solid fa-boxes-stacked" /> المخزون والأوزان</button>
            <button className={activeTab === "offers" ? "active" : ""} onClick={() => setActiveTab("offers")} style={{ color: "var(--color-secondary)", fontWeight: 900 }}><i className="fa-solid fa-bolt-lightning" /> حزمة العروض</button>
          </div>

          <div className="admin-card product-card-form">
            {activeTab === "basic" && (
              <div className="react-form-grid">
                <div className="react-field full"><label><i className="fa-solid fa-tag" /> اسم المقتنى التجاري</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="مثلاً: خلطة الحسون الملكية" /></div>
                <div className="react-field"><label><i className="fa-solid fa-money-bill-wave" /> السعر للكيلو (JOD)</label><input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
                <div className="react-field"><label><i className="fa-solid fa-layer-group" /> التصنيف</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    <option value="">-- اختر الفئة --</option>
                    {categories.map((cat) => (
                      <option key={cat.key} value={cat.key}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="react-field"><label><i className="fa-solid fa-warehouse" /> حالة التوفر</label>
                  <select value={form.stock_status} onChange={(e) => setForm({ ...form, stock_status: e.target.value })}>
                    <option value="in_stock">متوفر (In Stock)</option>
                    <option value="out_of_stock">نفذت الكمية (Sold Out)</option>
                  </select>
                </div>
                <div className="react-field full">
                  <label><i className="fa-solid fa-camera-retro" /> الوسائط المرئية (صورة المنتج)</label>
                  <div className="admin-file-upload">
                    <input type="file" id="product-file" accept="image/*" onChange={handleFileUpload} style={{ display: "none" }} />
                    <button className="btn btn-outline btn-block" onClick={() => document.getElementById("product-file").click()} disabled={uploading}>
                       {uploading ? (
                         <><i className="fa-solid fa-sync fa-spin" style={{marginLeft:10}} /> جاري التحميل فائق السرعة...</>
                       ) : (
                         <><i className="fa-solid fa-cloud-arrow-up" style={{marginLeft:10}} /> اختر صوراً من جهازك الشخصي</>
                       )}
                    </button>
                    <div className="file-url-box">
                       <small>المسار الحالي:</small>
                       <input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="أو أضف رابطاً مباشراً يدويًا..." />
                    </div>
                  </div>
                </div>
                <div className="react-field full"><label><i className="fa-solid fa-align-right" /> وصف المنتج التفصيلي</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="اكتب هنا القصة خلف هذا المنتج..." rows="4" /></div>
              </div>
            )}

            {activeTab === "tech" && (
              <div className="react-form-grid">
                <div className="react-field"><label><i className="fa-solid fa-earth-americas" /> بلد المنشأ</label><input value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value })} placeholder="مثلاً: إثيوبيا - ييرغاشيف" /></div>
                <div className="react-field"><label><i className="fa-solid fa-fire" /> درجة التحميص</label><input value={form.roast_level} onChange={(e) => setForm({ ...form, roast_level: e.target.value })} placeholder="مثلاً: متوسطة (Medium)" /></div>
                <div className="react-field full"><label><i className="fa-solid fa-wand-magic-sparkles" /> إيحاءات النكهة</label><input value={form.taste_profile} onChange={(e) => setForm({ ...form, taste_profile: e.target.value })} placeholder="مثلاً: شوكولاتة، كراميل، فواكه استوائية" /></div>
              </div>
            )}

            {activeTab === "stock" && (
              <div className="react-form-grid">
                <div className="react-field"><label><i className="fa-solid fa-warehouse" /> التوفر في المخزن</label><input type="number" value={form.inventory} onChange={(e) => setForm({ ...form, inventory: e.target.value })} /></div>
                <div className="react-field"><label><i className="fa-solid fa-scale-balanced" /> خيارات الوزن المتاحة</label><input value={form.weight_options} onChange={(e) => setForm({ ...form, weight_options: e.target.value })} placeholder="250g, 500g, 1kg" /></div>
              </div>
            )}

            {activeTab === "offers" && (
              <div className="admin-tab-pane">
                <h3 style={{ marginBottom: 25, color: "var(--color-primary)", fontSize: 24, display: "flex", alignItems: "center", gap: 15 }}>
                  <i className="fa-solid fa-star" style={{ color: "var(--color-secondary)" }} /> إدارة العروض الملكية
                </h3>

                <div className="sale-toggle-group" style={{ background: "rgba(0,0,0,0.02)", padding: 25, borderRadius: 20, border: "1px dashed rgba(220,169,34,0.3)" }}>
                  <div
                    className={`sale-toggle-luxe ${form.on_sale ? "active" : ""}`}
                    onClick={() => setForm({ ...form, on_sale: !form.on_sale })}
                  />
                  <div>
                    <span style={{ fontWeight: 900, fontSize: 17, display: "block", marginBottom: 5 }}>تثبيت هذا المورد في واجهة "العروض الخاصة"</span>
                    <small style={{ opacity: 0.6 }}>سيظهر المنتج ببادرة "خصم خاص" في الصفحة الرئيسية مع السعر الجديد.</small>
                  </div>
                </div>

                {form.on_sale && (
                   <div style={{ padding: 25, background: "#fff9ee", borderRadius: 20, border: "1px solid #ffe8cc", marginTop: 25, display: "flex", flexDirection: "column", gap: 20 }}>
                      <div className="form-group">
                         <label style={{ color: "#d35400", fontWeight: 900, marginBottom: 10, display: "block" }}>
                           <i className="fa-solid fa-tag" style={{ marginLeft: 8 }} /> سعر العرض المعتمد (JOD)
                         </label>
                         <input
                            type="number"
                            className="sale-input-luxe"
                            value={form.sale_price}
                            onChange={(e) => setForm({ ...form, sale_price: e.target.value })}
                            placeholder="مثلاً: 12.99"
                         />
                         {form.sale_price && form.price && Number(form.sale_price) < Number(form.price) && (
                           <p style={{ marginTop: 10, fontSize: 13, fontWeight: 700, color: "#27ae60" }}>
                             <i className="fa-solid fa-circle-check" style={{ marginLeft: 6 }} />
                             خصم {Math.round(((form.price - form.sale_price) / form.price) * 100)}% — من {formatCurrency(form.price)} إلى {formatCurrency(form.sale_price)}
                           </p>
                         )}
                      </div>

                      <div className="form-group">
                         <label style={{ fontWeight: 900, marginBottom: 10, display: "block", color: "var(--color-primary)" }}>
                           <i className="fa-regular fa-calendar" style={{ marginLeft: 8 }} /> تاريخ انتهاء العرض (اختياري)
                         </label>
                         <input
                            type="date"
                            className="sale-input-luxe"
                            value={form.sale_ends_at}
                            onChange={(e) => setForm({ ...form, sale_ends_at: e.target.value })}
                         />
                      </div>

                      <div className="form-group">
                         <label style={{ fontWeight: 900, marginBottom: 10, display: "block", color: "var(--color-primary)" }}>
                           <i className="fa-solid fa-star" style={{ marginLeft: 8 }} /> شارة مخصصة (اختياري)
                         </label>
                         <input
                            type="text"
                            className="sale-input-luxe"
                            value={form.badge_label}
                            onChange={(e) => setForm({ ...form, badge_label: e.target.value })}
                            placeholder="مثال: الأكثر مبيعاً، جديد، محدود الكمية"
                         />
                      </div>
                   </div>
                )}
              </div>
            )}

            <div className="form-action-footer">
              <button className="btn btn-primary btn-lg" onClick={submitProduct} disabled={saving}>
                {saving ? (
                  <><i className="fa-solid fa-spinner fa-spin" style={{marginLeft:10}} /> جاري تحليل البيانات...</>
                ) : (
                  <><i className="fa-solid fa-shield-check" style={{marginLeft:10}} /> {editingId ? "تأكيد تحديث المورد" : "إطلاق المنتج للمتجر"}</>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="admin-preview-panel">
          <div className="preview-label"><i className="fa-solid fa-eye" /> معاينة العرض المباشر</div>
          <div className="luxury-product-card preview">
             <div className="product-image">
                <img src={normalizeImagePath(form.image_url) || "https://placehold.co/400x400?text=Waiting+for+Image"} alt="Preview" />
                <div className="product-badge">{form.category}</div>
             </div>
             <div className="product-info">
                <h3>{form.name || "اسم المنتج يظهر هنا"}</h3>
                <p className="description-preview">{form.description ? form.description.substring(0, 60) + "..." : "الوصف الجمالي للمنتج سيظهر في هذا المكان."}</p>
                <div className="product-footer">
                   <span className="price">{form.price || "0.00"} JOD / كغ</span>
                   <button className="add-btn"><i className="fa-solid fa-cart-plus" /></button>
                </div>
             </div>
          </div>
          <div className="preview-note">ملاحظة: هذا العرض يحاكي شكل المنتج النهائي في واجهة المتجر.</div>
        </div>
      </div>

      <div className="admin-card product-list-card">
        <div className="card-header-flex">
          <h2 className="admin-card-title"><i className="fa-solid fa-list-ol" /> جرد ممتلكات المتجر</h2>
          <div className="admin-search-box">
            <i className="fa-solid fa-magnifying-glass" />
            <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="ابحث بالاسم أو التصنيف..." />
          </div>
        </div>

        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>المنتج</th>
                <th>التصنيف</th>
                <th>السعر</th>
                <th>المخزون</th>
                <th>الحالة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="product-cell">
                      <img src={normalizeImagePath(p.image_url)} alt="" className="mini-thumb" />
                      <div className="product-meta">
                        <div className="p-name">{p.name}</div>
                        <div className="p-origin">{p.origin || "منشأ غير محدد"}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="cat-chip">{p.category}</span></td>
                  <td className="price-cell">{formatCurrency(p.price)} / كغ</td>
                  <td>
                    <div className="stock-info">
                      <div className="stock-bar"><div className="fill" style={{width: `${Math.min(p.inventory / 2, 100)}%`}}></div></div>
                      <span>{p.inventory} قطعة</span>
                    </div>
                  </td>
                  <td>
                    <div className="status-flex">
                        <div className={`status-dot ${p.inventory > 0 ? "online" : "offline"}`}></div>
                        {p.inventory > 0 ? "متاح" : "نفذت الكمية"}
                    </div>
                  </td>
                  <td>
                    <div className="action-btns">
                      <button className="action-icon edit" onClick={() => editProduct(p)} title="تعديل"><i className="fa-solid fa-pen-nib" /></button>
                      <button className="action-icon delete" onClick={() => handleDelete(p.id)} title="حذف"><i className="fa-solid fa-trash-can" /></button>
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
