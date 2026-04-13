import React from "react";
import { Link } from "react-router-dom";

function scrollTo(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}
import "../storefront.css";

const STEPS = [
  { icon: "fa-solid fa-envelope", title: "تواصل معنا", desc: "أرسل بريداً إلكترونياً على info@alhason.com خلال 24 ساعة من الاستلام مع صورة المنتج." },
  { icon: "fa-solid fa-magnifying-glass", title: "مراجعة الطلب", desc: "يراجع فريقنا طلبك خلال 24 ساعة ويؤكد أهليته للاسترجاع." },
  { icon: "fa-solid fa-truck", title: "إعادة المنتج", desc: "نرسل لك تعليمات الإعادة وتنسيق الاستلام من موقعك مجاناً." },
  { icon: "fa-solid fa-rotate-left", title: "الاسترداد", desc: "يُعالج استرداد المبلغ خلال 5-7 أيام عمل بنفس وسيلة الدفع الأصلية." },
];

const CASES = [
  { eligible: true, label: "منتج تالف أو معيب عند الاستلام" },
  { eligible: true, label: "منتج مختلف عما طلبته" },
  { eligible: true, label: "طلب لم يصل خلال 14 يوم عمل" },
  { eligible: true, label: "منتج منتهي الصلاحية" },
  { eligible: false, label: "منتجات مفتوحة أو مستخدمة دون عيب" },
  { eligible: false, label: "تغيير رأي بعد الاستلام" },
  { eligible: false, label: "مرور أكثر من 24 ساعة على الاستلام" },
  { eligible: false, label: "منتجات مخصصة (طحن حسب الطلب)" },
];

export default function RefundPage() {
  return (
    <div className="legal-page">
      <div className="legal-hero">
        <div className="container">
          <div className="legal-hero-inner">
            <span className="legal-tag">آخر تحديث: أبريل 2026</span>
            <h1 className="legal-title">سياسة الاسترجاع</h1>
            <p className="legal-subtitle">
              رضا عملاءنا هو أولويتنا القصوى. نضمن لك تجربة شراء آمنة مع سياسة استرجاع واضحة وعادلة.
            </p>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="legal-body">
          <aside className="legal-toc">
            <div className="legal-toc-inner">
              <p className="legal-toc-label">المحتويات</p>
              <ul>
                <li><a href="#" onClick={(e) => { e.preventDefault(); scrollTo("how"); }}>خطوات الاسترجاع</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); scrollTo("cases"); }}>حالات الاسترجاع</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); scrollTo("policy"); }}>تفاصيل السياسة</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); scrollTo("contact"); }}>تواصل معنا</a></li>
              </ul>
            </div>
          </aside>

          <main className="legal-content">

            {/* Steps */}
            <section id="how" className="legal-section">
              <h2 className="legal-section-title">
                <span className="legal-section-num">01</span>
                خطوات الاسترجاع
              </h2>
              <div className="refund-steps">
                {STEPS.map((s, i) => (
                  <div key={i} className="refund-step">
                    <div className="refund-step-icon">
                      <i className={s.icon} />
                    </div>
                    <div>
                      <div className="refund-step-title">{s.title}</div>
                      <p className="refund-step-desc">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Cases */}
            <section id="cases" className="legal-section">
              <h2 className="legal-section-title">
                <span className="legal-section-num">02</span>
                حالات الاسترجاع
              </h2>
              <div className="refund-cases">
                <div className="refund-cases-col">
                  <div className="refund-cases-header eligible">
                    <i className="fa-solid fa-circle-check" /> مقبول للاسترجاع
                  </div>
                  {CASES.filter(c => c.eligible).map((c, i) => (
                    <div key={i} className="refund-case eligible">
                      <i className="fa-solid fa-check" />
                      <span>{c.label}</span>
                    </div>
                  ))}
                </div>
                <div className="refund-cases-col">
                  <div className="refund-cases-header not-eligible">
                    <i className="fa-solid fa-circle-xmark" /> غير مقبول للاسترجاع
                  </div>
                  {CASES.filter(c => !c.eligible).map((c, i) => (
                    <div key={i} className="refund-case not-eligible">
                      <i className="fa-solid fa-xmark" />
                      <span>{c.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Policy Details */}
            <section id="policy" className="legal-section">
              <h2 className="legal-section-title">
                <span className="legal-section-num">03</span>
                تفاصيل السياسة
              </h2>
              <p className="legal-section-text">
                تسري سياسة الاسترجاع خلال 24 ساعة من تاريخ الاستلام للمنتجات المعيبة أو الخاطئة. يُشترط الاحتفاظ بالمنتج في حالته الأصلية وعبوته الأصلية. يُسترد المبلغ كاملاً بما في ذلك رسوم الشحن في حالة الخطأ من جانبنا. في حالات الاستبدال، نتحمل نحن رسوم الشحن في كلا الاتجاهين. لطلبات الجملة (B2B)، يرجى مراجعة اتفاقية الشراكة الخاصة بك.
              </p>
            </section>

            {/* Contact */}
            <section id="contact" className="legal-section">
              <h2 className="legal-section-title">
                <span className="legal-section-num">04</span>
                تواصل معنا
              </h2>
              <p className="legal-section-text">
                لتقديم طلب استرجاع أو الاستفسار عن سياستنا، تواصل مع فريق خدمة العملاء:
              </p>
              <div className="refund-contact">
                <a href="mailto:info@alhason.com" className="refund-contact-item">
                  <i className="fa-solid fa-envelope" />
                  <span>info@alhason.com</span>
                </a>
                <a href="tel:+962700000000" className="refund-contact-item">
                  <i className="fa-solid fa-phone" />
                  <span>+962 70 000 0000</span>
                </a>
                <a href="https://wa.me/962700000000" target="_blank" rel="noopener noreferrer" className="refund-contact-item">
                  <i className="fa-brands fa-whatsapp" />
                  <span>واتساب</span>
                </a>
              </div>
            </section>

            <div className="legal-footer-note">
              <i className="fa-solid fa-heart" />
              <p>نؤمن بأن تجربة الشراء لا تنتهي عند الاستلام. فريقنا مستعد دائماً لضمان رضاك التام.</p>
            </div>

            <div className="legal-back">
              <Link to="/" className="btn btn-outline">
                <i className="fa-solid fa-arrow-right" /> العودة للرئيسية
              </Link>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
