import React from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../../context/CartContext";
import { formatCurrency } from "../../../utils/formatCurrency";
import "../cart.css";

export default function CartDrawer() {
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, subtotal } = useCart();
  const navigate = useNavigate();

  return (
    <>
      <div
        className={`cart-drawer-overlay ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen(false)}
      />
      <div
        className={`cart-drawer-panel ${isOpen ? "open" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cart-drawer-header">
          <h2 className="cart-drawer-title">
            <i className="fa-solid fa-bag-shopping" /> سلة المشتريات
          </h2>
          <button className="cart-drawer-close" onClick={() => setIsOpen(false)}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className="cart-drawer-items">
          {items.length === 0 ? (
            <div className="cart-drawer-empty">
              <i className="fa-solid fa-shopping-basket" />
              <p style={{ fontWeight: 800 }}>
                سلتك فارغة حاليًا.
                <br />
                ابدأ التسوق واكتشف تشكيلتنا الفريدة.
              </p>
              <button
                className="cart-drawer-empty-btn"
                onClick={() => {
                  setIsOpen(false);
                  navigate("/shop");
                }}
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
                      sweets: "assets/images/cat_sweets.png",
                    };
                    e.target.src = fallback[cat] || "assets/images/logo-gold.svg";
                  }}
                />
                <div className="cd-item-info">
                  <div className="cd-item-name">{item.name}</div>
                  <div className="cd-item-price">{formatCurrency(item.price)}</div>
                  <div className="cd-item-qty">
                    <button className="qty-btn" onClick={() => updateQuantity(item.id, item.q - 1)}>
                      <i className="fa-solid fa-minus" />
                    </button>
                    <span style={{ fontWeight: 800 }}>{item.q}</span>
                    <button className="qty-btn" onClick={() => updateQuantity(item.id, item.q + 1)}>
                      <i className="fa-solid fa-plus" />
                    </button>
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
            <button
              className="btn-place-order"
              style={{ marginTop: 0 }}
              onClick={() => {
                setIsOpen(false);
                navigate("/checkout");
              }}
            >
              <span>إتمام الطلب</span>
              <i className="fa-solid fa-arrow-left" />
            </button>
            <button
              className="cd-btn-view-cart"
              onClick={() => {
                setIsOpen(false);
                navigate("/cart");
              }}
            >
              عرض السلة بالتفصيل
            </button>
          </div>
        )}
      </div>
    </>
  );
}
