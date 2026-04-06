import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import Header from "../../../shared/components/Header";
import CustomSelect from "../../../shared/components/CustomSelect";
import ProductCard from "../components/ProductCard";
import { useProducts } from "../../../hooks/useProducts";
import { fetchAllCategories } from "../../../lib/api/categories";
import "../storefront.css";

function StatusBox({ text }) {
  return <div className="react-status-box">{text}</div>;
}

export default function ShopPage() {
  const { products, loading } = useProducts();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(searchParams.get("category") || "all");
  const [maxPrice, setMaxPrice] = useState(150);
  const [categoryLabels, setCategoryLabels] = useState({ all: "جميع المنتجات" });
  const priceProgress = maxPrice / 150;
  const priceBubblePosition = `calc(${100 - priceProgress * 100}% + ${(priceProgress - 0.5) * 26}px)`;

  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [location.pathname, location.search]);

  useEffect(() => {
    fetchAllCategories().then((cats) => {
      const labels = { all: "جميع المنتجات" };
      cats.forEach((c) => {
        labels[c.key] = c.name;
      });
      setCategoryLabels(labels);
    });
  }, []);

  const categories = useMemo(() => {
    const list = Array.from(new Set(products.map((p) => p.category))).filter(Boolean);
    return ["all", ...list];
  }, [products]);

  const counts = useMemo(() => {
    const c = { all: products.length };
    products.forEach((p) => {
      if (p.category) c[p.category] = (c[p.category] || 0) + 1;
    });
    return c;
  }, [products]);

  const categoryOptions = useMemo(
    () =>
      categories.map((cat) => ({
        value: cat,
        label: `${categoryLabels[cat] || cat} (${counts[cat] || 0})`,
      })),
    [categories, categoryLabels, counts]
  );

  const filtered = products.filter((product) => {
    const matchesCategory = category === "all" || product.category === category;
    const haystack = `${product.name || ""} ${product.description || ""}`.toLowerCase();
    const matchesSearch = !query || haystack.includes(query.toLowerCase());
    const matchesPrice = Number(product.price || 0) <= maxPrice;
    return matchesCategory && matchesSearch && matchesPrice;
  });

  return (
    <div className="platinum-shop-view shop-page-shell">
      <Header type="shop" />

      <header
        className="shop-lux-header shop-page-hero"
        style={{
          backgroundImage:
            "linear-gradient(to bottom, rgba(0,0,0,0.5), rgba(3,29,14,0.8)), url('assets/images/al_hasoon_engraved_bg_1775320822230.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="container shop-page-hero-inner">
          <h1 className="shop-lux-title">منتجات الحسّون</h1>
          <p className="shop-page-hero-copy">
            منتجات فاخرة مختارة بعناية لتمنحك جودة تليق بذائقتك.
          </p>
        </div>
      </header>

      <div className="container shop-page-body">
        <div className="shop-grid-platinum shop-page-grid">
          <aside className="shop-page-sidebar">
            <div className="glass-sidebar shop-page-filters">
              <div className="shop-page-mobile-controls">
                <div className="shop-page-mobile-top">
                  <div className="shop-page-mobile-select-card">
                    <label className="shop-page-mobile-label">
                      تصفية القائمة
                    </label>
                    <div className="shop-page-mobile-select-wrap">
                      <CustomSelect
                        name="shop_category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        options={categoryOptions}
                      />
                    </div>
                  </div>

                  <div className="range-slider-wrapper shop-page-range-card shop-page-range-card-mobile">
                    <div className="shop-page-range-head">
                      <span className="shop-page-range-label">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                          <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                          <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
                        </svg>
                        السعر المخصص
                      </span>
                    </div>

                    <div className="shop-page-range-shell">
                      <div
                        className="shop-page-range-bubble"
                        style={{
                          left: priceBubblePosition,
                          transform: "translateX(-50%)",
                        }}
                      >
                        لغاية {maxPrice} د.أ
                        <div className="shop-page-range-bubble-arrow" />
                      </div>

                      <div className="shop-page-range-track" />
                      <div
                        className="shop-page-range-track-active"
                        style={{ width: `${(maxPrice / 150) * 100}%` }}
                      />

                      <input
                        type="range"
                        min={0}
                        max={150}
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(Number(e.target.value))}
                        className="thumb"
                      />
                    </div>

                    <div className="shop-page-range-scale">
                      <span>0</span>
                      <span>150 د.أ</span>
                    </div>
                  </div>
                </div>

                <div className="shop-page-mobile-search-card">
                  <label className="shop-page-mobile-label" htmlFor="shop-search-mobile">
                    البحث الذكي
                  </label>
                  <input
                    id="shop-search-mobile"
                    type="search"
                    className="modern-input shop-page-search-input"
                    placeholder="اسم المنتج..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
              </div>

              <section className="shop-page-filter-section">
                <h4 className="lux-filter-title">تصفية القائمة</h4>
                <nav className="lux-filter-list shop-page-filter-list" aria-label="تصنيفات المتجر">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      className={`lux-filter-item ${category === cat ? "active" : ""}`}
                      onClick={() => setCategory(cat)}
                    >
                      <span>{categoryLabels[cat] || cat}</span>
                    </button>
                  ))}
                </nav>
              </section>

              <section className="shop-page-filter-section shop-page-search-block">
                <h4 className="lux-filter-title">البحث الذكي</h4>
                <div className="shop-page-search-stack">
                  <input
                    type="search"
                    className="modern-input shop-page-search-input"
                    placeholder="اسم المنتج..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />

                  <div className="range-slider-wrapper shop-page-range-card">
                    <div className="shop-page-range-head">
                      <span className="shop-page-range-label">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                          <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                          <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
                        </svg>
                        السعر المخصص
                      </span>
                    </div>

                    <div className="shop-page-range-shell">
                      <div
                        className="shop-page-range-bubble"
                        style={{
                          left: priceBubblePosition,
                          transform: "translateX(-50%)",
                        }}
                      >
                        لغاية {maxPrice} د.أ
                        <div className="shop-page-range-bubble-arrow" />
                      </div>

                      <div className="shop-page-range-track" />
                      <div
                        className="shop-page-range-track-active"
                        style={{ width: `${(maxPrice / 150) * 100}%` }}
                      />

                      <input
                        type="range"
                        min={0}
                        max={150}
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(Number(e.target.value))}
                        className="thumb"
                      />
                    </div>

                    <div className="shop-page-range-scale">
                      <span>0</span>
                      <span>150 د.أ</span>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </aside>

          <main className="shop-page-results">
            {!loading ? (
              <div className="shop-page-results-head">
                <h2 className="shop-page-results-title">{categoryLabels[category] || "المنتجات"}</h2>
                <p className="shop-page-results-meta">
                  {filtered.length} منتج متاح
                </p>
              </div>
            ) : null}

            {loading ? (
              <StatusBox text="جارِ تجهيز مقتنياتكم الفاخرة..." />
            ) : (
              <div className="platinum-card-grid shop-page-card-grid">
                {filtered.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
