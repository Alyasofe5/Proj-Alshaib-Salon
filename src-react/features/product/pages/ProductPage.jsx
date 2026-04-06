import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import Header from "../../../shared/components/Header";
import { useCart } from "../../../context/CartContext";
import { fetchProductById } from "../../../lib/api/products";
import { normalizeImagePath, detectLegacyCategory } from "../../../utils/imageUtils";
import { productWeightOptions } from "../../../utils/productUtils";
import "../product.css";

function StatusBox({ text }) {
  return <div className="react-status-box">{text}</div>;
}

export default function ProductPage() {
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
    const isKilo = !selectedWeight || String(selectedWeight).toLowerCase() === "1kg";
    const base = (product?.on_sale && product?.sale_price && isKilo)
                 ? Number(product.sale_price)
                 : Number(product?.price || 0);

    if (!selectedWeight) return base;
    const w = String(selectedWeight).toLowerCase();

    if (w === "1kg") return base;
    if (w === "500g") return base * 0.55;
    if (w === "250g") return base * 0.30;
    if (w === "2kg") return base * 1.90;

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
