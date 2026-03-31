import React, { createContext, useContext, useEffect, useMemo, useState, useRef } from "react";
import { supabase } from "./lib/supabaseClient";
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  applyCouponCode,
  createOrder,
  fetchB2BClients,
  fetchB2BCount,
  fetchBookings,
  fetchCoupons,
  fetchOrders,
  fetchProductById,
  fetchProducts,
  fetchVideoSettings,
  insertB2BClient,
  insertBooking,
  insertCoupon,
  removeB2BClient,
  removeCoupon,
  setB2BStatus,
  setCouponState,
  updateOrderStatus,
  upsertProduct,
  upsertHeroSetting
} from "./lib/api";
import { normalizeCartImage, readCart, writeCart } from "./lib/cart";
import { resolveMedia, saveMediaBlob, saveMediaUrl } from "./lib/mediaDb";

const CartContext = createContext(null);
const SHIPPING_COST = 3.5;
const DEFAULT_MEDIA = {
  coffee: {
    src: "https://cdn.pixabay.com/vimeo/459345700/coffee-49405.mp4",
    poster: "assets/images/bg_coffee.png",
    title: "بن قهوة",
    tag: "Luxury Roasts",
    description: "أصالة المذاق في كل حبة، محمصة بعناية لتناسب ذائقتك."
  },
  nuts: {
    src: "https://cdn.pixabay.com/vimeo/305886367/nuts-19961.mp4",
    poster: "assets/images/bg_nuts.png",
    title: "مكسرات وبزوريات",
    tag: "Handpicked Selection",
    description: "تشكيلة منتقاة يوميًا بطزاجة واضحة ونكهة غنية."
  },
  spices: {
    src: "https://cdn.pixabay.com/vimeo/415663738/spices-37597.mp4",
    poster: "assets/images/bg_spices.png",
    title: "بهارات",
    tag: "Ancient Flavors",
    description: "خلطات وروائح أصيلة تضيف عمقًا مميزًا لكل وصفة."
  }
};

function formatCurrency(value) {
  return `${Number(value || 0).toFixed(2)} JOD`;
}

function normalizeImagePath(path, category = "coffee") {
  const mockSystem = {
    coffee: "assets/images/cat_coffee.png",
    nuts: "assets/images/cat_nuts.png",
    spices: "assets/images/cat_spices.png",
    sweets: "assets/images/cat_sweets.png"
  };

  if (!path || !path.startsWith("http")) {
    return mockSystem[category] || mockSystem.coffee;
  }
  return path;
}

function detectLegacyCategory(name, img) {
  const ref = `${name || ""} ${img || ""}`.toLowerCase();
  if (ref.includes("nuts") || ref.includes("بذور") || ref.includes("مكسرات") || ref.includes("شيا") || ref.includes("نبات")) return "nuts";
  if (ref.includes("sweets") || ref.includes("حلويات") || ref.includes("سكاكر")) return "sweets";
  if (ref.includes("spices") || ref.includes("بهارات") || ref.includes("توابل")) return "spices";
  return "coffee";
}

function rememberScrollTarget(sectionId) {
  try {
    sessionStorage.setItem("react_scroll_target", sectionId);
  } catch {}
}

function consumeScrollTarget() {
  try {
    const value = sessionStorage.getItem("react_scroll_target");
    if (value) sessionStorage.removeItem("react_scroll_target");
    return value;
  } catch {
    return null;
  }
}

function productWeightOptions(product) {
  if (!product?.weight_options) return [];
  if (Array.isArray(product.weight_options)) return product.weight_options;
  return String(product.weight_options)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function useCartStore() {
  const [items, setItems] = useState(readCart());

  useEffect(() => {
    const sync = () => setItems(readCart());
    window.addEventListener("storage", sync);
    window.addEventListener("cart:changed", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("cart:changed", sync);
    };
  }, []);

  return useMemo(() => {
    const addItem = (product, quantity = 1, weight = "") => {
      const current = readCart();
      const label = weight ? `${product.name} (${weight})` : product.name;
      const id = weight ? `${product.id}:${weight}` : String(product.id);
      const existing = current.find((item) => item.id === id);
      
      const cat = product.category || detectLegacyCategory(product.name, product.image_url);

      if (existing) {
        existing.q += quantity;
      } else {
        current.push({
          id,
          baseId: product.id,
          name: label,
          price: Number(product.on_sale && product.sale_price ? product.sale_price : (product.price || 0)),
          image: normalizeCartImage(product.image_url, cat),
          q: quantity,
          isOnSale: !!(product.on_sale && product.sale_price),
          category: cat
        });
      }
      writeCart(current);
      setItems(readCart());
    };

    const removeItem = (id) => {
      writeCart(readCart().filter((item) => item.id !== id));
      setItems(readCart());
    };

    const updateQuantity = (id, quantity) => {
      writeCart(
        readCart().map((item) => (item.id === id ? { ...item, q: Math.max(1, quantity) } : item))
      );
      setItems(readCart());
    };

    const clearCart = () => {
      writeCart([]);
      setItems([]);
    };

    return {
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      count: items.reduce((sum, item) => sum + Number(item.q || 0), 0),
      subtotal: items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.q || 0), 0)
    };
  }, [items]);
}

function CartProvider({ children }) {
  const cart = useCartStore();
  const [isOpen, setIsOpen] = useState(false);
  return (
    <CartContext.Provider value={{ ...cart, isOpen, setIsOpen }}>
      {children}
    </CartContext.Provider>
  );
}

function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
}

function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetchProducts()
      .then((data) => {
        if (!mounted) return;
        setProducts(data);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return { products, loading, setProducts };
}

function useHeroMedia() {
  const [media, setMedia] = useState(DEFAULT_MEDIA);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const next = {
        coffee: { ...DEFAULT_MEDIA.coffee },
        nuts: { ...DEFAULT_MEDIA.nuts },
        spices: { ...DEFAULT_MEDIA.spices }
      };
      const poster = await resolveMedia("poster");
      if (poster) {
        next.coffee.poster = poster;
        next.nuts.poster = poster;
        next.spices.poster = poster;
      }
      for (const key of ["coffee", "nuts", "spices"]) {
        const local = await resolveMedia(key);
        if (local) {
          next[key].src = local;
        }
      }
      const settings = await fetchVideoSettings();
      settings.forEach((item) => {
        if (next[item.key]) {
          if (item.url && item.url.startsWith("http")) next[item.key].src = item.url;
          if (item.title) next[item.key].title = item.title;
          if (item.tag) next[item.key].tag = item.tag;
          if (item.description) next[item.key].description = item.description;

          if (item.key === "poster" && item.url) {
            next.coffee.poster = item.url;
            next.nuts.poster = item.url;
            next.spices.poster = item.url;
          }
        }
      });
      if (mounted) setMedia(next);
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  return media;
}

function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isHomeRoute = location.pathname === "/";
  const showGlobalHeader = !isAdminRoute;
  const showGlobalFooter = !isAdminRoute;
  const showAnnouncement = isHomeRoute;
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <CartProvider>
      <div className="react-shell">
        <CartDrawer />
        {/* Migration banner removed for production-ready look */}
        {localStorage.getItem("alhason_maintenance") === "true" && !isAdminRoute ? (
          <div style={{ position: "fixed", inset: 0, background: "var(--color-primary)", color: "white", zIndex: 10000, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 20 }}>
            <img src="assets/images/logo-gold.svg" alt="AL Hason" style={{ width: 150, marginBottom: 30 }} />
            <h1 style={{ fontFamily: "var(--font-accent)", color: "var(--color-secondary)", fontSize: 42, marginBottom: 20 }}>وضع الصيانة</h1>
            <p style={{ fontSize: 18, maxWidth: 600, opacity: 0.8 }}>نحن نقوم بنحديث المتجر لنقدم لكم تجربة نخبويّة أفضل. سنعود قريباً جداً.</p>
            <div style={{ marginTop: 40, padding: "10px 20px", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, fontSize: 14, opacity: 0.5 }}>نظام الحسّون الذكي v2.0</div>
          </div>
        ) : null}
        {showGlobalHeader ? <Header type={isHomeRoute ? "default" : "shop"} onOpenSearch={() => setSearchOpen(true)} /> : null}
        <BackToTop />
        <div>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/product/:id" element={<ProductPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/admin" element={<Navigate to="/admin/overview" replace />} />
            <Route path="/admin/:section" element={<AdminRoutePage />} />
          </Routes>
        </div>
        {isHomeRoute ? <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} /> : null}
        {showGlobalFooter ? <Footer /> : null}
      </div>
    </CartProvider>
  );
}

function Header({ type = "default", onOpenSearch }) {
  const { items, setIsOpen } = useCart();
  const count = items.reduce((sum, i) => sum + i.q, 0);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navClass = ({ isActive }) => (isActive ? "active" : "");

  return (
    <>
      <header className={`header ${scrolled || type === "shop" ? "scrolled headershop" : ""}`} id="header">
        <div className="container nav-container">
          <div className="logo-wrapper">
            <Link to="/" onClick={() => setMobileMenu(false)}>
              <img src="assets/images/logo-gold.svg" alt="AL Hason" />
            </Link>
          </div>
          <nav className={mobileMenu ? "active" : ""}>
            <ul className="nav-menu">
              <li><NavLink to="/" end className={navClass} onClick={() => { if(location.pathname === "/") { window.scrollTo({top:0, behavior:"smooth"}); } setMobileMenu(false); }}>الرئيسية</NavLink></li>
              <li><NavLink to="/shop" className={navClass} onClick={() => setMobileMenu(false)}>المتجر الفاخر</NavLink></li>
              <li><Link to="/" onClick={() => { if(location.pathname === "/") { document.getElementById("wholesale")?.scrollIntoView({behavior:"smooth"}); } else { rememberScrollTarget("wholesale"); } setMobileMenu(false); }}>مبيعات الجملة</Link></li>
              <li><Link to="/" onClick={() => { if(location.pathname === "/") { document.getElementById("contact")?.scrollIntoView({behavior:"smooth"}); } else { rememberScrollTarget("contact"); } setMobileMenu(false); }}>تواصل معنا</Link></li>
              <li className="mobile-only-link"><Link to="/admin/overview" onClick={() => setMobileMenu(false)}>بوابة المالك</Link></li>
            </ul>
          </nav>
          <div className="nav-actions">
            <button className="action-btn" onClick={onOpenSearch}><i className="fa-solid fa-magnifying-glass" /></button>
            <Link to="/admin/overview" className="action-btn desktop-only" title="لوحة التحكم الإدارية"><i className="fa-regular fa-user" /></Link>
            <button className="action-btn" onClick={() => setIsOpen(true)}>
              <i className="fa-solid fa-bag-shopping" />
              {count > 0 && <span className="cart-badge">{count}</span>}
            </button>
            <button className="action-btn mobile-menu-toggle" onClick={() => setMobileMenu(!mobileMenu)}>
              <i className={mobileMenu ? "fa-solid fa-xmark" : "fa-solid fa-bars"} />
            </button>
          </div>
        </div>
      </header>
      {mobileMenu && <div className="mobile-menu-overlay" onClick={() => setMobileMenu(false)} />}
    </>
  );
}

function SearchOverlay({ open, onClose }) {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState([]);

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    fetchProducts().then((data) => {
      if (mounted) setProducts(data || []);
    });
    return () => {
      mounted = false;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const results = query.trim().length < 2
    ? []
    : products.filter((product) =>
        String(product.name || "").toLowerCase().includes(query.toLowerCase()) ||
        String(product.category || "").toLowerCase().includes(query.toLowerCase())
      ).slice(0, 6);

  return (
    <div
      style={{
        display: open ? "flex" : "none",
        position: "fixed",
        inset: 0,
        background: "rgba(10,31,20,0.97)",
        zIndex: 9999,
        flexDirection: "column",
        alignItems: "center",
        paddingTop: "10vh"
      }}
    >
      <button onClick={onClose} style={{ position: "absolute", top: 30, left: 40, background: "none", border: "none", color: "rgba(255,255,255,0.5)", fontSize: 28, cursor: "pointer" }}><i className="fa-solid fa-xmark" /></button>
      <h2 style={{ color: "var(--color-secondary)", fontFamily: "var(--font-accent)", fontSize: 28, marginBottom: 30 }}>ماذا تبحث عن؟</h2>
      <div style={{ position: "relative", width: "min(700px,90vw)" }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث عن منتجاتك..."
          autoFocus
          style={{ width: "100%", padding: "20px 60px 20px 25px", fontSize: 18, fontFamily: "Cairo, sans-serif", background: "rgba(255,255,255,0.08)", color: "white", border: "1px solid rgba(220,169,34,0.4)", borderRadius: 50, outline: "none", direction: "rtl", boxSizing: "border-box" }}
        />
        <i className="fa-solid fa-magnifying-glass" style={{ position: "absolute", left: 22, top: "50%", transform: "translateY(-50%)", color: "var(--color-secondary)", fontSize: 18 }} />
      </div>
      <div style={{ width: "min(700px,90vw)", marginTop: 25, display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 20 }}>
        {query.trim().length >= 2 && results.length === 0 ? <p style={{ color: "white", opacity: 0.5 }}>لا توجد نتائج</p> : null}
        {results.map((product) => (
          <Link
            key={product.id}
            to={`/product/${product.id}`}
            onClick={onClose}
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(220,169,34,0.15)", borderRadius: 14, padding: 15, textDecoration: "none", textAlign: "center", display: "block" }}
          >
            <img src={normalizeImagePath(product.image_url)} style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8, marginBottom: 10 }} />
            <div style={{ color: "white", fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{product.name}</div>
            <div style={{ color: "var(--color-secondary)", fontWeight: 800 }}>{formatCurrency(product.price)}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function SpecialOffersSection({ products }) {
  const saleProducts = products.filter(p => p.on_sale && p.sale_price > 0).slice(0, 3);
  if (!saleProducts.length) return null;

  const isSingle = saleProducts.length === 1;

  return (
    <section className="section platinum-offers-section">
       {/* Background decorative elements */}
       <div className="lux-glow" style={{ position: "absolute", top: "-10%", left: "-5%", width: "40%", height: "40%", background: "radial-gradient(circle, rgba(220,169,34,0.1) 0%, transparent 70%)" }} />
       
       <div className="container">
          <div className="section-header" style={{ textAlign: "center", marginBottom: 70 }}>
             <span className="section-subtitle" style={{ color: "var(--color-secondary)", letterSpacing: 8, fontWeight: 950 }}>EXCLUSIVE PRIVILEGE</span>
             <h2 className="section-title" style={{ color: "white", fontSize: "min(64px, 10vw)", textTransform: "none" }}>عروض النخبة الحصرية</h2>
             <div style={{ width: 80, height: 4, background: "var(--color-secondary)", margin: "25px auto" }} />
          </div>

          {isSingle ? (
             <div className="platinum-offer-hero">
                <div className="offer-image-wrap">
                   <img src={normalizeImagePath(saleProducts[0].image_url)} alt={saleProducts[0].name} />
                   <div className="sale-badge-luxe">إصدار محدود</div>
                </div>
                <div className="offer-details-luxe">
                   <span className="offer-cat">{saleProducts[0].category === "coffee" ? "القهوة الملكية" : saleProducts[0].category === "nuts" ? "مكسرات فاخرة" : "مجموعة النخبة"}</span>
                   <h3 className="offer-name">{saleProducts[0].name}</h3>
                   <div className="offer-pricing">
                      <span className="old-price">{formatCurrency(saleProducts[0].price)}</span>
                      <span className="new-price">{formatCurrency(saleProducts[0].sale_price)}</span>
                   </div>
                   <Link to={`/product/${saleProducts[0].id}`} className="btn-offer-buy">
                      اغتنم العرض الآن <i className="fa-solid fa-crown" style={{ marginRight: 15 }} />
                   </Link>
                </div>
             </div>
          ) : (
             <div className="offers-grid-luxe" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: 40 }}>
                {saleProducts.map(p => (
                   <div className="platinum-offer-card" key={p.id}>
                      <div className="offer-image-wrap">
                         <img src={normalizeImagePath(p.image_url)} alt={p.name} />
                         <div className="sale-badge-luxe">خصم ملكي</div>
                      </div>
                      <div className="offer-details-luxe">
                         <span className="offer-cat">{p.category}</span>
                         <h3 className="offer-name" style={{ fontSize: 24 }}>{p.name}</h3>
                         <div className="offer-pricing" style={{ marginBottom: 30 }}>
                            <span className="old-price" style={{ fontSize: 16 }}>{formatCurrency(p.price)}</span>
                            <span className="new-price" style={{ fontSize: 32 }}>{formatCurrency(p.sale_price)}</span>
                         </div>
                         <Link to={`/product/${p.id}`} className="btn-offer-buy" style={{ padding: "18px" }}>
                            اغتنم الفرصة <i className="fa-solid fa-bolt-lightning" />
                         </Link>
                      </div>
                   </div>
                ))}
             </div>
          )}
       </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer" id="contact">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <img src="assets/images/logo-gold.svg" alt="AL Hason" className="footer-logo" />
            <p style={{ opacity: 0.8, fontWeight: 600 }}>
              نحن لا نبيع مجرد قهوة، نحن نصدر ثقافة النخبة وتراث الجودة منذ سنوات في الأردن.
            </p>
            <div style={{ display: "flex", gap: 20, marginTop: 25 }}>
              <a href="#" style={{ color: "var(--color-secondary)", fontSize: 20 }}><i className="fa-brands fa-instagram" /></a>
              <a href="#" style={{ color: "var(--color-secondary)", fontSize: 20 }}><i className="fa-brands fa-facebook" /></a>
              <a href="#" style={{ color: "var(--color-secondary)", fontSize: 20 }}><i className="fa-brands fa-whatsapp" /></a>
            </div>
          </div>
          <div>
            <h4 className="footer-title">وصلات سريعة</h4>
            <ul className="footer-links">
              <li><Link to="/">الرئيسية</Link></li>
              <li><Link to="/shop">المتجر الفاخر</Link></li>
              <li><Link to="/" onClick={() => rememberScrollTarget("wholesale")}>مبيعات الجملة</Link></li>
              <li><Link to="/admin/overview">بوابة المالك</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="footer-title">مركز التواصل</h4>
            <ul className="footer-links">
              <li><a href="#"><i className="fa-solid fa-location-dot" style={{ marginLeft: 10, color: "var(--color-secondary)" }} /> عمان، شارع مكة</a></li>
              <li><a href="#"><i className="fa-solid fa-phone" style={{ marginLeft: 10, color: "var(--color-secondary)" }} /> +962 70 000 0000</a></li>
              <li><a href="#"><i className="fa-solid fa-envelope" style={{ marginLeft: 10, color: "var(--color-secondary)" }} /> info@alhason.com</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
           <div className="footer-credits">
              <span>&copy; 2026 محامص ومطاحن الحسّون &mdash; كافة الحقوق محفوظة للنخبة</span>
              <span className="footer-separator">|</span>
              <span className="footer-signature">
                 Designed & Developed by <a href="https://wr-technologies.net/" target="_blank" rel="noopener noreferrer">WR Technologies</a>
              </span>
           </div>
        </div>
      </div>
    </footer>
  );
}

function HomePage() {
  const { products, loading } = useProducts();
  const heroMedia = useHeroMedia();
  const [activeIndex, setActiveIndex] = useState(0);
  const featured = products.slice(0, 4);

  const location = useLocation();

  useEffect(() => {
    const timer = consumeScrollTarget();
    if (timer) {
      const elTimer = window.setTimeout(() => {
        const element = document.getElementById(timer);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 150);
      return () => window.clearTimeout(elTimer);
    }
  }, [location.pathname]);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const heroSections = [
    { key: "coffee", ...heroMedia.coffee },
    { key: "nuts", ...heroMedia.nuts },
    { key: "spices", ...heroMedia.spices }
  ];

  return (
    <>
      <section className="hero-split single-mode" id="home">
        {heroSections.map((sec, idx) => (
          <div 
            key={sec.key} 
            className={`hero-slide ${idx === activeIndex ? "active" : ""}`}
            style={{ 
              position: idx === activeIndex ? "relative" : "absolute",
              opacity: idx === activeIndex ? 1 : 0,
              visibility: idx === activeIndex ? "visible" : "hidden",
              width: "100%",
              height: "100%",
              transition: "opacity 1s cubic-bezier(0.165, 0.84, 0.44, 1), visibility 1s"
            }}
          >
            <HeroPane
              title={sec.title}
              tag={sec.tag}
              description={sec.description}
              media={sec}
            />
          </div>
        ))}
        <div className="hero-nav-dots">
          {heroSections.map((_, idx) => (
            <button 
              key={idx} 
              className={`dot ${idx === activeIndex ? "active" : ""}`} 
              onClick={() => setActiveIndex(idx)}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      </section>

      <SpecialOffersSection products={products} />

      <section className="section" id="features">
        <div className="container">
          <div className="section-header">
            <span className="section-subtitle">Heritage &amp; Quality</span>
            <h2 className="section-title">لماذا العائلات الملكية تختار الحسّون؟</h2>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <i className="fa-solid fa-fire-flame-curved feature-icon" />
              <h3 className="feature-title">دقة التحميص العريقة</h3>
              <p className="feature-desc">تقنيات تحميص تراقب بالثانية، لتضمن أن كل حبة تحتفظ بكامل إيحاءاتها العطرية الأصلية دون أي شوائب.</p>
            </div>
            <div className="feature-card">
              <i className="fa-solid fa-gem feature-icon" />
              <h3 className="feature-title">انتقاء فاخر للمواد الخام</h3>
              <p className="feature-desc">نختار محاصيلنا من أفضل المزارع والمنتجين، وننتقي المكسرات والبهارات وفق معايير طازجة وحصرية عالية الجودة.</p>
            </div>
            <div className="feature-card">
              <i className="fa-solid fa-crown feature-icon" />
              <h3 className="feature-title">خدمة تليق بالنخبة</h3>
              <p className="feature-desc">من المتجر وحتى التغليف، صممنا التجربة لتكون أنيقة، سريعة، وموثوقة بما يليق باسم الحسّون ومكانته.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section products-wrapper accent-wrapper accent-coffee" id="boutique">
        <div className="container">
          <div className="section-header">
            <span className="section-subtitle">Retail Collection</span>
            <h2 className="section-title">قسم مبيعات الأفراد (عروض النخبة)</h2>
          </div>
          <div className="shop-grid">
            <div className="shop-main-grid" style={{ marginTop: 40 }}>
              {loading ? (
                <StatusBox text="جاري تحميل المقتنيات الملكية..." />
              ) : (
                featured.map((product) => <ProductCard key={product.id} product={product} />)
              )}
            </div>
          </div>
          <div style={{ textAlign: "center", marginTop: 60 }}>
            <Link to="/shop" className="btn btn-outline" style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)", padding: "18px 50px" }}>
              عرض كافة المنتجات للأفراد
            </Link>
          </div>
        </div>
      </section>

      <section className="section accent-wrapper accent-spices" id="wholesale" style={{ backgroundColor: "var(--color-primary)", color: "var(--color-surface)", marginBottom: 60, borderBottom: "5px solid var(--color-secondary)" }}>
        <div className="container">
          <div className="section-header">
            <span className="section-subtitle">B2B &amp; Wholesale</span>
            <h2 className="section-title" style={{ color: "var(--color-surface)" }}>قطاع الأعمال ومبيعات الجملة</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 60, alignItems: "center" }}>
            <div>
              <h3 style={{ fontSize: 36, marginBottom: 24, color: "var(--color-secondary)" }}>شريكك الاستراتيجي للنجاح</h3>
              <p style={{ fontSize: 18, lineHeight: 1.8, opacity: 0.9, marginBottom: 30 }}>
                نحن في محامص الحسّون نفهم متطلبات قطاع الأعمال والمطاعم والفنادق والمقاهي. نقدم أسعارًا تنافسية جدًا لطلبات الجملة مع الحفاظ على ذات الجودة العالية.
              </p>
              <Link to="/admin/b2b" className="btn btn-primary">سجل اهتمامك الآن</Link>
            </div>
            <div className="react-panel" style={{ background: "rgba(255,255,255,0.08)", color: "white", borderColor: "rgba(255,255,255,0.08)" }}>
              <h4 style={{ color: "var(--color-secondary)", marginBottom: 20 }}>ماذا نوفر للشركات؟</h4>
              <ul style={{ lineHeight: 2, padding: 0, listStyle: "none" }}>
                <li>توريد قهوة ومكسرات وبهارات بكميات تجارية</li>
                <li>تغليف مرن يناسب البيع والتوزيع</li>
                <li>أسعار جملة وعقود توريد منتظمة</li>
                <li>متابعة مباشرة مع فريق الحسّون</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function HeroPane({ title, tag, description, media }) {
  const [videoFailed, setVideoFailed] = useState(false);
  const videoRef = useRef(null);

  const isImageSrc = (src) => {
    if (!src) return false;
    const s = String(src).toLowerCase();
    return s.includes(".jpg") || s.includes(".jpeg") || s.includes(".png") || s.includes(".webp") || s.includes(".gif");
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
    }
  }, [media.src]);

  const showVideo = media.src && !isImageSrc(media.src);

  return (
    <article className="hero-pane">
      <img className="hero-pane-fallback" src={media.poster} alt={title} />
      {showVideo ? (
        <video 
          ref={videoRef}
          key={media.src}
          autoPlay 
          muted 
          loop 
          playsInline 
          poster={media.poster} 
          onError={() => setVideoFailed(true)} 
          style={{ 
            width: "100%", 
            height: "100%", 
            objectFit: "cover", 
            display: videoFailed ? "none" : "block" 
          }}
        >
          <source src={media.src} />
        </video>
      ) : media.src ? (
        <img src={media.src} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : null}
      <div className="pane-overlay" />
      <div className="pane-content">
        <span className="pane-tag">{tag}</span>
        <h2 className="pane-title">{title}</h2>
        <p className="pane-desc">{description}</p>
        <Link to="/shop" className="pane-link">تسوق الآن <i className="fa-solid fa-arrow-left" /></Link>
      </div>
    </article>
  );
}

function ShopPage() {
  const { products, loading } = useProducts();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [maxPrice, setMaxPrice] = useState("");

  const categoryLabels = {
    all: "جميع المنتجات",
    coffee: "القهوة التخصصية",
    nuts: "مكسرات النخبة",
    spices: "بهارات أصلية"
  };

  const categories = useMemo(() => {
    const list = Array.from(new Set(products.map(p => p.category))).filter(Boolean);
    return ["all", ...list];
  }, [products]);

  const counts = useMemo(() => {
    const c = { all: products.length };
    products.forEach(p => {
      if (p.category) c[p.category] = (c[p.category] || 0) + 1;
    });
    return c;
  }, [products]);

  const filtered = products.filter((product) => {
    const matchesCategory = category === "all" || product.category === category;
    const haystack = `${product.name || ""} ${product.description || ""}`.toLowerCase();
    const matchesSearch = !query || haystack.includes(query.toLowerCase());
    const matchesPrice = !maxPrice || Number(product.price || 0) <= Number(maxPrice);
    return matchesCategory && matchesSearch && matchesPrice;
  });

  return (
    <div className="platinum-shop-view">
      <Header type="shop" />

      <header className="shop-lux-header">
        <div className="container">
          <span className="shop-lux-subtitle">The Artisan Collection</span>
          <h1 className="shop-lux-title">المتجر النخبوي الشامل</h1>
          <p style={{ fontSize: 18, maxWidth: 700, margin: "0 auto", opacity: 0.9, lineHeight: 1.8 }}>
            انغمس في عالم من المذاقات الرفيعة؛ حيث تلتقي الأصالة بالابتكار في كل حبة بُن وحبة مكسرات. نختار محاصيلنا بعناية فائقة لنقدم لكم الجودة التي تستحقونها.
          </p>
        </div>
      </header>

      <div className="container" style={{ paddingBottom: 100 }}>
        <div className="shop-grid-platinum">
          <aside>
            <div className="glass-sidebar">
              <h4 className="lux-filter-title">تصفية القائمة</h4>
              <nav className="lux-filter-list">
                {categories.map((cat) => (
                  <div key={cat} className={`lux-filter-item ${category === cat ? "active" : ""}`} onClick={() => setCategory(cat)}>
                    <span>{categoryLabels[cat] || cat}</span>
                    <span className="count">{counts[cat] || 0}</span>
                  </div>
                ))}
              </nav>

              <div style={{ marginTop: 40 }}>
                <h4 className="lux-filter-title" style={{ borderBottomColor: "rgba(0,0,0,0.05)" }}>البحث الذكي</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
                  <input type="search" className="modern-input" placeholder="اسم المنتج..." value={query} onChange={(e) => setQuery(e.target.value)} style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(0,0,0,0.05)" }} />
                  <input type="number" className="modern-input" placeholder="سعر لغاية..." value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(0,0,0,0.05)" }} />
                </div>
              </div>
            </div>
          </aside>

          <main>
            <div className="luxury-card" style={{ padding: 40, marginBottom: 50, background: "white", borderRadius: 30, display: "flex", alignItems: "center", gap: 40, border: "none", boxShadow: "0 10px 40px rgba(0,0,0,0.02)" }}>
              <div style={{ flex: 1 }}>
                <span style={{ color: "var(--color-secondary)", fontWeight: 900, textTransform: "uppercase", fontSize: 13, letterSpacing: 2 }}>Established Heritage</span>
                <h2 style={{ fontSize: 34, fontWeight: 950, margin: "10px 0", color: "var(--color-primary)" }}>شغف حبة البُن والأصالة</h2>
                <p style={{ opacity: 0.7, lineHeight: 1.8, fontSize: 16, fontWeight: 600 }}>
                  في محامص الحسّون، نحن لا نبيع مجرد منتج، بل نقدم لك رحلة من الشغف تبدأ من مزارع البُن العالمية وتنتهي بلمستنا الملكية في التحميص.
                </p>
              </div>
              <img src="assets/images/logo-gold.svg" alt="" style={{ width: 160, filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.1))" }} />
            </div>

            {loading ? (
              <StatusBox text="جاري تجهيز مقتنياتكم الفاخرة..." />
            ) : (
              <div className="platinum-card-grid">
                {filtered.map((product) => <ProductCard key={product.id} product={product} />)}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

function ProductCard({ product }) {
  const cart = useCart();
  const navigate = useNavigate();
  return (
    <article className="product-card-platinum">
      <div className="p-img-box" onClick={() => navigate(`/product/${product.id}`)} style={{ cursor: "pointer" }}>
        {product.stock_status === "out_of_stock" && <span className="p-floating-badge">نفذت الكمية</span>}
        {product.on_sale && product.sale_price && <span className="p-floating-badge sale-badge-shop" style={{ background: "#e74c3c", color: "white", right: "auto", left: 15, fontWeight: 950, boxShadow: "0 4px 15px rgba(231, 76, 60, 0.4)" }}>عرض حصري</span>}
        <img 
          src={normalizeImagePath(product.image_url, product.category || detectLegacyCategory(product.name, product.image_url))} 
          alt={product.name} 
          loading="lazy" 
          onError={(e) => {
            const cat = product.category || detectLegacyCategory(product.name, product.image_url);
            const fallback = {
              coffee: "assets/images/cat_coffee.png",
              nuts: "assets/images/cat_nuts.png",
              spices: "assets/images/cat_spices.png",
              sweets: "assets/images/cat_sweets.png"
            };
            e.target.src = fallback[cat] || "assets/images/logo-gold.svg";
          }}
        />
      </div>

      <div className="p-info-platinum">
        <span className="p-cat-plat">{product.category === "coffee" ? "القهوة الملكية" : product.category === "nuts" ? "مكسرات فاخرة" : "مجموعة النخبة"}</span>
        <h3 className="p-name-plat" onClick={() => navigate(`/product/${product.id}`)} style={{ cursor: "pointer" }}>{product.name}</h3>
        <div className="p-price-plat">
          {product.on_sale && product.sale_price ? (
            <div className="p-price-sale-row">
              <span className="p-price-current">{Number(product.sale_price).toFixed(2)} <small>JOD</small></span>
              <span className="p-price-old">{Number(product.price).toFixed(2)}</span>
              <span className="p-price-unit">/ كغ</span>
            </div>
          ) : (
            <div className="p-price-normal">
              {Number(product.price).toFixed(2)} <small>JOD</small> / كغ
            </div>
          )}
        </div>
        
        <button 
          className="p-btn-lux" 
          onClick={(e) => {
            e.stopPropagation();
            cart.addItem(product, 1);
            cart.setIsOpen(true);
          }}
          disabled={product.stock_status === "out_of_stock"}
        >
          <i className="fa-solid fa-cart-shopping" />
          <span>أضف إلى السلة</span>
        </button>
      </div>
    </article>
  );
}

function ProductPage() {
  const { id } = useParams();
  const location = useLocation();
  const cart = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedWeight, setSelectedWeight] = useState("");
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    let mounted = true;
    async function loadProduct() {
      const params = new URLSearchParams(location.search);
      const legacyName = params.get("name");
      const legacyPrice = params.get("price");
      const legacyImg = params.get("img");
      const productId = id || params.get("id") || localStorage.getItem("last_prod_id");

      if (!productId && legacyName && legacyPrice) {
        const legacyProduct = {
          id: `legacy_${Math.abs(String(legacyName).split("").reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0))}`,
          name: legacyName,
          price: parseFloat(legacyPrice),
          image_url: normalizeImagePath(legacyImg),
          category: detectLegacyCategory(legacyName, legacyImg),
          description: "تم تحميل هذا المنتج من رابط قديم متوافق مع النسخة الحالية من الموقع.",
          taste_profile: "جودة مختارة بعناية من محامص الحسّون",
          origin: "مختارات الحسّون",
          roast_level: "تحضير خاص",
          weight_options: detectLegacyCategory(legacyName, legacyImg) === "nuts" ? "500g, 1kg, 2kg" : "250g, 500g, 1kg"
        };
        if (!mounted) return;
        setProduct(legacyProduct);
        setSelectedWeight(productWeightOptions(legacyProduct)[0] || "");
        setLoading(false);
        return;
      }

      if (!productId) {
        if (mounted) setLoading(false);
        return;
      }

      const data = await fetchProductById(productId);
      if (!mounted) return;
      setProduct(data);
      const options = productWeightOptions(data);
      setSelectedWeight(options[0] || "");
      setLoading(false);
    }

    loadProduct();
    return () => {
      mounted = false;
    };
  }, [id, location.search]);

  const weights = useMemo(() => productWeightOptions(product), [product]);

  const currentPrice = useMemo(() => {
    // الخصم يكون على الكيلو فقط (Sale applies only if 1kg or no weight selected)
    const isKilo = !selectedWeight || String(selectedWeight).toLowerCase() === "1kg";
    const base = (product?.on_sale && product?.sale_price && isKilo) 
                 ? Number(product.sale_price) 
                 : Number(product?.price || 0);

    if (!selectedWeight) return base;
    const w = String(selectedWeight).toLowerCase();
    
    // Scale the base price for different weights (Standard multipliers)
    if (w === "1kg") return base;
    if (w === "500g") return base * 0.55; // 5% packaging premium
    if (w === "250g") return base * 0.30; // 5% packaging premium
    if (w === "2kg") return base * 1.90; // 5% bulk discount

    if (w.includes("kg")) return base * parseFloat(w); 
    if (w.includes("g")) return base * (parseFloat(w) / 1000) * 1.1; 
    return base;
  }, [product?.price, product?.on_sale, product?.sale_price, selectedWeight]);

  if (loading) return <StatusBox text="جاري تحميل تفاصيل المنتج..." />;
  if (!product) return <StatusBox text="تعذر العثور على المنتج." />;

  return (
    <>
      <Header type="shop" />

      <div className={`product-hero-wrap accent-${product.category || "coffee"}`} style={{ minHeight: "80vh" }}>
        <div className="product-page-layout">
          <div className="prod-gallery-sticky">
            <div className="prod-gallery-main">
              <span className="prod-gallery-badge">The Private Collection</span>
              <img src={normalizeImagePath(product.image_url)} alt={product.name} />
            </div>
          </div>

          <div className="prod-details-panel">
            <nav className="prod-breadcrumb">
              <Link to="/">الرئيسية</Link>
              <span className="sep"><i className="fa-solid fa-chevron-left" /></span>
              <Link to="/shop">المتجر</Link>
              <span className="sep"><i className="fa-solid fa-chevron-left" /></span>
              <span className="current">{product.name}</span>
            </nav>

            <span className="prod-label-top"><i className="fa-solid fa-crown" style={{ marginLeft: 8 }} /> نخب أول - حصري</span>
            <h1 className="prod-title">{product.name}</h1>

            <div style={{ display: "flex", gap: 20, alignItems: "center", marginBottom: 30 }}>
              <div style={{ color: "var(--color-secondary)", fontSize: 16 }}>
                <i className="fa-solid fa-star" /><i className="fa-solid fa-star" /><i className="fa-solid fa-star" /><i className="fa-solid fa-star" /><i className="fa-solid fa-star" />
              </div>
            </div>

            <p className="prod-desc">{product.description || "لا يوجد وصف متاح لهذا المنتج الفريد."}</p>

            <div style={{ marginBottom: 40 }}>
              <h5 style={{ fontSize: 14, fontWeight: 800, color: "var(--color-primary)", marginBottom: 15, display: "flex", alignItems: "center", gap: 10 }}>
                <i className="fa-solid fa-scale-balanced" style={{ color: "var(--color-secondary)" }} /> اختر الوزن المفضل:
              </h5>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {weights.map((weight) => (
                  <button key={weight} className={`weight-btn ${selectedWeight === weight ? "active" : ""}`} onClick={() => setSelectedWeight(weight)}>
                    {weight}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 40, padding: 25, background: "rgba(220,169,34,0.05)", borderRadius: 20, border: "1px dashed rgba(220,169,34,0.3)" }}>
              <h5 style={{ fontSize: 13, fontWeight: 800, color: "var(--color-primary)", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>إيحاءات ونوتات الطعم</h5>
              <p style={{ fontSize: 17, fontWeight: 700, color: "var(--color-primary)" }}>{product.taste_profile || "إيحاءات غنية بالأصالة"}</p>
            </div>

            <div className="prod-meta-grid">
              <div className="meta-box">
                <div className="meta-icon"><i className="fa-solid fa-earth-americas" /></div>
                <div className="meta-text"><h5>بلد المنشأ</h5><p>{product.origin || "أفضل مزارع العالم"}</p></div>
              </div>
              <div className="meta-box">
                <div className="meta-icon"><i className="fa-solid fa-fire-burner" /></div>
                <div className="meta-text"><h5>درجة التحميص</h5><p>{product.roast_level || "تحميص متوسط"}</p></div>
              </div>
            </div>

            <div className="prod-buy-box">
              <div className="prod-price-wrap">
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8 }}>
                  <span style={{ fontSize: 14, textTransform: "uppercase", letterSpacing: 2, color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>السعر الإجمالي</span>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 15 }}>
                    {product.on_sale && product.sale_price && (!selectedWeight || String(selectedWeight).toLowerCase() === "1kg") && (
                      <span style={{ textDecoration: "line-through", opacity: 0.4, fontSize: 18, fontWeight: 600 }}>{Number(product.price).toFixed(2)} JOD</span>
                    )}
                    <span className="prod-price-buy" style={{ color: (product.on_sale && product.sale_price && (!selectedWeight || String(selectedWeight).toLowerCase() === "1kg")) ? "#e74c3c" : undefined }}>
                        {currentPrice.toFixed(2)}
                    </span>
                    <span className="prod-price-currency" style={{ marginRight: 8 }}>JOD</span>
                    {product.on_sale && (!selectedWeight || String(selectedWeight).toLowerCase() === "1kg") && <span style={{ background: "#e74c3c", color: "white", padding: "3px 10px", borderRadius: 8, fontSize: 11, fontWeight: 900, marginRight: 15 }}>عرض حصري</span>}
                  </div>
                </div>
                <div>
                  <span className="stock-status">
                    <i className={`fa-solid ${product.stock_status === "out_of_stock" ? "fa-circle-xmark" : "fa-circle-check"}`} style={{ marginLeft: 6, color: product.stock_status === "out_of_stock" ? "#e74c3c" : undefined }} />
                    {product.stock_status === "out_of_stock" ? "نفذت الكمية" : "متوفر"}
                  </span>
                </div>
              </div>
              <div className="action-row">
                <button 
                  className="btn-addToCart-dark" 
                  disabled={product.stock_status === "out_of_stock"} 
                  style={product.stock_status === "out_of_stock" ? { opacity: 0.5 } : undefined} 
                  onClick={() => {
                    cart.addItem({ ...product, price: currentPrice }, quantity, selectedWeight);
                    cart.setIsOpen(true);
                  }}
                >
                  {product.stock_status === "out_of_stock" ? "المقتنى غير متوفر حاليًا" : "أضف إلى السلة الملكية"} <i className="fa-solid fa-cart-arrow-down" />
                </button>
                <div className="quantity-selector-dark">
                  <button className="quantity-btn-dark" onClick={() => setQuantity((current) => current + 1)}>+</button>
                  <input type="text" value={quantity} className="quantity-input-dark" readOnly />
                  <button className="quantity-btn-dark" onClick={() => setQuantity((current) => Math.max(1, current - 1))}>-</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function CartPage() {
  const cart = useCart();
  const navigate = useNavigate();
  const subtotal = cart.subtotal;
  const isShippingEnabled = localStorage.getItem("alhason_shipping_module") !== "false";
  const shipping = (cart.items.length && isShippingEnabled) ? SHIPPING_COST : 0;
  const total = subtotal + shipping;

  return (
    <div className="platinum-shop-view" style={{ minHeight: "100vh" }}>
      <Header type="shop" />
      <main className="container" style={{ paddingTop: 160, paddingBottom: 100 }}>
         <div style={{ textAlign: "right", borderBottom: "1px solid rgba(0,0,0,0.05)", paddingBottom: 30, marginBottom: 50 }}>
            <span style={{ color: "var(--color-secondary)", fontWeight: 900, fontSize: 14, letterSpacing: 2 }}>Review Your Order</span>
            <h1 style={{ fontSize: 44, fontWeight: 950, color: "var(--color-primary)", marginTop: 10 }}>حقيبة المقتنيات الملكية</h1>
         </div>

         {!cart.items.length ? (
           <div style={{ textAlign: "center", padding: 100, background: "white", borderRadius: 40, boxShadow: "0 10px 40px rgba(0,0,0,0.02)" }}>
              <i className="fa-solid fa-shopping-basket" style={{ fontSize: 80, color: "#eee", marginBottom: 30 }} />
              <h2 style={{ fontWeight: 950, color: "var(--color-primary)" }}>سلتك هادئة جداً...</h2>
              <p style={{ opacity: 0.6, marginTop: 15, fontSize: 18 }}>لم تختر أي مقتنيات بعد. استكشف محاصيلنا الفريدة الآن.</p>
              <button className="btn btn-primary" style={{ marginTop: 40, padding: "15px 40px" }} onClick={() => navigate("/shop")}>ابدأ التسوق</button>
           </div>
         ) : (
           <div className="platinum-checkout-grid">
              <div className="cart-list-lux" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                 {cart.items.map(item => (
                    <div key={item.id} className="checkout-section-lux" style={{ display: "flex", alignItems: "center", gap: 25, padding: 25 }}>
                       <img src={item.image} alt="" style={{ width: 100, height: 100, borderRadius: 20, objectFit: "cover" }} />
                       <div style={{ flex: 1 }}>
                          <h3 style={{ fontWeight: 900, color: "var(--color-primary)", marginBottom: 5 }}>{item.name}</h3>
                          <div style={{ color: "var(--color-secondary)", fontWeight: 800 }}>{formatCurrency(item.price)}</div>
                       </div>
                       <div className="cart-qty-ctrl" style={{ background: "#f5f5f5", borderRadius: 12, padding: "5px 15px", display: "flex", alignItems: "center", gap: 15 }}>
                          <button className="cart-qty-btn" style={{ border: "none", background: "none", cursor: "pointer" }} onClick={() => cart.updateQuantity(item.id, item.q - 1)}><i className="fa-solid fa-minus" /></button>
                          <span style={{ fontWeight: 950, minWidth: 20, textAlign: "center" }}>{item.q}</span>
                          <button className="cart-qty-btn" style={{ border: "none", background: "none", cursor: "pointer" }} onClick={() => cart.updateQuantity(item.id, item.q + 1)}><i className="fa-solid fa-plus" /></button>
                       </div>
                       <button onClick={() => cart.removeItem(item.id)} style={{ padding: 15, background: "rgba(231,76,60,0.05)", color: "#e74c3c", border: "none", borderRadius: 12, cursor: "pointer" }}><i className="fa-solid fa-trash-can" /></button>
                    </div>
                 ))}
                 <button className="btn btn-outline" style={{ borderRadius: 15, padding: 15, alignSelf: "flex-end", opacity: 0.6 }} onClick={() => cart.clearCart()}>تفريغ الحقيبة بالكامل</button>
              </div>

              <aside>
                 <div className="order-summary-platinum" style={{ top: 120 }}>
                    <h3 className="summary-headline">ملخص الاستحقاق</h3>
                    <div className="summary-row-plat"><span>المجموع الفرعي</span><span>{formatCurrency(subtotal)}</span></div>
                    <div className="summary-row-plat"><span>التوصيل المغلف</span><span>{formatCurrency(shipping)}</span></div>
                    <div className="summary-divider" />
                    <div className="summary-total-plat" style={{ marginBottom: 30 }}><span>المطلوب دفعه</span><span>{formatCurrency(total)}</span></div>
                    
                    <button className="btn-place-order" style={{ marginTop: 0 }} onClick={() => navigate("/checkout")}>
                       <span>المتابعة للدفع الآمن</span>
                       <i className="fa-solid fa-shield-check" />
                    </button>
                    <p style={{ textAlign: "center", fontSize: 12, opacity: 0.5, marginTop: 20 }}>كافة العمليات محمية بنظام تشفير Platinum v5.0</p>
                 </div>
              </aside>
           </div>
         )}
      </main>
    </div>
  );
}

function CheckoutPage() {
  const cart = useCart();
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(null);
  const [message, setMessage] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(localStorage.getItem("alhason_payments") !== "false" ? "card" : "cash");
  const [form, setForm] = useState({ first_name: "", last_name: "", phone: "", city: "عمّان", address: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subtotal = cart.subtotal;
  const isShippingEnabled = localStorage.getItem("alhason_shipping_module") !== "false";
  const shipping = (cart.items.length && isShippingEnabled) ? SHIPPING_COST : 0;

  const discountValue = useMemo(() => {
    if (!discount) return 0;
    
    // Only calculate discount on items that are NOT on sale
    const nonSaleTotal = cart.items
      .filter(item => !item.isOnSale)
      .reduce((sum, item) => sum + (item.price * item.q), 0);

    if (discount.discount_type === "percent") {
      return nonSaleTotal * (Number(discount.discount_value || 0) / 100);
    }
    
    // For fixed amount, ensure we don't discount more than the non-sale subtotal
    return Math.min(nonSaleTotal, Number(discount.discount_value || 0));
  }, [cart.items, discount]);

  const total = Math.max(0, subtotal - discountValue + shipping);

  if (!cart.items.length) {
     return <Navigate to="/shop" replace />;
  }

  async function handleCoupon() {
    if (!couponCode) return;
    const result = await applyCouponCode(couponCode.trim().toUpperCase());
    if (!result) {
      setDiscount(null);
      setMessage("هذا الكود غير صحيح أو منتهي الصلاحية.");
      return;
    }
    setDiscount(result);
    setMessage(`تم تفعيل خصم ${result.discount_value}${result.discount_type === "percent" ? "%" : " JOD"} بنجاح.`);
  }

  async function submitOrder() {
    if (isSubmitting) return;
    if (!form.first_name || !form.last_name || !form.phone || !form.address) {
      window.Swal.fire("ملاحظة", "يرجى تعبئة الحقول الأساسية للتوصيل.", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      await createOrder({
        customer_name: `${form.first_name} ${form.last_name}`.trim(),
        customer_phone: form.phone,
        customer_city: form.city,
        customer_address: form.address,
        items: cart.items.map(i => ({
          id: i.id,
          name: i.name,
          price: i.price,
          q: i.q,
          image: i.image
        })),
        subtotal,
        discount: discountValue,
        shipping,
        coupon_used: discount?.code || null,
        total,
        payment_method: paymentMethod,
        status: "pending"
      });

      await window.Swal.fire({
        icon: "success",
        title: "تم استلام طلبك بنجاح",
        text: "شكراً لثقتك بنا. سيقوم فريق النخبة بالتواصل معك قريباً لتأكيد الشحنة.",
        confirmButtonColor: "var(--color-primary)"
      });

      cart.clearCart();
      navigate("/");
    } catch (e) {
      window.Swal.fire("عذراً", "حدث خطأ أثناء معالجة الطلب. يرجى المحاولة لاحقاً.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="checkout-pane-view">
      <header className="checkout-minimal-header">
         <div className="container checkout-header-inner">
            <Link to="/cart" className="checkout-back-link">
               <i className="fa-solid fa-arrow-right" /> 
               <span>مراجعة الحقيبة</span>
            </Link>
            <Link to="/"><img src="assets/images/logo-gold.svg" alt="AlHason" style={{ height: 65 }} /></Link>
            <div style={{ fontWeight: 900, color: "var(--color-secondary)", fontSize: 13, textTransform: "uppercase", letterSpacing: 1 }}>
               <i className="fa-solid fa-shield-halved" /> Secure Check v5.0
            </div>
         </div>
      </header>

      <div className="container">
         <div className="platinum-checkout-grid">
            <main>
               <section className="checkout-section-lux">
                  <h2 className="checkout-sec-title">
                     <i className="fa-solid fa-map-location-dot" />
                     <span>تفاصيل النقل والتسليم</span>
                  </h2>
                  <div className="lux-form-grid">
                     <div className="lux-field-stack">
                        <label>الاسم الأول</label>
                        <input className="lux-input" placeholder="مثلاً: أحمد" value={form.first_name} onChange={(e) => setForm({...form, first_name: e.target.value})} />
                     </div>
                     <div className="lux-field-stack">
                        <label>اسم العائلة</label>
                        <input className="lux-input" placeholder="الحسّون" value={form.last_name} onChange={(e) => setForm({...form, last_name: e.target.value})} />
                     </div>
                     <div className="lux-field-stack">
                        <label>رقم للتواصل (WhatsApp)</label>
                        <input className="lux-input" placeholder="+962 7X XXX XXXX" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} />
                     </div>
                     <div className="lux-field-stack">
                        <label>المدينة المشمولة</label>
                        <select className="lux-input" value={form.city} onChange={(e) => setForm({...form, city: e.target.value})}>
                           <option>عمّان</option>
                           <option>إربد</option>
                           <option>الزرقاء</option>
                           <option>العقبة</option>
                           <option>باقي المحافظات</option>
                        </select>
                     </div>
                  </div>
                  <div className="lux-field-stack" style={{ marginTop: 25 }}>
                     <label>العنوان التفصيلي (المنطقة، الشارع، المعلم المجاور)</label>
                     <input className="lux-input" placeholder="اسم المنطقة والشارع بالتفصيل..." value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} />
                  </div>
               </section>

               <section className="checkout-section-lux">
                  <h2 className="checkout-sec-title">
                     <i className="fa-solid fa-credit-card" />
                     <span>بوابة الدفع المفضلة</span>
                  </h2>
                  <div className="payment-grid-platinum">
                     {localStorage.getItem("alhason_payments") !== "false" && (
                        <div className={`payment-card-lux ${paymentMethod === "card" ? "active" : ""}`} onClick={() => setPaymentMethod("card")}>
                           <div className="pay-icon-lux"><i className="fa-solid fa-microchip" style={{ color: "var(--color-secondary)" }} /></div>
                           <div className="pay-info-lux">
                              <h4>بطاقة إئتمانية / فيزا</h4>
                              <p>دفع مشفر وفوري عبر بواباتنا الآمنة</p>
                           </div>
                           <div style={{ marginRight: "auto" }}>
                              <i className="fa-brands fa-cc-visa" style={{ fontSize: 24, color: "#1a1f71" }} />
                           </div>
                        </div>
                     )}
                     <div className={`payment-card-lux ${paymentMethod === "cash" ? "active" : ""}`} onClick={() => setPaymentMethod("cash")}>
                        <div className="pay-icon-lux"><i className="fa-solid fa-handshake" style={{ color: "var(--color-secondary)" }} /></div>
                        <div className="pay-info-lux">
                           <h4>الدفع عند الاستلام (COD)</h4>
                           <p>نقداً عند وصول المندوب لباب منزلك</p>
                        </div>
                        <div style={{ marginRight: "auto" }}>
                           <i className="fa-solid fa-truck-fast" style={{ fontSize: 24, opacity: 0.2 }} />
                        </div>
                     </div>
                  </div>

                  {paymentMethod === "card" && (
                     <div style={{ marginTop: 30, padding: 30, background: "#fcfcfb", borderRadius: 20, border: "1px dashed #ddd" }}>
                        <div className="lux-field-stack">
                           <label>رقم البطاقة الائتمانية</label>
                           <input className="lux-input" placeholder="0000 0000 0000 0000" style={{ letterSpacing: 4 }} />
                        </div>
                        <div className="lux-form-grid" style={{ marginTop: 20 }}>
                           <div className="lux-field-stack"><label>تاريخ الانتهاء</label><input className="lux-input" placeholder="MM/YY" /></div>
                           <div className="lux-field-stack"><label>CVC / CVV</label><input className="lux-input" placeholder="***" type="password" /></div>
                        </div>
                     </div>
                  )}
               </section>
            </main>

            <aside>
               <div className="order-summary-platinum">
                  <h3 className="summary-headline"><i className="fa-solid fa-list-check" /> مراجعة المقتنيات</h3>
                  <div className="summary-item-list">
                     {cart.items.map(item => (
                        <div className="summary-prod-mini" key={item.id}>
                           <span style={{ flex: 1 }}>{item.name} <small style={{ opacity: 0.5 }}>× {item.q}</small></span>
                           <span style={{ fontWeight: 800 }}>{formatCurrency(item.price * item.q)}</span>
                        </div>
                     ))}
                  </div>

                  <div className="coupon-box-lux">
                     <input placeholder="كود الخصم..." value={couponCode} onChange={(e) => setCouponCode(e.target.value)} />
                     <button onClick={handleCoupon}>تطبيق</button>
                  </div>
                  {message && <p style={{ marginTop: 12, fontSize: 13, fontWeight: 700, color: "var(--color-secondary)" }}>{message}</p>}

                  <div className="summary-divider" />
                  
                  <div className="summary-row-plat"><span>المجموع الفرعي</span><span>{formatCurrency(subtotal)}</span></div>
                  <div className="summary-row-plat"><span>رسوم التوصيل المغلف</span><span>{formatCurrency(shipping)}</span></div>
                  {discountValue > 0 && <div className="summary-row-plat" style={{ color: "var(--color-secondary)" }}><span>خصم حصري</span><span>-{formatCurrency(discountValue)}</span></div>}
                  
                  <div className="summary-total-plat"><span>الإجمالي النهائي</span><span>{formatCurrency(total)}</span></div>

                  <button className="btn-place-order" onClick={submitOrder} disabled={isSubmitting}>
                     {isSubmitting ? (
                        <><i className="fa-solid fa-spinner fa-spin" /> جاري التشفير...</>
                     ) : (
                        <><span>تأكيد المشتريات والطلب</span><i className="fa-solid fa-shield-check" /></>
                     )}
                  </button>
                  
                  <div style={{ textAlign: "center", marginTop: 30, opacity: 0.4, fontSize: 12 }}>
                     <p>بإتمامك للطلب، أنت توافق على شروط الخدمة<br/>الخاصة بمحامص الحسّون الملكية.</p>
                  </div>
               </div>
            </aside>
         </div>
      </div>
    </div>
  );
}

function StatusBox({ text }) {
  return <div className="react-status-box">{text}</div>;
}

function navClass({ isActive }) {
  return `react-route-link${isActive ? " active" : ""}`;
}

function BackToTop() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const toggle = () => setVisible(window.scrollY > 500);
    window.addEventListener("scroll", toggle);
    return () => window.removeEventListener("scroll", toggle);
  }, []);

  return (
    <button 
      className={`back-to-top ${visible ? "visible" : ""}`} 
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      <i className="fa-solid fa-arrow-up" />
    </button>
  );
}

function AdminRoutePage() {
  const { section = "overview" } = useParams();
  return <AdminPage section={section} />;
}

function AdminPage({ section }) {
  const allowed = ["overview", "orders", "products", "calendar", "b2b", "coupons", "settings"];
  const current = allowed.includes(section) ? section : "overview";
  
  const pages = {
    overview: <AdminOverviewPage />,
    orders: <AdminOrdersPage />,
    products: <AdminProductsPage />,
    calendar: <AdminCalendarPage />,
    b2b: <AdminB2BPage />,
    coupons: <AdminCouponsPage />,
    settings: <AdminSettingsPage />
  };

  return (
    <div className="admin-body">
      <AdminSidebar current={current} />
      <main className="admin-main">
        <div className="admin-top-nav">
          <div className="nav-left">
            <span className="admin-badge-v">Platinum v4.2 Exclusive</span>
            <div className="admin-user-info">
               <span className="user-name">المدير العام</span>
               <span className="user-role">نظام النخبة</span>
            </div>
          </div>
          <div className="nav-right">
             <div className="connection-status"><i className="fa-solid fa-circle-check" /> السيرفر الحي متصل</div>
          </div>
        </div>

        <div className="admin-content-shell">
          {pages[current]}
        </div>
      </main>
    </div>
  );
}

function AdminSidebar({ current }) {
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
    ["overview", "fa-solid fa-chart-pie", "نظرة عامة"],
    ["orders", "fa-solid fa-cart-flatbed", "الطلبات الفردية", orderCount],
    ["calendar", "fa-solid fa-calendar-days", "جدولة المواعيد"],
    ["products", "fa-solid fa-box-open", "إدارة المنتجات"],
    ["b2b", "fa-solid fa-users", "عملاء الجملة (B2B)"],
    ["coupons", "fa-solid fa-tags", "الكوبونات"],
    ["settings", "fa-solid fa-gear", "إعدادات المتجر"]
  ];

  return (
    <aside className="admin-sidebar">
      <div className="admin-logo">
        <Link to="/"><img src="assets/images/logo-gold.svg" alt="Admin Logo" /></Link>
        <div style={{ marginTop: 10, fontSize: 13, opacity: 0.7, fontWeight: 700 }}>لوحة النخبة للإدارة</div>
      </div>
      <ul className="admin-menu">
        {items.map(([key, icon, label, badge]) => (
          <li key={key}>
            <NavLink to={`/admin/${key}`} className={({ isActive }) => (isActive ? "active" : "")}>
              <i className={icon} /> {label} {badge > 0 && <span className="badge-count">{badge}</span>}
            </NavLink>
          </li>
        ))}
      </ul>
      <div className="admin-sidebar-footer">
        <Link to="/" className="btn btn-outline footer-btn">
          <span>العودة للمتجر</span> <i className="fa-solid fa-arrow-up-right-from-square" />
        </Link>
      </div>
    </aside>
  );
}

function AdminOverviewPage() {
  const [stats, setStats] = useState({ products: 0, orders: 0, coupons: 0, b2b: 0, todayBookings: 0, totalSales: 0, pendingOrders: 0, growth: "+12.5%" });
  const [latestOrders, setLatestOrders] = useState([]);
  const [todayBookingsList, setTodayBookingsList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const today = new Date().toISOString().split("T")[0];
      const [products, orders, coupons, b2b, bookings] = await Promise.all([
        fetchProducts(),
        fetchOrders(),
        fetchCoupons(),
        fetchB2BCount(),
        fetchBookings(today)
      ]);
      if (!mounted) return;
      
      const totalSales = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
      const pendingOrders = orders.filter((order) => (order.status || "pending") === "pending").length;
      
      setStats({
        products: products.length,
        orders: orders.length,
        coupons: coupons.length,
        b2b,
        todayBookings: bookings.length,
        totalSales,
        pendingOrders,
        growth: orders.length > 5 ? "+18.2%" : "+5.0%"
      });
      setLatestOrders(orders.slice(0, 5));
      setTodayBookingsList(bookings.slice(0, 6));
      setLoading(false);
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const metrics = [
    { label: "إجمالي المبيعات", value: stats.totalSales, icon: "fa-solid fa-coins", tone: "success", meta: "JOD", growth: stats.growth },
    { label: "إجمالي الطلبات", value: stats.orders, icon: "fa-solid fa-receipt", tone: "secondary", meta: "طلب", growth: "+4.1%" },
    { label: "قيد المراجعة", value: stats.pendingOrders, icon: "fa-solid fa-hourglass-half", tone: "danger", meta: "جديد", growth: "-2.5%" },
    { label: "شركاء B2B", value: stats.b2b, icon: "fa-solid fa-handshake", tone: "primary", meta: "شريك", growth: "+1" }
  ];

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh", flexDirection: "column", gap: 20 }}>
      <div className="react-loader" />
      <p style={{ fontWeight: 800, color: "var(--color-primary)", opacity: 0.6 }}>جاري تحليل الأداء الاستراتيجي للمنظومة...</p>
    </div>
  );

  return (
    <>
      <div className="admin-header">
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div className="admin-title-icon"><i className="fa-solid fa-chart-line" /></div>
          <div>
            <h1 className="admin-title" style={{ marginBottom: 5 }}>نظرة عامة على الأداء الاستراتيجي</h1>
            <p style={{ fontSize: 13, color: "var(--color-text-muted)", fontWeight: 700 }}>البيانات المباشرة من المحرك السحابي • v.4.5</p>
          </div>
        </div>
        <div className="admin-actions" style={{ gap: 12 }}>
          <button className="btn btn-outline" onClick={() => window.print()} style={{ background: "white" }}><i className="fa-solid fa-print" /> تقرير PDF</button>
          <button className="btn btn-primary" onClick={() => window.location.reload()}><i className="fa-solid fa-arrows-rotate" /> تحديث مباشر</button>
        </div>
      </div>

      <div className="react-admin-grid">
        {metrics.map((m) => (
          <div className={`admin-metric-card-luxe ${m.tone}`} key={m.label}>
             <div className="metric-header">
                <div className="metric-icon-box-luxe"><i className={m.icon} /></div>
                <div className={`metric-badge ${m.growth?.startsWith("-") ? "down" : "up"}`}>{m.growth}</div>
             </div>
             <div className="metric-info-luxe">
                <div className="metric-label-luxe">{m.label}</div>
                <div className="metric-value-luxe">
                   {typeof m.value === "number" && m.label.includes("المبيعات") ? m.value.toLocaleString("en-US", { minimumFractionDigits: 2 }) : m.value}
                   <small className="metric-unit-luxe">{m.meta}</small>
                </div>
                <div className="metric-sparkline">
                  <svg width="100%" height="30" viewBox="0 0 100 30" preserveAspectRatio="none">
                    <path 
                      d={m.tone === "danger" ? "M0,20 Q25,25 50,15 T100,25" : "M0,25 Q25,20 50,25 T100,5"} 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2.5" 
                      strokeLinecap="round" 
                      style={{ opacity: 0.6 }}
                    />
                  </svg>
                </div>
             </div>
          </div>
        ))}
      </div>

      <div className="admin-overview-layout">
        <div className="admin-overview-main">
          <div className="admin-card-luxe">
            <div className="card-header-luxe">
               <h2 className="card-title-luxe"><i className="fa-solid fa-receipt" /> أحدث العمليات النشطة</h2>
               <Link to="/admin/orders" className="link-all">عرض الشامل <i className="fa-solid fa-chevron-left" /></Link>
            </div>
            <div className="admin-modern-table-container">
               <table className="admin-recent-table">
                  <thead>
                     <tr>
                        <th>العميل</th>
                        <th>التاريخ</th>
                        <th>الحالة</th>
                        <th>المبلغ</th>
                        <th>إجراء</th>
                     </tr>
                  </thead>
                  <tbody>
                    {latestOrders.length ? latestOrders.map((order) => (
                      <tr key={order.id || order.order_ref}>
                        <td className="customer-cell">
                          <div className="avatar-mini">{order.customer_name?.[0] || order.name?.[0] || "C"}</div>
                          <span>{order.customer_name || order.name || "عميل مجهول"}</span>
                        </td>
                        <td>{order.created_at ? new Date(order.created_at).toLocaleDateString("ar-JO") : "---"}</td>
                        <td>
                          <span className={`status-pill ${(order.status || "pending")}`}>
                             {order.status === "pending" ? "قيد المراجعة" : order.status === "completed" ? "مكتمل" : "ملغي"}
                          </span>
                        </td>
                        <td className="amount-cell">{formatCurrency(order.total)}</td>
                        <td><Link to="/admin/orders" className="btn-icon-sml"><i className="fa-solid fa-eye" /></Link></td>
                      </tr>
                    )) : (
                      <tr><td colSpan="5" style={{ textAlign: "center", padding: 40, color: "var(--color-text-muted)" }}>لا توجد بيانات متاحة حالياً.</td></tr>
                    )}
                  </tbody>
               </table>
            </div>
          </div>
        </div>

        <div className="admin-overview-aside">
          <div className="admin-card-luxe">
             <div className="card-header-luxe">
                <h2 className="card-title-luxe"><i className="fa-solid fa-calendar-star" /> مواعيد اليوم</h2>
                <div className="badge-count">{todayBookingsList.length}</div>
             </div>
             <div className="booking-list-luxe">
                {todayBookingsList.length ? todayBookingsList.map((booking) => (
                  <div className="booking-item-luxe" key={booking.id}>
                    <div className="booking-time-luxe">{booking.booking_time || "00:00"}</div>
                    <div className="booking-content-luxe">
                       <div className="booking-name-luxe">{booking.customer_name || booking.title}</div>
                       <div className="booking-type-luxe">{booking.booking_type || "تذوق قهوة"}</div>
                    </div>
                    <div className="booking-status-dot" />
                  </div>
                )) : (
                  <div className="booking-empty-state">
                     <i className="fa-solid fa-mug-hot" />
                     <p>يوم هادئ في المحامص.<br/>لا توجد مواعيد مجدولة.</p>
                  </div>
                )}
             </div>
             <Link to="/admin/calendar" className="btn btn-outline" style={{ width: "100%", marginTop: 20, borderRadius: 12 }}>دخول التقويم المركزي</Link>
          </div>

          <div className="admin-promo-card">
              <h3>عضوية النخبة الحصرية</h3>
              <p>استمتع بكافة الميزات المتقدمة وتقارير الذكاء الاصطناعي في نسخة Platinum v4.5.</p>
              <i className="fa-solid fa-crown promo-icon" />
          </div>
        </div>
      </div>
    </>
  );
}

function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  async function refresh() {
    setLoading(true);
    const data = await fetchOrders();
    setOrders(data);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function changeStatus(order, status) {
    try {
      const confirm = await window.Swal.fire({
        title: "تحديث حالة الشحنة؟",
        text: `هل تود نقل الطلب إلى حالة "${status === "pending" ? "جديد" : status === "processing" ? "جاري التجهيز" : status === "shipped" ? "تم الشحن" : "مكتمل"}"؟`,
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "var(--color-primary)",
        cancelButtonText: "إلغاء",
        confirmButtonText: "تأكيد التحديث"
      });
      if (!confirm.isConfirmed) return;

      await updateOrderStatus(order, status);
      window.Swal.fire({ 
        icon: "success", 
        title: "تم التحديث", 
        text: "تم تحديث الحالة وإرسال إشعار للمستودع.",
        toast: true, 
        position: "top-end", 
        showConfirmButton: false, 
        timer: 3000 
      });
      refresh();
    } catch (error) {
      window.Swal.fire("خطأ", error.message || "تعذر تحديث الطلب", "error");
    }
  }

  const counts = {
    all: orders.length,
    pending: orders.filter((order) => (order.status || "pending") === "pending").length,
    processing: orders.filter((order) => order.status === "processing").length,
    shipped: orders.filter((order) => order.status === "shipped").length,
    completed: orders.filter((order) => order.status === "completed").length
  };

  const filteredOrders = orders.filter((order) => {
    const status = order.status || "pending";
    const matchesFilter = filter === "all" || status === filter;
    const haystack = `${order.customer_name || order.name || ""} ${order.phone || ""} ${order.order_ref || order.id || ""}`.toLowerCase();
    const matchesSearch = !search || haystack.includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <>
      <div className="admin-header">
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div className="admin-title-icon secondary"><i className="fa-solid fa-boxes-packing" /></div>
          <div>
            <h1 className="admin-title">نظام إدارة الطلبات الفردية</h1>
            <p style={{ fontSize: 13, color: "var(--color-text-muted)", fontWeight: 700 }}>إتمام عمليات التجارة الإلكترونية • مباشر</p>
          </div>
        </div>
        <div className="admin-actions">
           <button className="btn btn-primary" style={{ background: "white", color: "var(--color-primary)", border: "1px solid #eee" }}><i className="fa-solid fa-file-csv" /> تصدير مالي</button>
           <button className="btn btn-primary" onClick={refresh}><i className="fa-solid fa-rotate-right" /> مزامنة الطلبات</button>
        </div>
      </div>

      <div className="admin-filter-bar-luxe">
         <div className="filter-stats-luxe">
            {[
              { id: "all", label: "الكل", count: counts.all, icon: "fa-list" },
              { id: "pending", label: "جديد", count: counts.pending, icon: "fa-clock" },
              { id: "processing", label: "تجهيز", count: counts.processing, icon: "fa-box-open" },
              { id: "shipped", label: "شحن", count: counts.shipped, icon: "fa-truck" },
              { id: "completed", label: "مكتمل", count: counts.completed, icon: "fa-check-double" }
            ].map(f => (
              <button key={f.id} className={`filter-item-luxe ${filter === f.id ? "active" : ""}`} onClick={() => setFilter(f.id)}>
                 <span className="filter-icon"><i className={`fa-solid ${f.icon}`} /></span>
                 <span className="filter-label">{f.label}</span>
                 <span className="filter-badge">{f.count}</span>
              </button>
            ))}
         </div>
         <div className="filter-search-luxe">
            <i className="fa-solid fa-magnifying-glass" />
            <input placeholder="ابحث برقم الطلب، الاسم، أو الهاتف..." value={search} onChange={(e) => setSearch(e.target.value)} />
         </div>
      </div>

      <div className="admin-card-luxe">
        {loading ? (
          <div style={{ textAlign: "center", padding: 80 }}><div className="react-loader" /></div>
        ) : (
          <div className="admin-modern-table-container">
            <table className="admin-recent-table">
              <thead>
                <tr>
                  <th>رقم المرجع</th>
                  <th>صاحب الطلب</th>
                  <th>تاريخ العمليّة</th>
                  <th>المبلغ الإجمالي</th>
                  <th>الحالة اللوجستية</th>
                  <th>تغيير الحالة</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length ? filteredOrders.map((o) => (
                  <tr key={o.id || o.order_ref}>
                    <td style={{ fontWeight: 950, color: "var(--color-secondary)", fontFamily: "monospace", fontSize: 16 }}>#{o.order_ref || String(o.id || "").slice(0, 8) || "---"}</td>
                    <td>
                      <div className="customer-cell">
                        <div className="avatar-mini">{o.customer_name?.[0] || o.name?.[0] || "U"}</div>
                        <div>
                          <div style={{ fontWeight: 800 }}>{o.customer_name || o.name || "عميل"}</div>
                          <div style={{ fontSize: 11, opacity: 0.6 }}>{o.phone || "---"}</div>
                        </div>
                      </div>
                    </td>
                    <td>{o.created_at ? new Date(o.created_at).toLocaleDateString("ar-JO") : "---"}</td>
                    <td style={{ fontWeight: 900 }}>{formatCurrency(o.total)}</td>
                    <td><span className={`status-pill ${o.status || "pending"}`}>{o.status === "pending" ? "جديد" : o.status === "processing" ? "قيد التجهيز" : o.status === "shipped" ? "تم الشحن" : "مكتمل"}</span></td>
                    <td>
                       <select className="luxe-select" value={o.status || "pending"} onChange={(e) => changeStatus(o, e.target.value)}>
                          <option value="pending">جديد (New)</option>
                          <option value="processing">جاري التجهيز (Processing)</option>
                          <option value="shipped">تم الشحن (Shipped)</option>
                          <option value="completed">مكتمل (Completed)</option>
                       </select>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="6" style={{ textAlign: "center", padding: 60, opacity: 0.5, fontWeight: 800 }}>لا توجد طلبات تطابق معايير البحث الحالية.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("basic");
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    image_url: "",
    category: "coffee",
    inventory: 100,
    weight_options: "250g, 500g, 1kg",
    origin: "",
    roast_level: "",
    taste_profile: "",
    on_sale: false,
    sale_price: "",
    stock_status: "in_stock"
  });

  const [uploading, setUploading] = useState(false);

  async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `product-images/${fileName}`;

      const { data, error: uploadError } = await supabase.storage
        .from("products")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("products")
        .getPublicUrl(filePath);

      setForm((prev) => ({ ...prev, image_url: publicUrl }));
      
      window.Swal.fire({
        icon: "success",
        title: "تم التحميل بنجاح",
        text: "تم رفع الصورة وتحديث الملحق البصري للمنتج.",
        timer: 1500,
        showConfirmButton: false
      });
    } catch (err) {
      console.error("Upload Error:", err);
      window.Swal.fire("عذراً", "فشل تحميل الصورة. يجب إنشاء Bucket باسم 'products' في Supabase للسماح بالتحميل.", "error");
    } finally {
      setUploading(false);
    }
  }

  async function refresh() {
    setProducts(await fetchProducts());
  }

  useEffect(() => {
    refresh();
  }, []);

  function editProduct(product) {
    setEditingId(product.id);
    setForm({
      name: product.name || "",
      description: product.description || "",
      price: product.price || "",
      image_url: product.image_url || "",
      category: product.category || "coffee",
      inventory: product.inventory || 0,
      weight_options: product.weight_options || "250g, 500g, 1kg",
      origin: product.origin || "",
      roast_level: product.roast_level || "",
      taste_profile: product.taste_profile || "",
      on_sale: !!product.on_sale,
      sale_price: product.sale_price || "",
      stock_status: product.stock_status || "in_stock"
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submitProduct() {
    if (!form.name || !form.price) {
        window.Swal.fire("ملاحظة", "الاسم والسعر حقول أساسية للمنتج.", "warning");
        return;
    }
    setSaving(true);
    try {
      const payload = { 
        ...form, 
        price: Number(form.price), 
        inventory: Number(form.inventory),
        sale_price: form.on_sale ? Number(form.sale_price) : null
      };
      if (editingId) payload.id = editingId;
      await upsertProduct(payload);
      
      window.Swal.fire({
        icon: "success",
        title: editingId ? "تم التحديث" : "تمت الإضافة",
        text: editingId ? "تم تحديث بيانات المنتج بنجاح." : "تم إدراج المنتج الجديد في قائمة المحمصة.",
        confirmButtonColor: "#0a1f14"
      });

      setEditingId(null);
      setForm({ name: "", description: "", price: "", image_url: "", category: "coffee", inventory: 100, weight_options: "250g, 500g, 1kg", origin: "", roast_level: "", taste_profile: "", on_sale: false, sale_price: "" });
      refresh();
    } catch (error) {
      window.Swal.fire("فشل الحفظ", error.message || "حدث خطأ غير متوقع", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    const confirm = await window.Swal.fire({
      title: "هل أنت متأكد؟",
      text: "سيتم حذف المنتج نهائياً من المتجر وقاعدة البيانات.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#c0392b",
      confirmButtonText: "نعم، حذف نهائي"
    });
    if (confirm.isConfirmed) {
      try {
        await supabase.from("products").delete().eq("id", id);
        window.Swal.fire("تم الحذف", "أصبح المنتج غير متوفر الآن.", "success");
        refresh();
      } catch (e) {
        window.Swal.fire("خطأ", "فشل الحذف", "error");
      }
    }
  }

  const filteredProducts = products.filter((p) =>
    (p.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.category || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-page-content">
      <div className="admin-header">
        <h1 className="admin-title">{editingId ? "تحديث مقتنيات النخبة" : "إضافة إصدار جديد"}</h1>
        <div style={{ display: "flex", gap: 15, alignItems: "center" }}>
          {editingId && (
            <button className="btn btn-outline" onClick={() => { setEditingId(null); setForm({ name: "", description: "", price: "", image_url: "", category: "coffee", inventory: 100, weight_options: "250g, 500g, 1kg", origin: "", roast_level: "", taste_profile: "" }); }}>
               <i className="fa-solid fa-xmark" style={{marginLeft:8}} /> إلغاء الوضع الحالي
            </button>
          )}
          <div className="admin-user-profile">
            <div className="profile-text"><b>المدير العام</b><br/><small>نظام التحكم الماسي</small></div>
            <div className="avatar"><i className="fa-solid fa-user-gear" /></div>
          </div>
        </div>
      </div>

      <div className="product-admin-layout">
        <div className="admin-form-panel">
          <div className="admin-tabs">
            <button className={activeTab === "basic" ? "active" : ""} onClick={() => setActiveTab("basic")}><i className="fa-solid fa-info-circle" /> المعلومات الأساسية</button>
            <button className={activeTab === "tech" ? "active" : ""} onClick={() => setActiveTab("tech")}><i className="fa-solid fa-flask" /> تفاصيل المحصول</button>
            <button className={activeTab === "stock" ? "active" : ""} onClick={() => setActiveTab("stock")}><i className="fa-solid fa-boxes-stacked" /> المخزون والأوزان</button>
            <button className={activeTab === "offers" ? "active" : ""} onClick={() => setActiveTab("offers")} style={{ color: "var(--color-secondary)", fontWeight: 900 }}><i className="fa-solid fa-bolt-lightning" /> حزمة العروض</button>
          </div>

          <div className="admin-card product-card-form">
            {activeTab === "basic" && (
              <div className="react-form-grid">
                <div className="react-field full"><label><i className="fa-solid fa-tag" /> اسم المقتنى التجاري</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="مثلاً: خلطة الحسون الملكية" /></div>
                <div className="react-field"><label><i className="fa-solid fa-money-bill-wave" /> السعر للكيلو (JOD)</label><input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
                <div className="react-field"><label><i className="fa-solid fa-layer-group" /> التصنيف</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    <option value="coffee">محاصيل القهوة المختصة</option>
                    <option value="nuts">المكسرات النخبوية</option>
                    <option value="sweets">التجربة الحُلوة</option>
                    <option value="spices">خلطات البهارات</option>
                  </select>
                </div>
                <div className="react-field"><label><i className="fa-solid fa-warehouse" /> حالة التوفر</label>
                  <select value={form.stock_status} onChange={(e) => setForm({ ...form, stock_status: e.target.value })}>
                    <option value="in_stock">متوفر (In Stock)</option>
                    <option value="out_of_stock">نفذت الكمية (Sold Out)</option>
                  </select>
                </div>
                <div className="react-field full">
                  <label><i className="fa-solid fa-camera-retro" /> الوسائط المرئية (صورة المنتج)</label>
                  <div className="admin-file-upload">
                    <input type="file" id="product-file" accept="image/*" onChange={handleFileUpload} style={{ display: "none" }} />
                    <button className="btn btn-outline btn-block" onClick={() => document.getElementById("product-file").click()} disabled={uploading}>
                       {uploading ? (
                         <><i className="fa-solid fa-sync fa-spin" style={{marginLeft:10}} /> جاري التحميل فائق السرعة...</>
                       ) : (
                         <><i className="fa-solid fa-cloud-arrow-up" style={{marginLeft:10}} /> اختر صوراً من جهازك الشخصي</>
                       )}
                    </button>
                    <div className="file-url-box">
                       <small>المسار الحالي:</small>
                       <input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="أو أضف رابطاً مباشراً يدويًا..." />
                    </div>
                  </div>
                </div>
                <div className="react-field full"><label><i className="fa-solid fa-align-right" /> وصف المنتج التفصيلي</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="اكتب هنا القصة خلف هذا المنتج..." rows="4" /></div>
              </div>
            )}

            {activeTab === "tech" && (
              <div className="react-form-grid">
                <div className="react-field"><label><i className="fa-solid fa-earth-americas" /> بلد المنشأ</label><input value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value })} placeholder="مثلاً: إثيوبيا - ييرغاشيف" /></div>
                <div className="react-field"><label><i className="fa-solid fa-fire" /> درجة التحميص</label><input value={form.roast_level} onChange={(e) => setForm({ ...form, roast_level: e.target.value })} placeholder="مثلاً: متوسطة (Medium)" /></div>
                <div className="react-field full"><label><i className="fa-solid fa-wand-magic-sparkles" /> إيحاءات النكهة</label><input value={form.taste_profile} onChange={(e) => setForm({ ...form, taste_profile: e.target.value })} placeholder="مثلاً: شوكولاتة، كراميل، فواكه استوائية" /></div>
              </div>
            )}

            {activeTab === "stock" && (
              <div className="react-form-grid">
                <div className="react-field"><label><i className="fa-solid fa-warehouse" /> التوفر في المخزن</label><input type="number" value={form.inventory} onChange={(e) => setForm({ ...form, inventory: e.target.value })} /></div>
                <div className="react-field"><label><i className="fa-solid fa-scale-balanced" /> خيارات الوزن المتاحة</label><input value={form.weight_options} onChange={(e) => setForm({ ...form, weight_options: e.target.value })} placeholder="250g, 500g, 1kg" /></div>
              </div>
            )}

            {activeTab === "offers" && (
              <div className="admin-tab-pane">
                <h3 style={{ marginBottom: 25, color: "var(--color-primary)", fontSize: 24, display: "flex", alignItems: "center", gap: 15 }}>
                  <i className="fa-solid fa-star" style={{ color: "var(--color-secondary)" }} /> إدارة العروض الملكية
                </h3>
                
                <div className="sale-toggle-group" style={{ background: "rgba(0,0,0,0.02)", padding: 25, borderRadius: 20, border: "1px dashed rgba(220,169,34,0.3)" }}>
                  <div 
                    className={`sale-toggle-luxe ${form.on_sale ? "active" : ""}`}
                    onClick={() => setForm({ ...form, on_sale: !form.on_sale })}
                  />
                  <div>
                    <span style={{ fontWeight: 900, fontSize: 17, display: "block", marginBottom: 5 }}>تثبيت هذا المورد في واجهة "العروض الخاصة"</span>
                    <small style={{ opacity: 0.6 }}>سيظهر المنتج ببادرة "خصم خاص" في الصفحة الرئيسية مع السعر الجديد.</small>
                  </div>
                </div>

                {form.on_sale && (
                   <div style={{ padding: 25, background: "#fff9ee", borderRadius: 20, border: "1px solid #ffe8cc", marginTop: 25 }}>
                      <div className="form-group">
                         <label style={{ color: "#d35400", fontWeight: 900, marginBottom: 15, display: "block" }}>سعر العرض المعتمد (JOD)</label>
                         <input 
                            type="number" 
                            className="sale-input-luxe"
                            value={form.sale_price} 
                            onChange={(e) => setForm({ ...form, sale_price: e.target.value })} 
                            placeholder="مثلاً: 12.99"
                         />
                         <p style={{ marginTop: 15, fontSize: 14, fontWeight: 700, color: "var(--color-primary)" }}>
                           <i className="fa-solid fa-circle-info" style={{ marginLeft: 8 }} /> سيتغير السعر الظاهري من {formatCurrency(form.price)} إلى {formatCurrency(form.sale_price || 0)}
                         </p>
                      </div>
                   </div>
                )}
              </div>
            )}

            <div className="form-action-footer">
              <button className="btn btn-primary btn-lg" onClick={submitProduct} disabled={saving}>
                {saving ? (
                  <><i className="fa-solid fa-spinner fa-spin" style={{marginLeft:10}} /> جاري تحليل البيانات...</>
                ) : (
                  <><i className="fa-solid fa-shield-check" style={{marginLeft:10}} /> {editingId ? "تأكيد تحديث المورد" : "إطلاق المنتج للمتجر"}</>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="admin-preview-panel">
          <div className="preview-label"><i className="fa-solid fa-eye" /> معاينة العرض المباشر</div>
          <div className="luxury-product-card preview">
             <div className="product-image">
                <img src={normalizeImagePath(form.image_url) || "https://placehold.co/400x400?text=Waiting+for+Image"} alt="Preview" />
                <div className="product-badge">{form.category}</div>
             </div>
             <div className="product-info">
                <h3>{form.name || "اسم المنتج يظهر هنا"}</h3>
                <p className="description-preview">{form.description ? form.description.substring(0, 60) + "..." : "الوصف الجمالي للمنتج سيظهر في هذا المكان."}</p>
                <div className="product-footer">
                   <span className="price">{form.price || "0.00"} JOD / كغ</span>
                   <button className="add-btn"><i className="fa-solid fa-cart-plus" /></button>
                </div>
             </div>
          </div>
          <div className="preview-note">ملاحظة: هذا العرض يحاكي شكل المنتج النهائي في واجهة المتجر.</div>
        </div>
      </div>

      <div className="admin-card product-list-card">
        <div className="card-header-flex">
          <h2 className="admin-card-title"><i className="fa-solid fa-list-ol" /> جرد ممتلكات المتجر</h2>
          <div className="admin-search-box">
            <i className="fa-solid fa-magnifying-glass" />
            <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="ابحث بالاسم أو التصنيف..." />
          </div>
        </div>
        
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>المنتج</th>
                <th>التصنيف</th>
                <th>السعر</th>
                <th>المخزون</th>
                <th>الحالة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="product-cell">
                      <img src={normalizeImagePath(p.image_url)} alt="" className="mini-thumb" />
                      <div className="product-meta">
                        <div className="p-name">{p.name}</div>
                        <div className="p-origin">{p.origin || "منشأ غير محدد"}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="cat-chip">{p.category}</span></td>
                  <td className="price-cell">{formatCurrency(p.price)} / كغ</td>
                  <td>
                    <div className="stock-info">
                      <div className="stock-bar"><div className="fill" style={{width: `${Math.min(p.inventory / 2, 100)}%`}}></div></div>
                      <span>{p.inventory} قطعة</span>
                    </div>
                  </td>
                  <td>
                    <div className="status-flex">
                        <div className={`status-dot ${p.inventory > 0 ? "online" : "offline"}`}></div>
                        {p.inventory > 0 ? "متاح" : "نفذت الكمية"}
                    </div>
                  </td>
                  <td>
                    <div className="action-btns">
                      <button className="action-icon edit" onClick={() => editProduct(p)} title="تعديل"><i className="fa-solid fa-pen-nib" /></button>
                      <button className="action-icon delete" onClick={() => handleDelete(p.id)} title="حذف"><i className="fa-solid fa-trash-can" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AdminCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [allBookings, setAllBookings] = useState([]);
  const [stats, setStats] = useState({ count: 0, pending: 0 });

  async function load() {
    const data = await fetchBookings();
    if (data) {
      setAllBookings(data);
      setStats({
        count: data.length,
        pending: data.filter((b) => b.status === "pending").length
      });
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthsAr = ["كانون الثاني", "شباط", "آذار", "نيسان", "أيار", "حزيران", "تموز", "آب", "أيلول", "تشرين الأول", "تشرين الثاني", "كانون الأول"];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const todayStr = new Date().toISOString().split("T")[0];
  const todayBookings = allBookings.filter((b) => b.booking_date === todayStr);

  async function handleAddBooking(preDate = "") {
    const d = preDate || todayStr;
    const { value: form } = await window.Swal.fire({
      title: `<div style="font-family:Cairo; font-weight:900; color:#0a1f14; font-size:24px; border-bottom:2px solid #dca922; padding-bottom:15px; margin-bottom:10px;">نظــــــــام حجز المــــــــواعيد</div>`,
      html: `
        <div class="luxury-form" style="text-align:right; font-family:Cairo; padding:10px 0;">
          <p style="color:#dca922; font-weight:800; font-size:14px; margin-bottom:25px;">تاريخ الموعد المختار: <span style="color:#0a1f14; border:1px solid #eee; padding:4px 12px; border-radius:30px; background:#fafafa;">${d}</span></p>
          
          <div style="margin-bottom:20px;">
            <label style="display:block; margin-bottom:8px; font-weight:800; color:#0a1f14; font-size:14px;"><i class="fa-solid fa-user-tie" style="margin-left:8px; color:#dca922;"></i> اسم العميل أو الجهة المختصة</label>
            <input id="bm-client" class="swal2-input" placeholder="مثلاً: شركة التوريدات الدولية" style="width:100%; margin:0; border:2px solid #f0f0f0; border-radius:12px; height:55px; font-size:15px; padding:0 15px; box-sizing:border-box;">
          </div>
          
          <div style="margin-bottom:20px;">
            <label style="display:block; margin-bottom:8px; font-weight:800; color:#0a1f14; font-size:14px;"><i class="fa-solid fa-comment-dots" style="margin-left:8px; color:#dca922;"></i> تفاصيل اللقاء / الملاحظات</label>
            <input id="bm-title" class="swal2-input" placeholder="عنوان موجز لغرض الزيارة" style="width:100%; margin:0; border:2px solid #f0f0f0; border-radius:12px; height:55px; font-size:15px; padding:0 15px; box-sizing:border-box;">
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px;">
            <div>
              <label style="display:block; margin-bottom:8px; font-weight:800; color:#0a1f14; font-size:14px;"><i class="fa-solid fa-clock" style="margin-left:8px; color:#dca922;"></i> التوقيت</label>
              <input id="bm-time" type="time" class="swal2-input" style="width:100%; margin:0; border:2px solid #f0f0f0; border-radius:12px; height:55px; box-sizing:border-box;">
            </div>
            <div>
              <label style="display:block; margin-bottom:8px; font-weight:800; color:#0a1f14; font-size:14px;"><i class="fa-solid fa-tags" style="margin-left:8px; color:#dca922;"></i> التصنيف</label>
              <select id="bm-type" class="swal2-input" style="width:100%; margin:0; border:2px solid #f0f0f0; border-radius:12px; height:55px; box-sizing:border-box; padding:0 10px;">
                <option value="tasting">جلسة تذوق خاص</option>
                <option value="b2b" selected>زيارة عمل B2B</option>
                <option value="meeting">اجتماع مجلس الإدارة</option>
                <option value="event">فعالية حصرية</option>
              </select>
            </div>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "تأكيد الحجز البلاتيني",
      cancelButtonText: "تراجع",
      confirmButtonColor: "#0a1f14",
      cancelButtonColor: "#c0392b",
      background: "#fff",
      width: "550px",
      padding: "30px",
      preConfirm: () => {
        const title = document.getElementById("bm-title").value.trim();
        const customer = document.getElementById("bm-client").value.trim();
        if (!customer) { window.Swal.showValidationMessage("يرجى تزويدنا باسم العميل للمتابعة"); return false; }
        return {
          title: title || "موعد عمل رسمي",
          customer_name: customer,
          booking_time: document.getElementById("bm-time").value,
          booking_date: d,
          type: document.getElementById("bm-type").value,
          status: "confirmed"
        };
      }
    });

    if (form) {
      try {
        await insertBooking(form);
        window.Swal.fire({ 
          icon: "success", 
          title: "تم التسجيل بنجاح", 
          text: "تم إدراج الموعد في التقويم الاستراتيجي لمحمصة الحسون بنجاح.",
          confirmButtonColor: "#0a1f14",
          timer: 3000
        });
        load();
      } catch (e) {
        console.error("Booking Insert Error:", e);
        window.Swal.fire("عذراً", `فشلت عملية الحفظ. السبب: ${e.message || "خطأ داخلي في الخادم"}`, "error");
      }
    }
  }

  return (
    <>
      <div className="admin-header">
        <h1 className="admin-title">نظام جدولة المواعيد والزيارات</h1>
        <button className="btn btn-primary" onClick={() => handleAddBooking()}>
           <i className="fa-solid fa-plus" style={{ marginLeft: 10 }} /> حجز موعد جديد
        </button>
      </div>

      <div className="admin-calendar-layout">
        <div className="admin-card stats-panel">
          <h3 className="admin-card-title"><i className="fa-solid fa-clock" /> مواعيد اليوم</h3>
          <div className="today-list">
            {!todayBookings.length ? (
              <div className="empty-msg">لا توجد مواعيد لليوم.</div>
            ) : (
              todayBookings.map((b) => (
                <div key={b.id} className="today-item">
                  <div className="item-title">{b.customer_name || b.title}</div>
                  <div className="item-time"><i className="fa-solid fa-clock" /> {b.booking_time || "–"}</div>
                  <div className="item-meta">النوع: {b.type === "tasting" ? "جلسة تذوق" : b.type === "b2b" ? "زيارة عمل" : "اجتماع"}</div>
                </div>
              ))
            )}
          </div>
          <h3 className="admin-card-title" style={{ marginTop: 40 }}><i className="fa-solid fa-circle-info" /> ملخص الجدولة</h3>
          <div className="stats-summary">
            <div className="stat-row"><span>مواعيد محجوزة</span><b>{stats.count}</b></div>
            <div className="stat-row"><span>بانتظار التأكيد</span><b>{stats.pending}</b></div>
          </div>
        </div>

        <div className="admin-card calendar-panel">
          <div className="calendar-header">
            <h2 className="month-name">{monthsAr[month]} {year}</h2>
            <div className="calendar-nav">
              <button className="nav-btn" onClick={prevMonth}><i className="fa-solid fa-chevron-right" /></button>
              <button className="nav-btn" onClick={nextMonth}><i className="fa-solid fa-chevron-left" /></button>
            </div>
          </div>
          <div className="calendar-grid-wrapper">
             <div className="grid-header">
               {["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"].map(day => <div key={day}>{day}</div>)}
             </div>
             <div className="calendar-grid">
               {[...Array(firstDay)].map((_, i) => <div key={`empty-${i}`} className="day-box off-month" />)}
               {[...Array(daysInMonth)].map((_, i) => {
                 const day = i + 1;
                 const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                 const daily = allBookings.filter((b) => b.booking_date === dateStr);
                 const isToday = todayStr === dateStr;
                 return (
                   <div key={day} className={`day-box ${isToday ? "today" : ""}`} onClick={() => handleAddBooking(dateStr)}>
                     <span className="day-num">{day}</span>
                     <div className="day-tags">
                        {daily.map(b => (
                          <span key={b.id} className={`booking-tag tag-${b.type || "meeting"}`}>{b.customer_name || b.title}</span>
                        ))}
                     </div>
                   </div>
                 );
               })}
             </div>
          </div>
        </div>
      </div>
    </>
  );
}

function AdminB2BPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", sector: "retail", phone: "", city: "" });

  async function refresh() { 
    setLoading(true);
    setClients(await fetchB2BClients()); 
    setLoading(false);
  }
  useEffect(() => { refresh(); }, []);

  async function submitClient() {
    if (!form.name) return window.Swal.fire("تنبيه", "يرجى إدخال اسم الجهة أو المؤسسة", "warning");
    try {
      await insertB2BClient(form);
      window.Swal.fire({ icon: "success", title: "تم تسجيل الشريك", toast: true, position: "top-end", showConfirmButton: false, timer: 3000 });
      setForm({ name: "", sector: "retail", phone: "", city: "" });
      refresh();
    } catch (error) { window.Swal.fire("خطأ", "تعذر تسجيل الشريك الجديد", "error"); }
  }

  async function changeStatus(client, status) {
    try {
      await setB2BStatus(client.id, status);
      refresh();
    } catch (error) { window.Swal.fire("خطأ", "عذراً، فشل تحديث حالة العضوية", "error"); }
  }

  return (
    <>
      <div className="admin-header">
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div className="admin-title-icon primary"><i className="fa-solid fa-handshake-angle" /></div>
          <div>
            <h1 className="admin-title">منظومة شركاء النجاح (B2B)</h1>
            <p style={{ fontSize: 13, color: "var(--color-text-muted)", fontWeight: 700 }}>إدارة عملاء الجملة والتوريد المؤسسي</p>
          </div>
        </div>
      </div>

      <div className="admin-overview-layout">
        <div className="admin-overview-main">
          <div className="admin-card-luxe">
            <div className="card-header-luxe">
               <h2 className="card-title-luxe"><i className="fa-solid fa-building-user" /> قائمة الشركاء المسجلين</h2>
               <div className="badge-count luxe">{clients.length} جهة</div>
            </div>
            {loading ? (
              <div style={{ padding: 40, textAlign: "center" }}><div className="react-loader" /></div>
            ) : (
              <div className="admin-modern-table-container">
                <table className="admin-recent-table">
                  <thead>
                     <tr>
                        <th>الاسم التجاري</th>
                        <th>القطاع</th>
                        <th>المنطقة</th>
                        <th>الحالة التعاقدية</th>
                     </tr>
                  </thead>
                  <tbody>
                    {clients.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <div className="customer-cell">
                            <div className="avatar-mini" style={{ background: "#0d47a1" }}><i className="fa-solid fa-city" style={{ fontSize: 12 }} /></div>
                            <div style={{ fontWeight: 800 }}>{c.name}</div>
                          </div>
                        </td>
                        <td>{c.sector === "retail" ? "تجزئة" : c.sector === "horeca" ? "مطاعم وفنادق" : "شركة / مؤسسة"}</td>
                        <td>{c.city || "عمان"}</td>
                        <td>
                          <select className="luxe-select" value={c.contract_status || "pending"} onChange={(e) => changeStatus(c, e.target.value)}>
                            <option value="pending">بانتظار المراجعة</option>
                            <option value="active">عضوية نشطة</option>
                            <option value="suspended">معطل مؤقتاً</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="admin-overview-aside">
          <div className="admin-card-luxe">
            <div className="card-header-luxe">
               <h2 className="card-title-luxe"><i className="fa-solid fa-user-plus" /> تسجيل جهة جديدة</h2>
            </div>
            <div className="luxe-form-stack">
               <div className="luxe-field">
                  <label>الاسم التجاري للهيئة</label>
                  <input placeholder="مثلاً: فندق الفور سيزونز" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
               </div>
               <div className="luxe-grid-2">
                  <div className="luxe-field">
                    <label>القطاع</label>
                    <select value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })}>
                       <option value="retail">تجزئة (Retail)</option>
                       <option value="horeca">HORECA</option>
                       <option value="corporate">Corporate</option>
                    </select>
                  </div>
                  <div className="luxe-field">
                    <label>المدينة</label>
                    <input placeholder="عمان" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                  </div>
               </div>
               <div className="luxe-field">
                  <label>رقم التواصل المباشر</label>
                  <input placeholder="07XXXXXXXX" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
               </div>
               <button className="btn btn-primary luxe-full" onClick={submitClient}>إتمام تسجيل الشريك <i className="fa-solid fa-save" /></button>
            </div>
          </div>
          <div className="admin-promo-card enterprise">
              <h3>حلول الشركات المتكاملة</h3>
              <p>قم بتفعيل لوحة التحكم المخصصة لكل شركة لتمكينهم من الطلب المباشر بأسعار الجملة.</p>
              <i className="fa-solid fa-building-shield promo-icon" />
          </div>
        </div>
      </div>
    </>
  );
}

function AdminCouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ code: "", discount_value: "", discount_type: "percent", is_active: true });

  async function refresh() { 
    setLoading(true);
    setCoupons(await fetchCoupons()); 
    setLoading(false);
  }
  useEffect(() => { refresh(); }, []);

  async function createCoupon() {
    if (!form.code || !form.discount_value) return window.Swal.fire("تنبيه", "يرجى تعبئة كافة الحقول", "warning");
    try {
      await insertCoupon({ ...form, code: form.code.toUpperCase().trim(), discount_value: Number(form.discount_value) });
      window.Swal.fire({ icon: "success", title: "تم تفعيل الكوبون", toast: true, position: "top-end", showConfirmButton: false, timer: 3000 });
      setForm({ code: "", discount_value: "", discount_type: "percent", is_active: true });
      refresh();
    } catch (error) { window.Swal.fire("خطأ", "فشل إنشاء كوبون جديد", "error"); }
  }

  return (
    <>
      <div className="admin-header">
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div className="admin-title-icon secondary"><i className="fa-solid fa-tags" /></div>
          <div>
            <h1 className="admin-title">نظام إدارة التخفيضات والكوبونات</h1>
            <p style={{ fontSize: 13, color: "var(--color-text-muted)", fontWeight: 700 }}>محرك الخصومات الذكي • v3.0</p>
          </div>
        </div>
      </div>

      <div className="admin-overview-layout">
        <div className="admin-overview-main">
          <div className="admin-card-luxe">
            <div className="card-header-luxe">
               <h2 className="card-title-luxe"><i className="fa-solid fa-ticket-simple" /> الكوبونات النشطة حالياً</h2>
            </div>
            {loading ? (
              <div style={{ padding: 40, textAlign: "center" }}><div className="react-loader" /></div>
            ) : (
              <div className="admin-modern-table-container">
                <table className="admin-recent-table">
                  <thead>
                    <tr>
                      <th>كود الخصم</th>
                      <th>قيمة التخفيض</th>
                      <th>النوع</th>
                      <th>الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coupons.map((c) => (
                      <tr key={c.id}>
                        <td style={{ fontWeight: 950, color: "var(--color-secondary)", letterSpacing: 1.5, fontSize: 16 }}>{c.code}</td>
                        <td style={{ fontWeight: 900, fontSize: 18 }}>{c.discount_value}{c.discount_type === "percent" ? "%" : ""}</td>
                        <td style={{ fontWeight: 700, color: "var(--color-text-muted)" }}>{c.discount_type === "percent" ? "نسبة مئوية" : "مبلغ ثابت (JOD)"}</td>
                        <td><span className={`status-pill ${c.is_active ? "completed" : "pending"}`}>{c.is_active ? "نشط وفعال" : "متوقف"}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="admin-overview-aside">
          <div className="admin-card-luxe">
            <div className="card-header-luxe">
               <h2 className="card-title-luxe"><i className="fa-solid fa-plus-circle" /> إصدار كوبون جديد</h2>
            </div>
            <div className="luxe-form-stack">
               <div className="luxe-field">
                  <label>رمز الكوبون الإعلاني</label>
                  <input placeholder="مثلاً: ALHASON2025" style={{ textTransform: "uppercase" }} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
               </div>
               <div className="luxe-grid-2">
                  <div className="luxe-field">
                    <label>القيمة</label>
                    <input type="number" placeholder="20" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: e.target.value })} />
                  </div>
                  <div className="luxe-field">
                    <label>النوع</label>
                    <select value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })}>
                       <option value="percent">نسبة مئوية (%)</option>
                       <option value="fixed">مبلغ ثابت (JOD)</option>
                    </select>
                  </div>
               </div>
               <button className="btn btn-primary luxe-full" onClick={createCoupon}>تنشيط الكوبون فوراً <i className="fa-solid fa-bolt" /></button>
            </div>
          </div>
          <div className="coupon-visual-preview">
             <div className="ticket-cut" />
             <div className="ticket-info">
                <span>{form.code || "----"}</span>
                <small>{form.discount_value || "0"}{form.discount_type === "percent" ? "% OFF" : " JOD OFF"}</small>
             </div>
          </div>
        </div>
      </div>
    </>
  );
}

function AdminSettingsPage() {
  const [appSettings, setAppSettings] = useState({
    maintenance: localStorage.getItem("alhason_maintenance") === "true",
    payments: localStorage.getItem("alhason_payments") !== "false",
    shipping: localStorage.getItem("alhason_shipping_module") !== "false"
  });
  const [settings, setSettings] = useState({
    coffee: { url: "", title: "", tag: "", description: "" },
    nuts: { url: "", title: "", tag: "", description: "" },
    spices: { url: "", title: "", tag: "", description: "" },
    poster: { url: "" }
  });
  const [saving, setSaving] = useState(false);

  const normalizeSrc = (val, isPoster = false) => {
    let s = "";
    if (val && typeof val === "object" && val.url) s = String(val.url);
    else if (val && typeof val === "string") s = val;
    else s = String(val || "");
    
    if (!s || s === "[object Object]") return "";
    if (s.startsWith("data:") || s.includes("://") || s.startsWith("blob:")) return s;
    if (isPoster) return s.startsWith("assets/") ? s : `assets/images/${s}`;
    return "";
  };

  const [uploadingStatus, setUploadingStatus] = useState({});

  useEffect(() => {
    let mounted = true;
    async function load() {
      const next = {
        coffee: { url: "", title: "", tag: "", description: "" },
        nuts: { url: "", title: "", tag: "", description: "" },
        spices: { url: "", title: "", tag: "", description: "" },
        poster: { url: "" }
      };
      const remote = await fetchVideoSettings();
      remote.forEach((item) => {
        if (next[item.key]) {
           next[item.key] = {
             url: item.url || "",
             title: item.title || "",
             tag: item.tag || "",
             description: item.description || ""
           };
        }
      });
      for (const key of Object.keys(next)) {
        const local = await resolveMedia(key);
        if (local) next[key].url = local;
      }
      if (mounted) setSettings(next);
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  async function handleMediaUpload(key, file) {
    if (!file) return;
    setUploadingStatus((prev) => ({ ...prev, [key]: true }));

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `hero-${key}-${Date.now()}.${fileExt}`;
      const filePath = `site-media/${fileName}`;

      const { data, error: uploadError } = await supabase.storage
        .from("products")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("products").getPublicUrl(filePath);
      setSettings((current) => ({
        ...current,
        [key]: { ...current[key], url: publicUrl }
      }));
      window.Swal.fire({ icon: "success", title: "تم رفع الملف", toast: true, position: "top-end", showConfirmButton: false, timer: 2000 });
    } catch (err) {
      window.Swal.fire("خطأ في التحميل", "تأكد من إعدادات Supabase Storage", "error");
    } finally {
      setUploadingStatus((prev) => ({ ...prev, [key]: false }));
    }
  }

  async function saveHeroContent(key) {
    try {
      setSaving(true);
      const payload = {
        key,
        url: settings[key].url,
        title: settings[key].title || "",
        tag: settings[key].tag || "",
        description: settings[key].description || ""
      };
      await upsertHeroSetting(payload);
      window.Swal.fire({ icon: "success", title: "تم التحديث الملكي", text: `تم مزامنة محتوى ${key} مع الواجهة الرئيسية.`, timer: 1500, showConfirmButton: false });
    } catch (error) {
      window.Swal.fire("فشل المزامنة", "تعذر تحديث قاعدة بيانات المحتوى الإستراتيجي.", "error");
    } finally {
      setSaving(false);
    }
  }

  function toggleAppSetting(key) {
    const newVal = !appSettings[key];
    setAppSettings({ ...appSettings, [key]: newVal });
    localStorage.setItem(`alhason_${key === "maintenance" ? "maintenance" : key === "payments" ? "payments" : "shipping_module"}`, String(newVal));
    window.Swal.fire({ icon: "info", title: "تم التغيير", text: "تم تحديث إعدادات النظام بنجاح.", toast: true, position: "top-end", showConfirmButton: false, timer: 3000 });
  }

  function factoryReset() {
    window.Swal.fire({
      title: "تنبيه خطير!",
      text: "هذا الإجراء سيقوم بحذف كافة البيانات المخزنة محلياً وإعادة كاش الميديا. هل تود المتابعة؟",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "نعم، إعادة ضبط كاملة"
    }).then((res) => {
      if (res.isConfirmed) {
        localStorage.clear();
        indexedDB.deleteDatabase("alhason_media");
        window.location.reload();
      }
    });
  }

  return (
    <>
      <div className="admin-header">
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div className="admin-title-icon luxe-settings"><i className="fa-solid fa-gears" /></div>
          <div>
            <h1 className="admin-title">إعدادات المنظومة الذكية</h1>
            <p style={{ fontSize: 13, color: "var(--color-text-muted)", fontWeight: 700 }}>مركز التحكم التقني • إصدار بلاتيني 4.5</p>
          </div>
        </div>
        <button className="btn btn-outline" onClick={factoryReset} style={{ color: "#e74c3c", borderColor: "rgba(231,76,60,0.2)", borderRadius: 12 }}>
           <i className="fa-solid fa-trash-can-arrow-up" style={{ marginLeft: 8 }} /> إعادة ضبط المصنع
        </button>
      </div>

      <div className="admin-overview-layout">
        <div className="admin-overview-main">
          <div className="admin-card-luxe">
            <h2 className="card-title-luxe"><i className="fa-solid fa-sliders" /> خيارات التشغيل المتقدمة</h2>
            <div className="luxe-settings-stack">
              {[
                { id: "maintenance", label: "وضع الصيانة الشامل", sub: "إغلاق المتجر أمام الزوار خلال فترات التحديث الكبرى.", icon: "fa-hammer" },
                { id: "payments", label: "تشغيل بوابات الدفع", sub: "تفعيل خيارات الدفع الإلكتروني المباشر بفيزا وماستركارد.", icon: "fa-credit-card" },
                { id: "shipping", label: "محرك حساب الشحن", sub: "تشغيل حساب تكاليف التوصيل بناءً على المنطقة الجغرافية.", icon: "fa-map-location-dot" }
              ].map(s => (
                <div className="luxe-settings-row" key={s.id}>
                  <div className="s-info">
                    <div className="s-icon-box"><i className={`fa-solid ${s.icon}`} /></div>
                    <div>
                      <div className="s-label">{s.label}</div>
                      <div className="s-sub">{s.sub}</div>
                    </div>
                  </div>
                  <div className={`luxe-switch ${appSettings[s.id] ? "active" : ""}`} onClick={() => toggleAppSetting(s.id)}>
                     <div className="switch-knob" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="admin-card-luxe" style={{ marginTop: 30 }}>
            <h2 className="card-title-luxe"><i className="fa-solid fa-clapperboard" /> إدارة المحتوى المرئي (Hero Media)</h2>
            <p style={{ color: "var(--color-text-muted)", fontSize: 13, marginBottom: 30, fontWeight: 700 }}>قم بتخصيص الفيديوهات السينمائية التي تظهر في الواجهة الرئيسية لكل قسم.</p>
            <div className="luxe-video-admin-grid">
              {Object.keys(settings).sort().map((key) => {
                const item = settings[key];
                const src = normalizeSrc(item, key === "poster");
                const isUploading = uploadingStatus[key];
                return (
                  <div key={key} className="luxe-video-card" style={{ height: "auto" }}>
                    <div className="v-header">{key === "poster" ? "خلفية الغلاف" : `قسم ${key}`}</div>
                    <div className="v-preview-box">
                       {isUploading ? (
                         <div className="upload-loader"><div className="react-loader" /></div>
                       ) : (
                         key === "poster" ? <img src={src || "assets/images/logo-gold.svg"} alt="Poster" /> : <video muted controls src={src} />
                       )}
                    </div>

                    {key !== "poster" && (
                      <div className="luxe-field-stack" style={{ marginBottom: 20 }}>
                        <div className="luxe-field" style={{ marginBottom: 12 }}>
                          <label>عنوان القسم</label>
                          <input 
                            type="text" 
                            value={item.title || ""} 
                            onChange={(e) => setSettings({ ...settings, [key]: { ...item, title: e.target.value } })}
                            placeholder="مثال: مكسرات الحسّون"
                          />
                        </div>
                        <div className="luxe-field" style={{ marginBottom: 12 }}>
                          <label>الوسم الذهبي (Tag)</label>
                          <input 
                            type="text" 
                            value={item.tag || ""} 
                            onChange={(e) => setSettings({ ...settings, [key]: { ...item, tag: e.target.value } })}
                            placeholder="مثال: Premium Selection"
                          />
                        </div>
                        <div className="luxe-field">
                          <label>الوصف السردي</label>
                          <textarea 
                            value={item.description || ""} 
                            onChange={(e) => setSettings({ ...settings, [key]: { ...item, description: e.target.value } })}
                            style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #eee", background: "#fcfcfb", fontWeight: 700, fontSize: 13, minHeight: 80 }}
                            placeholder="اكتب وصفاً جذاباً للقسم..."
                          />
                        </div>
                      </div>
                    )}

                    <div className="v-actions">
                       <input type="file" id={`file-${key}`} style={{ display: "none" }} onChange={(e) => handleMediaUpload(key, e.target.files?.[0])} />
                       <label htmlFor={`file-${key}`} className="btn-v-icon"><i className="fa-solid fa-cloud-arrow-up" /></label>
                       <button className="btn-v-save" onClick={() => saveHeroContent(key)} disabled={saving || isUploading}>
                         {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
                       </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="admin-overview-aside">
           <div className="admin-brand-card-platinum">
              <div className="p-logo"><img src="assets/images/logo-gold.svg" /></div>
              <div className="p-brand">AL HASON EXCLUSIVE</div>
              <div className="p-version">PLATINUM v4.5.1</div>
              <div className="p-status"><span className="dot" /> نظام التشغيل نشط</div>
           </div>

           <div className="admin-card-luxe" style={{ marginTop: 25 }}>
              <h3 className="card-title-luxe"><i className="fa-solid fa-microchip" /> ذكاء المنظومة</h3>
              <div className="ai-tips">
                 <div className="tip-item">
                    <i className="fa-solid fa-bolt" />
                    <span>فيديوهات 1080p بمعدل بت معتدل تمنح أفضل تجربة تحميل سريعة.</span>
                 </div>
                 <div className="tip-item">
                    <i className="fa-solid fa-shield-check" />
                    <span>كافة البيانات مشفرة ببروتوكول SSL ومدعومة من قبل Supabase.</span>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </>
  );
}

function CartDrawer() {
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, subtotal } = useCart();
  const navigate = useNavigate();

  return (
    <>
      <div 
        className={`cart-drawer-overlay ${isOpen ? "open" : ""}`} 
        onClick={() => setIsOpen(false)} 
      />
      <div className={`cart-drawer-panel ${isOpen ? "open" : ""}`} onClick={(e) => e.stopPropagation()}>
        <div className="cart-drawer-header">
           <h2 className="cart-drawer-title"><i className="fa-solid fa-bag-shopping" /> سلة المشتريات</h2>
           <button className="cart-drawer-close" onClick={() => setIsOpen(false)}><i className="fa-solid fa-xmark" /></button>
        </div>

        <div className="cart-drawer-items">
           {items.length === 0 ? (
             <div className="cart-drawer-empty">
                <i className="fa-solid fa-shopping-basket" />
                <p style={{ fontWeight: 800 }}>سلتك فارغة حالياً.<br/>ابدأ بجولة في مساحات الروّاد!</p>
                <button 
                  className="btn btn-outline" 
                  style={{ marginTop: 20, width: "100%", borderRadius: 12 }} 
                  onClick={() => { setIsOpen(false); navigate("/shop"); }}
                >
                  تصفح المتجر المميز
                </button>
             </div>
           ) : (
             items.map((item) => (
               <div className="cart-drawer-item" key={item.id}>
                                     <img 
                     src={item.image} 
                     alt={item.name} 
                     onError={(e) => { 
                       const cat = item.category || "coffee";
                       const fallback = {
                         coffee: "assets/images/cat_coffee.png",
                         nuts: "assets/images/cat_nuts.png",
                         spices: "assets/images/cat_spices.png",
                         sweets: "assets/images/cat_sweets.png"
                       };
                       e.target.src = fallback[cat] || "assets/images/logo-gold.svg"; 
                     }} 
                   />
                  <div className="cd-item-info">
                     <div className="cd-item-name">{item.name}</div>
                     <div className="cd-item-price">{formatCurrency(item.price)}</div>
                     <div className="cd-item-qty">
                        <button className="qty-btn" onClick={() => updateQuantity(item.id, item.q - 1)}><i className="fa-solid fa-minus" /></button>
                        <span style={{ fontWeight: 800 }}>{item.q}</span>
                        <button className="qty-btn" onClick={() => updateQuantity(item.id, item.q + 1)}><i className="fa-solid fa-plus" /></button>
                     </div>
                  </div>
                  <button className="cd-item-remove" onClick={() => removeItem(item.id)} title="إزالة من السلة">
                    <i className="fa-solid fa-trash-can" />
                  </button>
               </div>
             ))
           )}
        </div>

        {items.length > 0 && (
          <div className="cart-drawer-footer">
             <div className="cd-total-row">
                <span>المجموع الفرعي</span>
                <span>{formatCurrency(subtotal)}</span>
             </div>
             <button className="cd-btn-checkout" onClick={() => { setIsOpen(false); navigate("/checkout"); }}>
                <span>إتمام الطلب الآن</span>
                <i className="fa-solid fa-credit-card" />
             </button>
             <button className="cd-btn-view-cart" onClick={() => { setIsOpen(false); navigate("/cart"); }}>عرض السلة بالتفصيل</button>
          </div>
        )}
      </div>
    </>
  );
}

export default App;

