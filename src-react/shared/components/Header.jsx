import React, { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import "../shared.css";

export default function Header({ type = "default", onOpenSearch }) {
  const { items, setIsOpen } = useCart();
  const count = items.reduce((sum, item) => sum + item.q, 0);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileMenu ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenu]);

  useEffect(() => {
    setMobileMenu(false);
    document.body.focus();
  }, [location.pathname]);

  const navClass = ({ isActive }) => (isActive ? "active" : "");

  return (
    <>
      <header
        className={`header ${scrolled || type === "shop" ? "scrolled headershop" : ""}`}
        id="header"
        role="banner"
      >
        <div className="container nav-container">
          <div className="logo-wrapper">
            <Link to="/" onClick={() => setMobileMenu(false)} className="brand-lockup">
              <img src="assets/images/logo-gold.svg" alt="AL Hason" className="brand-logo" />
              <div className="brand-text">
                <span className="brand-ar">محامص الحسون</span>
                <span className="brand-en hide-on-xs">Al Hason roasters</span>
              </div>
            </Link>
          </div>

          <nav
            className={mobileMenu ? "active" : ""}
            aria-label="التنقل الرئيسي"
            aria-hidden={!mobileMenu && window.innerWidth < 1024 ? "true" : undefined}
          >
            <ul className="nav-menu">
              <li>
                <NavLink
                  to="/"
                  end
                  className={navClass}
                  onClick={() => {
                    if (location.pathname === "/") {
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }
                    setMobileMenu(false);
                  }}
                >
                  الرئيسية
                </NavLink>
              </li>

              <li>
                <NavLink to="/shop" className={navClass} onClick={() => setMobileMenu(false)}>
                  منتجاتنا
                </NavLink>
              </li>

              <li>
                <NavLink to="/offers" className={navClass} onClick={() => setMobileMenu(false)} style={({ isActive }) => isActive ? {} : {}}>
                  العروض
                </NavLink>
              </li>

              <li>
                <NavLink to="/b2b" className={navClass} onClick={() => setMobileMenu(false)}>
                  مبيعات الجملة
                </NavLink>
              </li>

              <li>
                <NavLink to="/contact" className={navClass} onClick={() => setMobileMenu(false)}>
                  تواصل معنا
                </NavLink>
              </li>

              <li className="mobile-only-link">
                <Link to="/admin/overview" onClick={() => setMobileMenu(false)}>
                  بوابة المالك
                </Link>
              </li>
            </ul>
          </nav>

          <div className="nav-actions">
            <button className="action-btn" onClick={onOpenSearch} aria-label="بحث" type="button">
              <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
            </button>

            <Link
              to="/admin/overview"
              className="action-btn desktop-only"
              title="لوحة التحكم الإدارية"
              aria-label="لوحة التحكم الإدارية"
            >
              <i className="fa-regular fa-user" aria-hidden="true" />
            </Link>

            <button
              className="action-btn"
              onClick={() => setIsOpen(true)}
              aria-label={`السلة، ${count} عنصر`}
              type="button"
            >
              <i className="fa-solid fa-bag-shopping" aria-hidden="true" />
              {count > 0 ? <span className="cart-badge" aria-hidden="true">{count}</span> : null}
            </button>

            <button
              className="action-btn mobile-menu-toggle"
              onClick={() => setMobileMenu((value) => !value)}
              aria-label={mobileMenu ? "إغلاق القائمة" : "فتح القائمة"}
              aria-expanded={mobileMenu}
              type="button"
            >
              <i
                className={mobileMenu ? "fa-solid fa-xmark" : "fa-solid fa-bars"}
                aria-hidden="true"
              />
            </button>
          </div>
        </div>
      </header>

      {mobileMenu ? (
        <div
          className="mobile-menu-overlay"
          onClick={() => setMobileMenu(false)}
          role="button"
          tabIndex={-1}
          aria-label="إغلاق القائمة"
          style={{ zIndex: 998 }}
        />
      ) : null}
    </>
  );
}
