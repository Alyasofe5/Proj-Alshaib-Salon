import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../../shared/components/Header";
import { useProducts } from "../../../hooks/useProducts";
import { useCart } from "../../../context/CartContext";
import { normalizeImagePath, detectLegacyCategory } from "../../../utils/imageUtils";
import { formatCurrency } from "../../../utils/formatCurrency";
import "../storefront.css";

/* ── Countdown Timer ─────────────────────────────────────────── */
function useCountdown(targetDate) {
  const calc = () => {
    const diff = new Date(targetDate) - Date.now();
    if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0 };
    return {
      d: Math.floor(diff / 86400000),
      h: Math.floor((diff % 86400000) / 3600000),
      m: Math.floor((diff % 3600000) / 60000),
      s: Math.floor((diff % 60000) / 1000),
    };
  };
  const [time, setTime] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, [targetDate]);
  return time;
}

function CountdownBox({ label, value }) {
  return (
    <div className="offers-countdown-unit">
      <span className="offers-countdown-num">{String(value).padStart(2, "0")}</span>
      <span className="offers-countdown-label">{label}</span>
    </div>
  );
}

/* ── Sale Product Card ───────────────────────────────────────── */
function SaleProductCard({ product }) {
  const cart = useCart();
  const navigate = useNavigate();
  const discount = product.sale_price
    ? Math.round(((product.price - product.sale_price) / product.price) * 100)
    : 0;
  const cat = product.category || detectLegacyCategory(product.name, product.image_url);
  const fallbacks = {
    coffee: "assets/images/cat_coffee.png",
    nuts: "assets/images/cat_nuts.png",
    spices: "assets/images/cat_spices.png",
    sweets: "assets/images/cat_sweets.png",
  };

  return (
    <article className="offer-card">
      <div className="offer-card-img-wrap" onClick={() => navigate(`/product/${product.id}`)}>
        {discount > 0 && (
          <span className="offer-card-badge">-{discount}%</span>
        )}
        {product.badge_label && (
          <span className="offer-card-badge offer-card-badge--custom">{product.badge_label}</span>
        )}
        <img
          src={normalizeImagePath(product.image_url, cat)}
          alt={product.name}
          loading="lazy"
          onError={(e) => { e.target.src = fallbacks[cat] || "assets/images/logo-gold.svg"; }}
          className="offer-card-img"
        />
      </div>

      <div className="offer-card-body">
        <span className="offer-card-cat">
          {cat === "coffee" ? "القهوة الملكية" : cat === "nuts" ? "مكسرات فاخرة" : cat === "spices" ? "بهارات أصيلة" : "مجموعة النخبة"}
        </span>
        <h3 className="offer-card-name" onClick={() => navigate(`/product/${product.id}`)}>
          {product.name}
        </h3>

        <div className="offer-card-prices">
          {product.sale_price ? (
            <>
              <span className="offer-card-price-new">{formatCurrency(product.sale_price)}</span>
              <span className="offer-card-price-old">{formatCurrency(product.price)}</span>
            </>
          ) : (
            <span className="offer-card-price-new">{formatCurrency(product.price)}</span>
          )}
          <span className="offer-card-price-unit">/ كغ</span>
        </div>

        {product.sale_ends_at && (
          <div className="offer-card-expiry">
            <i className="fa-regular fa-clock" />
            ينتهي {new Date(product.sale_ends_at).toLocaleDateString("ar-JO", { month: "long", day: "numeric" })}
          </div>
        )}

        <button
          className="offer-card-btn"
          onClick={() => { cart.addItem(product, 1); cart.setIsOpen(true); }}
          disabled={product.stock_status === "out_of_stock"}
        >
          <i className="fa-solid fa-cart-plus" />
          <span>{product.stock_status === "out_of_stock" ? "نفذت الكمية" : "أضف إلى السلة"}</span>
        </button>
      </div>
    </article>
  );
}

/* ── Filter Tabs ─────────────────────────────────────────────── */
const FILTER_TABS = [
  { key: "all",    label: "جميع العروض", icon: "fa-solid fa-fire" },
  { key: "coffee", label: "قهوة",        icon: "fa-solid fa-mug-hot" },
  { key: "nuts",   label: "مكسرات",      icon: "fa-solid fa-seedling" },
  { key: "spices", label: "بهارات",      icon: "fa-solid fa-mortar-pestle" },
];

/* ── Main Page ───────────────────────────────────────────────── */
export default function OffersPage() {
  const { products, loading } = useProducts();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("all");

  // End of month as default sale end date for hero countdown
  const saleEnd = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1, 1);
    d.setDate(0);
    d.setHours(23, 59, 59);
    return d;
  }, []);
  const { d, h, m, s } = useCountdown(saleEnd);

  const saleProducts = useMemo(
    () => products.filter((p) => p.is_on_sale && p.sale_price && !p.is_draft),
    [products]
  );

  const filtered = useMemo(
    () => activeFilter === "all" ? saleProducts : saleProducts.filter((p) => p.category === activeFilter),
    [saleProducts, activeFilter]
  );

  const savings = useMemo(
    () => saleProducts.reduce((sum, p) => sum + (p.price - (p.sale_price || p.price)), 0),
    [saleProducts]
  );

  return (
    <div className="platinum-shop-view offers-page-shell">
      <Header type="shop" />

      {/* ── Hero ── */}
      <section className="offers-hero">
        <div className="offers-hero-bg" />
        <div className="container offers-hero-inner">

          <h1 className="offers-hero-title">
            وفّر مع <span>الحسّون</span>
          </h1>
          <p className="offers-hero-sub">
            أفضل أسعار الموسم على قهوتنا المختصة، مكسراتنا الفاخرة، وبهاراتنا الأصيلة
          </p>

          <div className="offers-countdown">
            <span className="offers-countdown-prefix">ينتهي العرض خلال</span>
            <div className="offers-countdown-boxes">
              <CountdownBox label="يوم"    value={d} />
              <div className="offers-countdown-sep">:</div>
              <CountdownBox label="ساعة"  value={h} />
              <div className="offers-countdown-sep">:</div>
              <CountdownBox label="دقيقة" value={m} />
              <div className="offers-countdown-sep">:</div>
              <CountdownBox label="ثانية" value={s} />
            </div>
          </div>

          {!loading && (
            <div className="offers-hero-stats">
              <div className="offers-hero-stat">
                <strong>{saleProducts.length}</strong>
                <span>منتج مخفّض</span>
              </div>
              <div className="offers-hero-stat-divider" />
              <div className="offers-hero-stat">
                <strong>حتى {Math.max(...saleProducts.map(p => Math.round(((p.price - p.sale_price) / p.price) * 100)), 0)}%</strong>
                <span>توفير</span>
              </div>
              <div className="offers-hero-stat-divider" />
              <div className="offers-hero-stat">
                <strong>{formatCurrency(savings)}</strong>
                <span>متوسط التوفير</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Filter Tabs ── */}
      <div className="offers-filters-bar">
        <div className="offers-filters-inner">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              className={`offers-filter-tab ${activeFilter === tab.key ? "active" : ""}`}
              onClick={() => setActiveFilter(tab.key)}
            >
              <i className={tab.icon} />
              {tab.label}
              {!loading && (() => {
                const count = tab.key === "all"
                  ? saleProducts.length
                  : saleProducts.filter(p => p.category === tab.key).length;
                return <span className="offers-filter-count">{count}</span>;
              })()}
            </button>
          ))}
        </div>
      </div>

      {/* ── Products Grid ── */}
      <main className="container offers-grid-section">
        {loading ? (
          <div className="offers-loading">
            <div className="offers-loading-spinner" />
            <p>جارِ تجهيز أفضل العروض...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="offers-empty">
            <i className="fa-solid fa-tag offers-empty-icon" />
            <h2>لا توجد عروض في هذا التصنيف حالياً</h2>
            <p>ترقّب عروضنا القادمة أو تصفّح جميع منتجاتنا</p>
            <button className="btn btn-primary" onClick={() => navigate("/shop")}>
              تصفّح المتجر
            </button>
          </div>
        ) : (
          <>
            <div className="offers-grid-head">
              <h2 className="offers-grid-title">
                {FILTER_TABS.find(t => t.key === activeFilter)?.label}
              </h2>
              <p className="offers-grid-meta">{filtered.length} منتج بسعر مخفّض</p>
            </div>
            <div className="offers-grid">
              {filtered.map((p) => (
                <SaleProductCard key={p.id} product={p} />
              ))}
            </div>
          </>
        )}
      </main>

      {/* ── B2B Banner ── */}
      <section className="offers-b2b-banner">
        <div className="container offers-b2b-inner">
          <div className="offers-b2b-content">
            <i className="fa-solid fa-handshake offers-b2b-icon" />
            <div>
              <h3 className="offers-b2b-title">اطلب بالجملة واحصل على سعر خاص</h3>
              <p className="offers-b2b-sub">أسعار تنافسية للمطاعم والفنادق والموردين</p>
            </div>
          </div>
          <button className="offers-b2b-btn" onClick={() => navigate("/b2b")}>
            تواصل معنا للجملة
            <i className="fa-solid fa-arrow-left" />
          </button>
        </div>
      </section>
    </div>
  );
}
