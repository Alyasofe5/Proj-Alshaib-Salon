import React, { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null);

  async function handleSubscribe(event) {
    event.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");

    const { error } = await supabase
      .from("newsletter_subscribers")
      .insert([{ email: email.trim() }]);

    if (!error) {
      setStatus("success");
      setEmail("");
    } else if (error.code === "23505") {
      setStatus("duplicate");
    } else {
      setStatus("error");
    }

    setTimeout(() => setStatus(null), 4000);
  }

  return (
    <footer className="footer" id="contact">
      <div className="footer-grain-overlay"></div>
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <img src="/assets/images/logo-gold.svg" alt="AL Hasoon" className="footer-logo" width="120" height="48" loading="lazy" />
            <p className="footer-brand-text">
              نحن لا نبيع مجرد قهوة، نحن نصدر ثقافة النخبة وتراث الجودة منذ سنوات في الأردن.
            </p>
            <div className="footer-socials">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
                aria-label="Instagram"
              >
                <i className="fa-brands fa-instagram" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
                aria-label="Facebook"
              >
                <i className="fa-brands fa-facebook" />
              </a>
              <a
                href="https://wa.me/962700000000"
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
                aria-label="WhatsApp"
              >
                <i className="fa-brands fa-whatsapp" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="footer-title">وصلات سريعة</h4>
            <ul className="footer-links footer-links-compact">
              <li><Link to="/">الرئيسية</Link></li>
              <li><Link to="/shop">منتجاتنا</Link></li>
              <li><Link to="/b2b">مبيعات الجملة</Link></li>
              <li><Link to="/admin/overview">بوابة المالك</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="footer-title">مركز التواصل</h4>
            <ul className="footer-links footer-links-contact">
              <li>
                <span><i className="fa-solid fa-location-dot" /> عمان، شارع مكة</span>
              </li>
              <li>
                <a href="tel:+962700000000">
                  <i className="fa-solid fa-phone" /> +962 70 000 0000
                </a>
              </li>
              <li>
                <a href="mailto:info@alhason.com">
                  <i className="fa-solid fa-envelope" /> info@alhason.com
                </a>
              </li>
            </ul>
          </div>

          <div className="footer-newsletter">
            <h4 className="footer-title">نشرة النخبة</h4>
            <p className="newsletter-desc">
              انضم إلى مجتمع متذوقي القهوة للحصول على عروض حصرية ومحاصيل نادرة.
            </p>
            <form className="newsletter-form" onSubmit={handleSubscribe}>
              <label htmlFor="newsletter-email" className="sr-only">
                البريد الإلكتروني للاشتراك في النشرة
              </label>
              <input
                id="newsletter-email"
                name="email"
                type="email"
                placeholder="بريدك الإلكتروني"
                className="newsletter-input"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={status === "loading" || status === "success"}
                required
              />
              <button
                type="submit"
                className="newsletter-btn"
                aria-label="اشتراك"
                disabled={status === "loading" || status === "success"}
              >
                {status === "loading" ? (
                  <i className="fa-solid fa-spinner fa-spin" />
                ) : status === "success" ? (
                  <i className="fa-solid fa-check" />
                ) : (
                  <i className="fa-solid fa-paper-plane" />
                )}
              </button>
            </form>

            {status === "success" ? (
              <p className="newsletter-feedback success">تم الاشتراك بنجاح</p>
            ) : null}
            {status === "duplicate" ? (
              <p className="newsletter-feedback duplicate">هذا البريد مشترك مسبقًا</p>
            ) : null}
            {status === "error" ? (
              <p className="newsletter-feedback error">حدث خطأ، حاول مجددًا</p>
            ) : null}
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-bottom-grid">
            <div className="footer-credits">
              <span>&copy; 2026 محامص ومطاحن الحسّون — كافة الحقوق محفوظة للنخبة</span>
            </div>
            <div className="footer-legal">
              <Link to="/privacy">سياسة الخصوصية</Link>
              <Link to="/terms">الشروط والأحكام</Link>
              <Link to="/refund">سياسة الاسترجاع</Link>
            </div>
            <div className="footer-signature">
              Designed &amp; Developed by{" "}
              <a href="https://wr-technologies.net/" target="_blank" rel="noopener noreferrer">
                WR Technologies
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
