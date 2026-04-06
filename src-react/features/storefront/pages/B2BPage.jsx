import React, { useState } from "react";
import { Link } from "react-router-dom";
import { insertB2BClient } from "../../../lib/api/b2b";
import CustomSelect from "../../../shared/components/CustomSelect";
import "../storefront.css";

const JORDAN_CITIES = [
  "عمّان", "إربد", "الزرقاء", "العقبة", "السلط", "مادبا",
  "الكرك", "الطفيلة", "معان", "عجلون", "جرش", "المفرق",
];

const SECTORS = [
  { value: "retail", label: "تجزئة" },
  { value: "horeca", label: "مطاعم وفنادق" },
  { value: "corporate", label: "شركة / مؤسسة" },
];

const BENEFITS = [
  { icon: "fa-solid fa-boxes-stacked", title: "كميات تجارية", desc: "توريد القهوة والمكسرات والبهارات بكميات الجملة" },
  { icon: "fa-solid fa-tags", title: "أسعار تنافسية", desc: "عروض خاصة وأسعار حصرية لشركاء الأعمال" },
  { icon: "fa-solid fa-truck-fast", title: "توصيل منتظم", desc: "جداول توريد ثابتة تضمن استمرارية المخزون" },
  { icon: "fa-solid fa-headset", title: "دعم مباشر", desc: "فريق متخصص للمتابعة وخدمة ما بعد البيع" },
];

export default function B2BPage() {
  const [form, setForm] = useState({ name: "", sector: "retail", phone: "", monthly_qty: "", city: "" });
  const [status, setStatus] = useState(null); // null | "loading" | "success" | "error"

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      setStatus("error");
      return;
    }
    setStatus("loading");
    try {
      await insertB2BClient(form);
      setStatus("success");
      setForm({ name: "", sector: "retail", phone: "", monthly_qty: "", city: "" });
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="b2b-page">

      {/* Hero */}
      <section className="b2b-hero">
        <div className="container">
          <span className="b2b-eyebrow">شراكات الأعمال</span>
          <h1 className="b2b-hero-title">شريكك الاستراتيجي<br />في عالم الجودة</h1>
          <p className="b2b-hero-sub">
            نحن في محامص الحسّون نفهم متطلبات المطاعم والفنادق والشركات. نقدم أسعاراً تنافسية لطلبات الجملة مع الحفاظ على أعلى معايير الجودة.
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section className="b2b-benefits-section">
        <div className="container">
          <div className="b2b-benefits-grid">
            {BENEFITS.map((b) => (
              <div key={b.title} className="b2b-benefit-card">
                <div className="b2b-benefit-icon">
                  <i className={b.icon} />
                </div>
                <h3 className="b2b-benefit-title">{b.title}</h3>
                <p className="b2b-benefit-desc">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="b2b-form-section">
        <div className="container">
          <div className="b2b-form-wrapper">
            <div className="b2b-form-intro">
              <h2 className="b2b-form-title">سجّل اهتمامك الآن</h2>
              <p className="b2b-form-desc">
                أرسل لنا بيانات مؤسستك وسيتواصل معك فريقنا خلال 24 ساعة لمناقشة تفاصيل الشراكة.
              </p>
              <ul className="b2b-form-checklist">
                <li><i className="fa-solid fa-check" /> استجابة خلال يوم عمل واحد</li>
                <li><i className="fa-solid fa-check" /> عرض سعر مخصص لاحتياجاتك</li>
                <li><i className="fa-solid fa-check" /> استشارة مجانية مع فريق المبيعات</li>
              </ul>
            </div>

            <form className="b2b-form" onSubmit={handleSubmit} noValidate>
              <div className="b2b-field">
                <label className="b2b-label">اسم الجهة أو المؤسسة *</label>
                <input
                  className="b2b-input"
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="مثال: مطعم الأصيل، فندق الريتز..."
                  required
                />
              </div>

              <div className="b2b-field">
                <label className="b2b-label">القطاع</label>
                <CustomSelect
                  name="sector"
                  value={form.sector}
                  onChange={handleChange}
                  options={SECTORS}
                  placeholder="اختر القطاع"
                />
              </div>

              <div className="b2b-field">
                <label className="b2b-label">رقم التواصل *</label>
                <input
                  className="b2b-input"
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setForm((prev) => ({ ...prev, phone: val }));
                  }}
                  placeholder="07XXXXXXXX"
                  maxLength={10}
                  required
                />
              </div>

              <div className="b2b-field">
                <label className="b2b-label">المدينة / المنطقة</label>
                <CustomSelect
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  options={JORDAN_CITIES.map((c) => ({ value: c, label: c }))}
                  placeholder="اختر المدينة / المنطقة"
                />
              </div>

              <div className="b2b-field">
                <label className="b2b-label">الكمية الشهرية المتوقعة</label>
                <CustomSelect
                  name="monthly_qty"
                  value={form.monthly_qty}
                  onChange={handleChange}
                  options={[
                    { value: "أقل من 10 كغ", label: "أقل من 10 كغ" },
                    { value: "10 - 50 كغ", label: "10 - 50 كغ" },
                    { value: "50 - 100 كغ", label: "50 - 100 كغ" },
                    { value: "100 - 500 كغ", label: "100 - 500 كغ" },
                    { value: "أكثر من 500 كغ", label: "أكثر من 500 كغ" },
                  ]}
                  placeholder="اختر الكمية التقريبية"
                />
              </div>

              {status === "error" && (
                <p className="b2b-error">يرجى تعبئة حقلي الاسم ورقم التواصل على الأقل.</p>
              )}

              {status === "success" ? (
                <div className="b2b-success">
                  <i className="fa-solid fa-circle-check" />
                  <div>
                    <strong>تم استلام طلبك بنجاح!</strong>
                    <p>سيتواصل معك فريقنا قريباً.</p>
                  </div>
                </div>
              ) : (
                <button className="btn btn-primary b2b-submit" type="submit" disabled={status === "loading"}>
                  {status === "loading" ? "جاري الإرسال..." : "أرسل الطلب"}
                </button>
              )}
            </form>
          </div>
        </div>
      </section>

      <div className="b2b-back">
        <div className="container">
          <Link to="/" className="b2b-back-link">
            <i className="fa-solid fa-arrow-right" /> العودة للرئيسية
          </Link>
        </div>
      </div>

    </div>
  );
}
