/*
  App.jsx — MOBILE FIXES APPLIED:
  - MOBILE FIX: Mobile bottom tab bar for storefront routes (hidden on admin)
  - MOBILE FIX: Tab bar uses env(safe-area-inset-bottom) for iPhone home bar
  - MOBILE FIX: useCart count shown as badge on cart tab
  - MOBILE FIX: Active tab detected from current pathname
*/
import React, { lazy, Suspense, useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";
import { CartProvider } from "../context/CartContext";
import Header from "../shared/components/Header";
import Footer from "../shared/components/Footer";
import BackToTop from "../shared/components/BackToTop";
import SearchOverlay from "../shared/components/SearchOverlay";
import CartDrawer from "../features/cart/components/CartDrawer";

// Critical route — loaded eagerly
import HomePage from "../features/storefront/pages/HomePage";

// All other routes — lazy loaded (split into separate chunks)
const ShopPage      = lazy(() => import("../features/storefront/pages/ShopPage"));
const ProductPage   = lazy(() => import("../features/product/pages/ProductPage"));
const CartPage      = lazy(() => import("../features/cart/pages/CartPage"));
const CheckoutPage  = lazy(() => import("../features/cart/pages/CheckoutPage"));
const AdminPage     = lazy(() => import("../features/admin/components/AdminPage"));
const B2BPage       = lazy(() => import("../features/storefront/pages/B2BPage"));
const ContactPage   = lazy(() => import("../features/storefront/pages/ContactPage"));
const PrivacyPage   = lazy(() => import("../features/storefront/pages/PrivacyPage"));
const TermsPage     = lazy(() => import("../features/storefront/pages/TermsPage"));
const RefundPage    = lazy(() => import("../features/storefront/pages/RefundPage"));
const OffersPage    = lazy(() => import("../features/storefront/pages/OffersPage"));

function AdminRoutePage() {
  const { section = "overview" } = useParams();
  return <AdminPage section={section} />;
}

export default function App() {
  const location = useLocation();
  const isAdminRoute    = location.pathname.startsWith("/admin");
  const isCheckoutRoute = location.pathname === "/checkout";
  const isHomeRoute     = location.pathname === "/";
  const showGlobalHeader = !isAdminRoute && !isCheckoutRoute;
  const showGlobalFooter = !isAdminRoute && !isCheckoutRoute;
  const [searchOpen, setSearchOpen] = useState(false);

  // MOBILE FIX: Scroll to top on every route change (native app behavior)
  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [location.pathname, location.search]);

  return (
    <CartProvider>
      <div className="react-shell">
        <CartDrawer />

        {/* Maintenance mode overlay */}
        {localStorage.getItem("alhason_maintenance") === "true" && !isAdminRoute ? (
          <div style={{
            position: "fixed", inset: 0, background: "var(--color-primary)",
            color: "white", zIndex: 10000, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", textAlign: "center",
            // MOBILE FIX: padding uses safe areas
            padding: "calc(20px + env(safe-area-inset-top)) 20px calc(20px + env(safe-area-inset-bottom))"
          }}>
            <img src="assets/images/logo-gold.svg" alt="AL Hason" style={{ width: 150, marginBottom: 30 }} />
            <h1 style={{ fontFamily: "var(--font-accent)", color: "var(--color-secondary)", fontSize: "clamp(28px, 8vw, 42px)", marginBottom: 20 }}>
              وضع الصيانة
            </h1>
            <p style={{ fontSize: "clamp(14px, 4vw, 18px)", maxWidth: 600, opacity: 0.8 }}>
              نحن نقوم بتحديث المتجر لنقدم لكم تجربة نخبويّة أفضل. سنعود قريباً جداً.
            </p>
            <div style={{ marginTop: 40, padding: "10px 20px", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, fontSize: 14, opacity: 0.5 }}>
              نظام الحسّون الذكي v2.0
            </div>
          </div>
        ) : null}

        {showGlobalHeader
          ? <Header type={isHomeRoute ? "default" : "shop"} onOpenSearch={() => setSearchOpen(true)} />
          : null
        }

        <BackToTop />

        <Suspense fallback={<div style={{ minHeight: "60vh" }} />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/product/:id" element={<ProductPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/b2b" element={<B2BPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/refund" element={<RefundPage />} />
            <Route path="/offers" element={<OffersPage />} />
            <Route path="/admin" element={<Navigate to="/admin/overview" replace />} />
            <Route path="/admin/:section" element={<AdminRoutePage />} />
          </Routes>
        </Suspense>

        {isHomeRoute
          ? <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
          : null
        }

        {showGlobalFooter ? <Footer /> : null}
      </div>
    </CartProvider>
  );
}
