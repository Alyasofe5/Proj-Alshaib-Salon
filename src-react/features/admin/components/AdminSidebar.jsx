/*
  AdminSidebar.jsx — MOBILE FIXES APPLIED:
  - MOBILE FIX: Sidebar is off-canvas on mobile, persistent on desktop (via CSS)
  - MOBILE FIX: Close button (X) visible on tablet/mobile
  - MOBILE FIX: Safe-area-inset-top applied via CSS on .admin-sidebar-head
  - MOBILE FIX: Safe-area-inset-bottom applied via CSS on .admin-sidebar-footer
  - MOBILE FIX: Menu items have min-height 44px (comfortable touch targets)
  - MOBILE FIX: Fluid font sizes via clamp() in CSS
*/
import React, { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { fetchOrders } from "../../../lib/api/orders";

export default function AdminSidebar({ current, isOpen = false, onClose }) {
  const [orderCount, setOrderCount] = useState(0);

  useEffect(() => {
    async function load() {
      const orders = await fetchOrders();
      setOrderCount(orders.length);
    }
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  const items = [
    ["overview",    "fa-solid fa-chart-pie",            "نظرة عامة"],
    ["homepage",    "fa-solid fa-house",                "الصفحة الرئيسية"],
    ["orders",      "fa-solid fa-cart-flatbed",         "الطلبات الفردية",      orderCount],
    ["calendar",    "fa-solid fa-calendar-days",        "جدولة المواعيد"],
    ["categories",  "fa-solid fa-layer-group",          "الفئات والأصناف"],
    ["products",    "fa-solid fa-box-open",             "إدارة المنتجات"],
    ["offers",      "fa-solid fa-fire",                 "إدارة العروض"],
    ["b2b",         "fa-solid fa-users",                "عملاء الجملة (B2B)"],
    ["newsletter",  "fa-solid fa-envelope-open-text",   "النشرة البريدية"],
    ["coupons",     "fa-solid fa-tags",                 "الكوبونات"],
    ["settings",    "fa-solid fa-gear",                 "إعدادات المتجر"]
  ];

  return (
    // MOBILE FIX: is-open class triggers translateX(0) slide-in animation
    <aside className={`admin-sidebar ${isOpen ? "is-open" : ""}`} aria-label="قائمة الإدارة الجانبية">

      {/* Sidebar head — logo + brand name + close button (close hidden on desktop via CSS) */}
      <div className="admin-sidebar-head">
        <div className="admin-logo">
          <Link to="/" onClick={onClose}>
            <img src="assets/images/logo-gold.svg" alt="AL Hason" />
            <div className="admin-logo-text">
              <span className="admin-logo-name">محامص الحسّون</span>
              <span className="admin-logo-sub">لوحة التحكم</span>
            </div>
          </Link>
        </div>

        {/* MOBILE FIX: Close button — hidden on desktop, visible on mobile via CSS */}
        <button
          type="button"
          className="admin-sidebar-close"
          aria-label="إغلاق القائمة"
          onClick={onClose}
        >
          <i className="fa-solid fa-xmark" />
        </button>
      </div>

      {/* MOBILE FIX: Nav items with 44px min-height each */}
      <ul className="admin-menu" role="navigation">
        {items.map(([key, icon, label, badge]) => (
          <li key={key}>
            <NavLink
              to={`/admin/${key}`}
              className={({ isActive }) => (isActive ? "active" : "")}
              onClick={onClose}
              aria-label={label}
            >
              <i className={icon} aria-hidden="true" />
              <span>{label}</span>
              {badge > 0 && (
                <span className="badge-count" aria-label={`${badge} طلب`}>{badge}</span>
              )}
            </NavLink>
          </li>
        ))}
      </ul>

      {/* MOBILE FIX: Footer with safe-area bottom padding (via CSS) */}
      <div className="admin-sidebar-footer">
        <Link to="/" className="btn btn-outline footer-btn" onClick={onClose}>
          <i className="fa-solid fa-arrow-up-right-from-square" />
          <span>العودة للمتجر</span>
        </Link>
      </div>
    </aside>
  );
}
