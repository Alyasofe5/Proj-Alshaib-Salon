/*
  AdminPage.jsx — MOBILE FIXES APPLIED:
  - MOBILE FIX: Hamburger toggle visible on tablet/mobile, hidden on desktop
  - MOBILE FIX: Sidebar is off-canvas on mobile (controlled by sidebarOpen state)
  - MOBILE FIX: Overlay backdrop to close sidebar on outside tap
  - MOBILE FIX: sticky admin-top-nav with env(safe-area-inset-top) support (in CSS)
  - MOBILE FIX: Admin bottom tab bar for mobile — 5 main sections
  - MOBILE FIX: useEffect closes sidebar on route change
*/
import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import AdminOverviewPage from "../pages/AdminOverviewPage";
import AdminOrdersPage from "../pages/AdminOrdersPage";
import AdminProductsPage from "../pages/AdminProductsPage";
import AdminCategoriesPage from "../pages/AdminCategoriesPage";
import AdminCalendarPage from "../pages/AdminCalendarPage";
import AdminB2BPage from "../pages/AdminB2BPage";
import AdminNewsletterPage from "../pages/AdminNewsletterPage";
import AdminCouponsPage from "../pages/AdminCouponsPage";
import AdminSettingsPage from "../pages/AdminSettingsPage";
import AdminHomePage from "../pages/AdminHomePage";
import AdminOffersPage from "../pages/AdminOffersPage";
import "../admin.css";

// MOBILE FIX: Bottom tab items — max 5 tabs for mobile nav bar
const BOTTOM_TABS = [
  { key: "overview",  icon: "fa-solid fa-chart-pie",      label: "عامة" },
  { key: "orders",    icon: "fa-solid fa-cart-flatbed",   label: "طلبات" },
  { key: "products",  icon: "fa-solid fa-box-open",       label: "منتجات" },
  { key: "calendar",  icon: "fa-solid fa-calendar-days",  label: "مواعيد" },
  { key: "settings",  icon: "fa-solid fa-gear",           label: "إعدادات" },
];

export default function AdminPage({ section }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const allowed = ["overview", "orders", "products", "categories", "calendar", "b2b", "newsletter", "coupons", "settings", "homepage", "offers"];
  const current = allowed.includes(section) ? section : "overview";

  const pages = {
    overview:   <AdminOverviewPage />,
    orders:     <AdminOrdersPage />,
    products:   <AdminProductsPage />,
    categories: <AdminCategoriesPage />,
    calendar:   <AdminCalendarPage />,
    b2b:        <AdminB2BPage />,
    newsletter: <AdminNewsletterPage />,
    coupons:    <AdminCouponsPage />,
    settings:   <AdminSettingsPage />,
    homepage:   <AdminHomePage />,
    offers:     <AdminOffersPage />
  };

  // MOBILE FIX: Close sidebar whenever section changes (after nav tap)
  useEffect(() => {
    setSidebarOpen(false);
  }, [current]);

  // MOBILE FIX: Lock body scroll when sidebar overlay is open on mobile
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  return (
    <div className={`admin-body ${sidebarOpen ? "admin-shell-open" : ""}`}>
      <AdminSidebar current={current} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* MOBILE FIX: Overlay closes sidebar on tap-outside on mobile */}
      <button
        type="button"
        className={`admin-sidebar-overlay ${sidebarOpen ? "is-visible" : ""}`}
        aria-label="إغلاق القائمة الجانبية"
        onClick={() => setSidebarOpen(false)}
      />

      <main className="admin-main">
        {/* MOBILE FIX: Sticky top nav with hamburger menu toggle */}
        <div className="admin-top-nav">
          <div className="nav-left">
            {/* MOBILE FIX: Toggle only rendered on tablet/mobile via CSS display:none on desktop */}
            <button
              type="button"
              className="admin-menu-toggle"
              aria-label={sidebarOpen ? "إغلاق القائمة" : "فتح القائمة"}
              aria-expanded={sidebarOpen}
              onClick={() => setSidebarOpen((open) => !open)}
            >
              <i className={`fa-solid ${sidebarOpen ? "fa-xmark" : "fa-bars"}`} />
            </button>
            <div className="admin-user-info">
              <span className="user-name">المدير العام</span>
              {/* MOBILE FIX: user-role hidden on very small screens via CSS */}
              <span className="user-role" style={{ fontSize: 12, opacity: 0.6 }}>نظام النخبة</span>
            </div>
          </div>
          <div className="nav-right">
            {/* MOBILE FIX: Connection status hidden on mobile via CSS */}
            <div className="connection-status">
              <i className="fa-solid fa-circle-check" /> السيرفر الحي متصل
            </div>
          </div>
        </div>

        <div className="admin-content-shell">{pages[current]}</div>
      </main>

      {/* MOBILE FIX: Bottom tab bar — shown only on mobile (<768px) via CSS */}
      <nav
        className="mobile-bottom-nav"
        aria-label="تنقل الإدارة السفلي"
        style={{ zIndex: 1000 }}
      >
        {BOTTOM_TABS.map(({ key, icon, label }) => (
          <NavLink
            key={key}
            to={`/admin/${key}`}
            className={current === key ? "active" : ""}
            aria-label={label}
          >
            <i className={icon} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
