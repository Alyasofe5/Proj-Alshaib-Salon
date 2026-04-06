import React, { useEffect, useState } from "react";
import {
  fetchSubscribers,
  deleteSubscriber,
  fetchCampaigns,
  saveCampaign,
  deleteCampaign,
} from "../../../lib/api/newsletter";

const TABS = [
  { key: "subscribers", label: "المشتركون", icon: "fa-solid fa-users" },
  { key: "compose", label: "إنشاء حملة", icon: "fa-solid fa-pen-to-square" },
  { key: "campaigns", label: "الحملات السابقة", icon: "fa-solid fa-clock-rotate-left" },
];

const TEMPLATES = [
  {
    id: "offer",
    label: "عرض خاص",
    icon: "fa-solid fa-tag",
    subject: "عرض حصري لمشتركي النخبة 🎁",
    body: `عزيزنا المشترك،\n\nيسعدنا إعلامكم عن عرض حصري خاص بمجتمع النخبة:\n\n🔹 [اكتب تفاصيل العرض هنا]\n🔹 الخصم: [النسبة أو القيمة]\n🔹 صالح حتى: [التاريخ]\n\nاستخدم الكود: [KODE]\n\nمع تحيات فريق محامص ومطاحن الحسّون`,
  },
  {
    id: "product",
    label: "منتج جديد",
    icon: "fa-solid fa-box-open",
    subject: "وصل حديثاً — [اسم المنتج] ☕",
    body: `عزيزنا المشترك،\n\nيسعدنا إطلاق منتج جديد إلى تشكيلتنا النخبوية:\n\n✨ [اسم المنتج]\n📝 [وصف قصير للمنتج]\n💰 السعر: [السعر]\n\nاطلب الآن واستمتع بتجربة القهوة الأصيلة.\n\nmعدنا فريق محامص ومطاحن الحسّون`,
  },
  {
    id: "seasonal",
    label: "موسمي",
    icon: "fa-solid fa-star",
    subject: "محاصيل الموسم الجديد وصلت 🌱",
    body: `عزيزنا المشترك،\n\nحلّ موسم جديد وبصحبته أندر المحاصيل من أجود مناطق الزراعة في العالم:\n\n🌿 [اسم المحصول]\n📍 المنشأ: [الدولة/المنطقة]\n🏆 التقييم: [التقييم]\n\nالكميات محدودة — اطلب قبل النفاد.\n\nمع تحيات فريق محامص ومطاحن الحسّون`,
  },
  {
    id: "blank",
    label: "فارغ",
    icon: "fa-solid fa-file",
    subject: "",
    body: "",
  },
];

export default function AdminNewsletterPage() {
  const [tab, setTab] = useState("subscribers");
  const [subscribers, setSubscribers] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Compose state
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [subs, camps] = await Promise.all([fetchSubscribers(), fetchCampaigns()]);
      setSubscribers(subs);
      setCampaigns(camps);
      setLoading(false);
    }
    load();
  }, []);

  async function handleDeleteSubscriber(id) {
    if (!confirm("حذف هذا المشترك؟")) return;
    await deleteSubscriber(id);
    setSubscribers((prev) => prev.filter((s) => s.id !== id));
  }

  async function handleDeleteCampaign(id) {
    if (!confirm("حذف هذه الحملة؟")) return;
    await deleteCampaign(id);
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
  }

  function applyTemplate(tpl) {
    setSelectedTemplate(tpl.id);
    setSubject(tpl.subject);
    setBody(tpl.body);
  }

  async function handleSaveCampaign() {
    if (!subject.trim() || !body.trim()) {
      setSaveMsg({ type: "error", text: "يرجى إدخال العنوان والمحتوى" });
      return;
    }
    setSaving(true);
    try {
      await saveCampaign({ subject, body });
      setSaveMsg({ type: "success", text: "تم حفظ الحملة كمسودة ✓" });
      setSubject("");
      setBody("");
      setSelectedTemplate(null);
      const camps = await fetchCampaigns();
      setCampaigns(camps);
    } catch {
      setSaveMsg({ type: "error", text: "حدث خطأ أثناء الحفظ" });
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(null), 3000);
    }
  }

  const filteredSubs = subscribers.filter((s) =>
    s.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="admin-page-content">
      {/* Header */}
      <div className="admin-header">
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div className="admin-title-icon"><i className="fa-solid fa-envelope" /></div>
          <div>
            <h1 className="admin-title">النشرة البريدية</h1>
            <p style={{ fontSize: 13, color: "var(--color-text-muted)", fontWeight: 700 }}>إدارة المشتركين وإنشاء حملات البريد الإلكتروني</p>
          </div>
        </div>
        <div className="nl-stats-row">
          <div className="nl-stat">
            <span className="nl-stat-num">{subscribers.length}</span>
            <span className="nl-stat-label">مشترك</span>
          </div>
          <div className="nl-stat">
            <span className="nl-stat-num">{campaigns.length}</span>
            <span className="nl-stat-label">حملة</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="nl-tabs">
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

      {/* Tab: Subscribers */}
      {tab === "subscribers" && (
        <div className="nl-panel">
          <div className="nl-toolbar">
            <div className="nl-search-wrap">
              <i className="fa-solid fa-magnifying-glass" />
              <input
                type="text"
                placeholder="ابحث بالبريد الإلكتروني..."
                className="nl-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <span className="nl-count">{filteredSubs.length} مشترك</span>
          </div>

          {loading ? (
            <div className="nl-empty"><i className="fa-solid fa-spinner fa-spin" /> جاري التحميل...</div>
          ) : filteredSubs.length === 0 ? (
            <div className="nl-empty">
              <i className="fa-solid fa-inbox" />
              <p>لا يوجد مشتركون بعد</p>
            </div>
          ) : (
            <div className="nl-table-wrap">
              <table className="nl-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>البريد الإلكتروني</th>
                    <th>تاريخ الاشتراك</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubs.map((sub, i) => (
                    <tr key={sub.id}>
                      <td className="nl-td-num">{i + 1}</td>
                      <td className="nl-td-email">{sub.email}</td>
                      <td className="nl-td-date">
                        {sub.subscribed_at
                          ? new Date(sub.subscribed_at).toLocaleDateString("ar-SA")
                          : "—"}
                      </td>
                      <td>
                        <button
                          className="nl-del-btn"
                          onClick={() => handleDeleteSubscriber(sub.id)}
                          title="حذف"
                        >
                          <i className="fa-solid fa-trash" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Compose */}
      {tab === "compose" && (
        <div className="nl-panel">
          {/* Templates */}
          <div className="nl-section-label">اختر قالباً</div>
          <div className="nl-templates">
            {TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                className={`nl-tpl-btn ${selectedTemplate === tpl.id ? "active" : ""}`}
                onClick={() => applyTemplate(tpl)}
              >
                <i className={tpl.icon} />
                <span>{tpl.label}</span>
              </button>
            ))}
          </div>

          {/* Subject */}
          <div className="nl-field">
            <label className="nl-label">عنوان البريد</label>
            <input
              type="text"
              className="nl-input"
              placeholder="مثال: عرض حصري لمشتركي النخبة 🎁"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          {/* Body */}
          <div className="nl-field">
            <label className="nl-label">محتوى الرسالة</label>
            <textarea
              className="nl-textarea"
              placeholder="اكتب محتوى البريد هنا..."
              rows={12}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>

          {/* Preview */}
          {body && (
            <div className="nl-field">
              <label className="nl-label">معاينة</label>
              <div className="nl-preview">
                <div className="nl-preview-subject">{subject || "(بدون عنوان)"}</div>
                <div className="nl-preview-body">{body}</div>
              </div>
            </div>
          )}

          {saveMsg && (
            <div className={`nl-msg nl-msg-${saveMsg.type}`}>{saveMsg.text}</div>
          )}

          <div className="nl-compose-actions">
            <button
              className="nl-save-btn"
              onClick={handleSaveCampaign}
              disabled={saving}
            >
              {saving ? <i className="fa-solid fa-spinner fa-spin" /> : <i className="fa-solid fa-floppy-disk" />}
              حفظ كمسودة
            </button>
            <p className="nl-compose-note">
              <i className="fa-solid fa-circle-info" /> يتم حفظ الحملة كمسودة. إرسال الحملات يتطلب ربط خدمة بريد (Resend / SendGrid).
            </p>
          </div>
        </div>
      )}

      {/* Tab: Campaigns */}
      {tab === "campaigns" && (
        <div className="nl-panel">
          {loading ? (
            <div className="nl-empty"><i className="fa-solid fa-spinner fa-spin" /> جاري التحميل...</div>
          ) : campaigns.length === 0 ? (
            <div className="nl-empty">
              <i className="fa-solid fa-paper-plane" />
              <p>لا توجد حملات محفوظة بعد</p>
            </div>
          ) : (
            <div className="nl-campaigns-list">
              {campaigns.map((c) => (
                <div key={c.id} className="nl-campaign-card">
                  <div className="nl-campaign-info">
                    <div className="nl-campaign-subject">{c.subject}</div>
                    <div className="nl-campaign-meta">
                      <span className={`nl-status nl-status-${c.status || "draft"}`}>
                        {c.status === "sent" ? "مُرسلة" : "مسودة"}
                      </span>
                      <span>
                        {c.created_at
                          ? new Date(c.created_at).toLocaleDateString("ar-SA")
                          : "—"}
                      </span>
                    </div>
                    <p className="nl-campaign-preview">{c.body?.slice(0, 100)}...</p>
                  </div>
                  <button
                    className="nl-del-btn"
                    onClick={() => handleDeleteCampaign(c.id)}
                    title="حذف"
                  >
                    <i className="fa-solid fa-trash" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

