import React from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../../context/CartContext";
import { normalizeImagePath, detectLegacyCategory } from "../../../utils/imageUtils";

export default function ProductCard({ product }) {
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
