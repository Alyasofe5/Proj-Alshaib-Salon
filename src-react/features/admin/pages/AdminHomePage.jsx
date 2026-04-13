import React, { useEffect, useState } from "react";
import { useProducts } from "../../../hooks/useProducts";
import { fetchHomeContent, saveHomeData, DEFAULT_CONTENT } from "../../../utils/homeContent";

const TABS = [
  { key: "curated",   label: "مختاراتنا لك",              icon: "fa-solid fa-star" },
  { key: "story",     label: "حكايتنا",                    icon: "fa-solid fa-book-open" },
  { key: "numbers",   label: "أرقامنا",                    icon: "fa-solid fa-chart-bar" },
  { key: "vision",    label: "نصيغ معايير الجودة",         icon: "fa-solid fa-shield-halved" },
  { key: "wholesale", label: "قطاع الأعمال والجملة",       icon: "fa-solid fa-handshake" },
  { key: "faq",       label: "الأسئلة الشائعة",            icon: "fa-solid fa-circle-question" },
];


// ─── Tab: Curated Selection ───────────────────────────────────────────────────
function TabCurated({ selectedIds, onChange }) {
  const { products, loading } = useProducts();

  function toggle(id) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else if (selectedIds.length < 8) {
      onChange([...selectedIds, id]);
    }
  }

  if (loading) return <div className="nl-empty"><i className="fa-solid fa-spinner fa-spin" /> جاري التحميل...</div>;

  return (
    <div>
      <p style={{ color: "var(--color-text-muted)", marginBottom: 20, fontWeight: 700, fontSize: 13 }}>
        اختر حتى <strong>8 منتجات</strong> تظهر في قسم "مختاراتنا لك" في الصفحة الرئيسية. ({selectedIds.length}/8)
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
        {products.map((p) => {
          const selected = selectedIds.includes(p.id);
          return (
            <div
              key={p.id}
              onClick={() => toggle(p.id)}
              style={{
                border: `2px solid ${selected ? "var(--color-primary)" : "#eee"}`,
                borderRadius: 12,
                padding: 12,
                cursor: "pointer",
                background: selected ? "rgba(200,148,58,0.06)" : "white",
                display: "flex",
                alignItems: "center",
                gap: 12,
                transition: "all 0.2s",
              }}
            >
              {p.image_url && <img src={p.image_url} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: "cover" }} />}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 13 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: "#888" }}>{p.price} JOD</div>
              </div>
              <i className={`fa-solid ${selected ? "fa-circle-check" : "fa-circle"}`} style={{ color: selected ? "var(--color-primary)" : "#ddd", fontSize: 18 }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Tab: Our Story ───────────────────────────────────────────────────────────
function TabStory({ data, onChange }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="react-field">
        <label><i className="fa-solid fa-heading" /> العنوان الرئيسي</label>
        <input value={data.heading} onChange={(e) => onChange({ ...data, heading: e.target.value })} />
      </div>
      <div className="react-field">
        <label><i className="fa-solid fa-align-right" /> الفقرة الأولى</label>
        <textarea rows={4} value={data.text1} onChange={(e) => onChange({ ...data, text1: e.target.value })} />
      </div>
      <div className="react-field">
        <label><i className="fa-solid fa-align-right" /> الفقرة الثانية</label>
        <textarea rows={3} value={data.text2} onChange={(e) => onChange({ ...data, text2: e.target.value })} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="react-field">
          <label><i className="fa-solid fa-image" /> رابط الصورة الرئيسية</label>
          <input value={data.image1} onChange={(e) => onChange({ ...data, image1: e.target.value })} placeholder="/assets/images/hero.png" />
          {data.image1 && <img src={data.image1} alt="" style={{ marginTop: 8, width: "100%", height: 100, objectFit: "cover", borderRadius: 8 }} />}
        </div>
        <div className="react-field">
          <label><i className="fa-solid fa-image" /> رابط الصورة الثانوية</label>
          <input value={data.image2} onChange={(e) => onChange({ ...data, image2: e.target.value })} placeholder="/assets/images/our-story-spices.png" />
          {data.image2 && <img src={data.image2} alt="" style={{ marginTop: 8, width: "100%", height: 100, objectFit: "cover", borderRadius: 8 }} />}
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Numbers ─────────────────────────────────────────────────────────────
function TabNumbers({ data, onChange }) {
  function update(idx, field, val) {
    const next = data.map((item, i) => i === idx ? { ...item, [field]: val } : item);
    onChange(next);
  }
  function add() {
    onChange([...data, { key: `stat_${Date.now()}`, value: "0", suffix: "+", prefix: "", title: "عنوان جديد", subtitle: "وصف", tone: "gold" }]);
  }
  function remove(idx) {
    onChange(data.filter((_, i) => i !== idx));
  }

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {data.map((item, idx) => (
          <div key={item.key} style={{ background: "#f9f9f9", borderRadius: 12, padding: 16, border: "1px solid #eee", position: "relative" }}>
            <button onClick={() => remove(idx)} style={{ position: "absolute", top: 12, left: 12, background: "none", border: "none", color: "#c0392b", cursor: "pointer", fontSize: 16 }}>
              <i className="fa-solid fa-trash" />
            </button>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
              <div className="react-field">
                <label>القيمة</label>
                <input value={item.value} onChange={(e) => update(idx, "value", e.target.value)} placeholder="60" />
              </div>
              <div className="react-field">
                <label>اللاحقة (suffix)</label>
                <input value={item.suffix} onChange={(e) => update(idx, "suffix", e.target.value)} placeholder="+" />
              </div>
              <div className="react-field">
                <label>السابقة (prefix)</label>
                <input value={item.prefix || ""} onChange={(e) => update(idx, "prefix", e.target.value)} placeholder="K" />
              </div>
              <div className="react-field">
                <label>اللون</label>
                <select value={item.tone} onChange={(e) => update(idx, "tone", e.target.value)}>
                  <option value="gold">ذهبي</option>
                  <option value="stone">رمادي</option>
                </select>
              </div>
              <div className="react-field" style={{ gridColumn: "1/3" }}>
                <label>العنوان</label>
                <input value={item.title} onChange={(e) => update(idx, "title", e.target.value)} />
              </div>
              <div className="react-field" style={{ gridColumn: "3/5" }}>
                <label>الوصف</label>
                <input value={item.subtitle} onChange={(e) => update(idx, "subtitle", e.target.value)} />
              </div>
            </div>
          </div>
        ))}
      </div>
      <button onClick={add} className="btn btn-outline" style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 8, borderRadius: 10, fontWeight: 700 }}>
        <i className="fa-solid fa-plus" /> إضافة رقم جديد
      </button>
    </div>
  );
}

// ─── Tab: Vision ─────────────────────────────────────────────────────────────
function TabVision({ data, onChange }) {
  function update(idx, field, val) {
    onChange(data.map((item, i) => i === idx ? { ...item, [field]: val } : item));
  }
  function add() {
    onChange([...data, { key: `v_${Date.now()}`, title: "عنوان جديد", text: "" }]);
  }
  function remove(idx) {
    onChange(data.filter((_, i) => i !== idx));
  }

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {data.map((item, idx) => (
          <div key={item.key} style={{ background: "#f9f9f9", borderRadius: 12, padding: 16, border: "1px solid #eee", position: "relative" }}>
            <button onClick={() => remove(idx)} style={{ position: "absolute", top: 12, left: 12, background: "none", border: "none", color: "#c0392b", cursor: "pointer", fontSize: 16 }}>
              <i className="fa-solid fa-trash" />
            </button>
            <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 12 }}>
              <div className="react-field">
                <label>العنوان</label>
                <input value={item.title} onChange={(e) => update(idx, "title", e.target.value)} />
              </div>
              <div className="react-field">
                <label>النص</label>
                <textarea rows={2} value={item.text} onChange={(e) => update(idx, "text", e.target.value)} />
              </div>
            </div>
          </div>
        ))}
      </div>
      <button onClick={add} className="btn btn-outline" style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 8, borderRadius: 10, fontWeight: 700 }}>
        <i className="fa-solid fa-plus" /> إضافة عنصر
      </button>
    </div>
  );
}

// ─── Tab: Wholesale ───────────────────────────────────────────────────────────
function TabWholesale({ data, onChange }) {
  function updateBenefit(idx, field, val) {
    const next = data.benefits.map((b, i) => i === idx ? { ...b, [field]: val } : b);
    onChange({ ...data, benefits: next });
  }
  function addBenefit() {
    onChange({ ...data, benefits: [...data.benefits, { icon: "fa-solid fa-star", title: "", desc: "" }] });
  }
  function removeBenefit(idx) {
    onChange({ ...data, benefits: data.benefits.filter((_, i) => i !== idx) });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="react-field">
        <label><i className="fa-solid fa-heading" /> العنوان</label>
        <input value={data.heading} onChange={(e) => onChange({ ...data, heading: e.target.value })} />
      </div>
      <div className="react-field">
        <label><i className="fa-solid fa-align-right" /> النص</label>
        <textarea rows={4} value={data.text} onChange={(e) => onChange({ ...data, text: e.target.value })} />
      </div>
      <div>
        <label style={{ fontWeight: 800, fontSize: 13, display: "block", marginBottom: 12 }}><i className="fa-solid fa-list-check" /> بطاقات المزايا</label>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {data.benefits.map((b, idx) => (
            <div key={idx} style={{ background: "#f9f9f9", borderRadius: 10, padding: 14, border: "1px solid #eee", display: "grid", gridTemplateColumns: "180px 1fr 2fr auto", gap: 10, alignItems: "center" }}>
              <div className="react-field" style={{ margin: 0 }}>
                <label style={{ fontSize: 11 }}>أيقونة (FontAwesome)</label>
                <input value={b.icon} onChange={(e) => updateBenefit(idx, "icon", e.target.value)} placeholder="fa-solid fa-star" style={{ fontSize: 12 }} />
              </div>
              <div className="react-field" style={{ margin: 0 }}>
                <label style={{ fontSize: 11 }}>العنوان</label>
                <input value={b.title} onChange={(e) => updateBenefit(idx, "title", e.target.value)} />
              </div>
              <div className="react-field" style={{ margin: 0 }}>
                <label style={{ fontSize: 11 }}>الوصف</label>
                <input value={b.desc} onChange={(e) => updateBenefit(idx, "desc", e.target.value)} />
              </div>
              <button onClick={() => removeBenefit(idx)} style={{ background: "none", border: "none", color: "#c0392b", cursor: "pointer", fontSize: 16 }}>
                <i className="fa-solid fa-trash" />
              </button>
            </div>
          ))}
        </div>
        <button onClick={addBenefit} className="btn btn-outline" style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8, borderRadius: 10, fontWeight: 700 }}>
          <i className="fa-solid fa-plus" /> إضافة ميزة
        </button>
      </div>
    </div>
  );
}

// ─── Tab: FAQ ─────────────────────────────────────────────────────────────────
function TabFAQ({ data, onChange }) {
  function update(idx, field, val) {
    onChange(data.map((item, i) => i === idx ? { ...item, [field]: val } : item));
  }
  function add() {
    onChange([...data, { question: "", answer: "" }]);
  }
  function remove(idx) {
    onChange(data.filter((_, i) => i !== idx));
  }

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {data.map((item, idx) => (
          <div key={idx} style={{ background: "#f9f9f9", borderRadius: 12, padding: 16, border: "1px solid #eee", position: "relative" }}>
            <button onClick={() => remove(idx)} style={{ position: "absolute", top: 12, left: 12, background: "none", border: "none", color: "#c0392b", cursor: "pointer", fontSize: 16 }}>
              <i className="fa-solid fa-trash" />
            </button>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div className="react-field">
                <label>السؤال</label>
                <input value={item.question} onChange={(e) => update(idx, "question", e.target.value)} placeholder="اكتب السؤال هنا..." />
              </div>
              <div className="react-field">
                <label>الجواب</label>
                <textarea rows={3} value={item.answer} onChange={(e) => update(idx, "answer", e.target.value)} placeholder="اكتب الجواب هنا..." />
              </div>
            </div>
          </div>
        ))}
      </div>
      <button onClick={add} className="btn btn-outline" style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 8, borderRadius: 10, fontWeight: 700 }}>
        <i className="fa-solid fa-plus" /> إضافة سؤال جديد
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminHomePage() {
  const [tab, setTab] = useState("curated");
  const [content, setContent] = useState(DEFAULT_CONTENT);
  const [selectedIds, setSelectedIds] = useState([]);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    fetchHomeContent().then(({ content: c, curatedIds }) => {
      setContent(c);
      setSelectedIds(curatedIds);
      setLoadingData(false);
    });
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await saveHomeData(content, selectedIds);
      // cache in localStorage as fallback
      localStorage.setItem("alhason_homepage_content", JSON.stringify(content));
      localStorage.setItem("alhason_curated_ids", JSON.stringify(selectedIds));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      window.Swal?.fire("خطأ", "فشل الحفظ: " + err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  function updateContent(section, value) {
    setContent((prev) => ({ ...prev, [section]: value }));
  }

  if (loadingData) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh", flexDirection: "column", gap: 16 }}>
      <div className="react-loader" />
      <p style={{ fontWeight: 800, color: "var(--color-primary)", opacity: 0.6 }}>جاري تحميل محتوى الصفحة...</p>
    </div>
  );

  return (
    <div className="admin-page-content">
      {/* Header */}
      <div className="admin-header">
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div className="admin-title-icon"><i className="fa-solid fa-house" /></div>
          <div>
            <h1 className="admin-title">إدارة الصفحة الرئيسية</h1>
            <p style={{ fontSize: 13, color: "var(--color-text-muted)", fontWeight: 700 }}>تحكم كامل بمحتوى الواجهة الرئيسية للمتجر</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          className="btn btn-primary"
          disabled={saving}
          style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, padding: "10px 20px", borderRadius: 12, cursor: saving ? "wait" : "pointer", opacity: saving ? 0.7 : 1 }}
        >
          {saving
            ? <><i className="fa-solid fa-spinner fa-spin" /> جاري الحفظ...</>
            : saved
            ? <><i className="fa-solid fa-circle-check" /> تم الحفظ!</>
            : <><i className="fa-solid fa-floppy-disk" /> حفظ التغييرات</>}
        </button>
      </div>

      {/* Tabs */}
      <div className="nl-tabs" style={{ marginBottom: 24 }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`nl-tab ${tab === t.key ? "active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            <i className={t.icon} /> {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="admin-card" style={{ padding: 28 }}>
        {tab === "curated" && (
          <TabCurated selectedIds={selectedIds} onChange={setSelectedIds} />
        )}
        {tab === "story" && (
          <TabStory data={content.story} onChange={(v) => updateContent("story", v)} />
        )}
        {tab === "numbers" && (
          <TabNumbers data={content.numbers} onChange={(v) => updateContent("numbers", v)} />
        )}
        {tab === "vision" && (
          <TabVision data={content.vision} onChange={(v) => updateContent("vision", v)} />
        )}
        {tab === "wholesale" && (
          <TabWholesale data={content.wholesale} onChange={(v) => updateContent("wholesale", v)} />
        )}
        {tab === "faq" && (
          <TabFAQ data={content.faq} onChange={(v) => updateContent("faq", v)} />
        )}
      </div>
    </div>
  );
}
