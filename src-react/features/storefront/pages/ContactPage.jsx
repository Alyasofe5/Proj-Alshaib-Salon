import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import CustomSelect from "../../../shared/components/CustomSelect";
import "../storefront.css";

const TOPIC_OPTIONS = [
  { value: "general", label: "استفسار عام" },
  { value: "orders", label: "طلب أو متابعة شحنة" },
  { value: "wholesale", label: "الجملة وقطاع الأعمال" },
  { value: "support", label: "دعم وملاحظات" },
];

const CONTACT_CHANNELS = [
  {
    icon: "fa-solid fa-phone",
    title: "اتصل بنا",
    value: "+962 70 000 0000",
    href: "tel:+962700000000",
    note: "متاح للرد خلال ساعات العمل",
  },
  {
    icon: "fa-solid fa-envelope",
    title: "البريد الإلكتروني",
    value: "info@alhason.com",
    href: "mailto:info@alhason.com",
    note: "للاستفسارات والتواصل الرسمي",
  },
  {
    icon: "fa-brands fa-whatsapp",
    title: "واتساب",
    value: "راسلنا مباشرة",
    href: "https://wa.me/962700000000",
    note: "للطلبات السريعة وخدمة العملاء",
  },
];

const BUSINESS_HOURS = [
  { day: "السبت - الخميس", time: "9:00 صباحًا - 9:00 مساءً" },
  { day: "الجمعة", time: "2:00 ظهرًا - 9:00 مساءً" },
];

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    topic: "general",
    message: "",
  });

  const whatsappMessage = useMemo(() => {
    const topicLabel = TOPIC_OPTIONS.find((item) => item.value === form.topic)?.label ?? "استفسار عام";
    return [
      "مرحبًا محامص الحسون،",
      `الاسم: ${form.name || "-"}`,
      `رقم التواصل: ${form.phone || "-"}`,
      `نوع الطلب: ${topicLabel}`,
      `الرسالة: ${form.message || "-"}`,
    ].join("\n");
  }, [form]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    const url = `https://wa.me/962700000000?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="contact-page">
      <section className="contact-page-hero">
        <div className="container">
          <div className="contact-page-hero-inner">
            <h1 className="contact-page-title">نحن قريبون منك دائمًا</h1>
            <p className="contact-page-subtitle">
              لأي استفسار عن الطلبات، المنتجات، أو شراكات الجملة، يسعد فريق الحسّون بخدمتك عبر القنوات المناسبة لك.
            </p>
          </div>
        </div>
      </section>

      <section className="contact-page-main">
        <div className="container">
          <div className="contact-page-grid">
            <div className="contact-page-primary">
              <div className="contact-page-card contact-page-form-card">
                <div className="contact-page-section-head">
                  <h2 className="contact-page-section-title">أرسل لنا رسالتك</h2>
                  <p className="contact-page-section-copy">
                    اكتب تفاصيلك وسنجهز لك رسالة واتساب منسقة لتسريع التواصل.
                  </p>
                </div>

                <form className="contact-page-form" onSubmit={handleSubmit}>
                  <div className="contact-page-form-grid">
                    <div className="contact-page-field">
                      <label htmlFor="contact-name">الاسم</label>
                      <input
                        id="contact-name"
                        name="name"
                        className="contact-page-input"
                        placeholder="الاسم الكامل"
                        autoComplete="name"
                        value={form.name}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="contact-page-field">
                      <label htmlFor="contact-phone">رقم التواصل</label>
                      <input
                        id="contact-phone"
                        name="phone"
                        className="contact-page-input"
                        placeholder="07XXXXXXXX"
                        inputMode="numeric"
                        maxLength={10}
                        autoComplete="tel"
                        value={form.phone}
                        onChange={(event) => {
                          const value = event.target.value.replace(/\D/g, "").slice(0, 10);
                          setForm((prev) => ({ ...prev, phone: value }));
                        }}
                      />
                    </div>
                  </div>

                  <div className="contact-page-field">
                    <label htmlFor="contact-topic">نوع الاستفسار</label>
                    <CustomSelect
                      id="contact-topic"
                      name="topic"
                      value={form.topic}
                      onChange={handleChange}
                      options={TOPIC_OPTIONS}
                      ariaLabel="نوع الاستفسار"
                    />
                  </div>

                  <div className="contact-page-field">
                    <label htmlFor="contact-message">الرسالة</label>
                    <textarea
                      id="contact-message"
                      name="message"
                      className="contact-page-input contact-page-textarea"
                      placeholder="اكتب تفاصيل طلبك أو استفسارك..."
                      value={form.message}
                      onChange={handleChange}
                    />
                  </div>

                  <button className="btn btn-primary contact-page-submit" type="submit">
                    <span>إرسال عبر واتساب</span>
                    <i className="fa-brands fa-whatsapp" />
                  </button>
                </form>
              </div>
            </div>

            <aside className="contact-page-sidebar">
              <div className="contact-page-card">
                <div className="contact-page-section-head">
                  <h2 className="contact-page-section-title">قنوات التواصل</h2>
                </div>

                <div className="contact-page-channel-list">
                  {CONTACT_CHANNELS.map((channel) => (
                    <a
                      key={channel.title}
                      href={channel.href}
                      className="contact-page-channel"
                      target={channel.href.startsWith("https") ? "_blank" : undefined}
                      rel={channel.href.startsWith("https") ? "noopener noreferrer" : undefined}
                    >
                      <span className="contact-page-channel-icon">
                        <i className={channel.icon} />
                      </span>
                      <span className="contact-page-channel-copy">
                        <strong>{channel.title}</strong>
                        <span>{channel.value}</span>
                        <small>{channel.note}</small>
                      </span>
                    </a>
                  ))}
                </div>
              </div>

              <div className="contact-page-card">
                <div className="contact-page-section-head">
                  <h2 className="contact-page-section-title">معلومات الزيارة</h2>
                </div>

                <div className="contact-page-meta">
                  <div className="contact-page-meta-item">
                    <i className="fa-solid fa-location-dot" />
                    <div>
                      <strong>العنوان</strong>
                      <span>عمّان، شارع مكة</span>
                    </div>
                  </div>

                  <div className="contact-page-meta-item">
                    <i className="fa-solid fa-clock" />
                    <div>
                      <strong>ساعات العمل</strong>
                      {BUSINESS_HOURS.map((item) => (
                        <span key={item.day}>{item.day}: {item.time}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="contact-page-card contact-page-note-card">
                <h3 className="contact-page-note-title">لشراكات الجملة</h3>
                <p className="contact-page-note-copy">
                  إذا كنت تمثل مطعمًا أو فندقًا أو نشاطًا تجاريًا، يمكنك أيضًا التوجه إلى صفحة قطاع الأعمال للحصول على عرض مخصص.
                </p>
                <Link to="/b2b" className="btn btn-outline contact-page-note-link">
                  <i className="fa-solid fa-arrow-right" />
                  <span>الانتقال إلى الجملة</span>
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}
