import React from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../../shared/components/Header";
import { useCart } from "../../../context/CartContext";
import { formatCurrency } from "../../../utils/formatCurrency";
import { SHIPPING_COST } from "../../../constants/media";
import "../cart.css";

export default function CartPage() {
  const cart = useCart();
  const navigate = useNavigate();
  const subtotal = cart.subtotal;
  const isShippingEnabled = localStorage.getItem("alhason_shipping_module") !== "false";
  const shipping = cart.items.length && isShippingEnabled ? SHIPPING_COST : 0;
  const total = subtotal + shipping;

  return (
    <div className="platinum-shop-view cart-page-shell" style={{ minHeight: "100vh" }}>
      <Header type="shop" />

      <main className="container cart-page-main">
        <div className="cart-page-header">
          <h1 className="cart-page-title">مراجعة السلة</h1>
        </div>

        {!cart.items.length ? (
          <div className="cart-page-empty">
            <i className="fa-solid fa-shopping-basket cart-page-empty-icon" />
            <h2 className="cart-page-empty-title">سلتك هادئة جدًا...</h2>
            <p className="cart-page-empty-text">
              لم تختر أي مقتنيات بعد. استكشف منتجاتنا الفريدة الآن.
            </p>
            <button
              className="btn btn-primary cart-page-empty-btn"
              onClick={() => navigate("/shop")}
            >
              ابدأ التسوق
            </button>
          </div>
        ) : (
          <div className="platinum-checkout-grid cart-page-grid">
            <div className="cart-list-lux cart-page-list">
              {cart.items.map((item) => (
                <div key={item.id} className="checkout-section-lux cart-page-item">
                  <img src={item.image} alt={item.name} className="cart-page-item-image" />

                  <div className="cart-page-item-copy">
                    <h3 className="cart-page-item-name">{item.name}</h3>
                    <div className="cart-page-item-price">{formatCurrency(item.price)}</div>
                  </div>

                  <div className="cart-qty-ctrl cart-page-item-qty">
                    <button
                      className="cart-qty-btn cart-page-qty-btn"
                      onClick={() => cart.updateQuantity(item.id, item.q - 1)}
                    >
                      <i className="fa-solid fa-minus" />
                    </button>
                    <span className="cart-page-qty-value">{item.q}</span>
                    <button
                      className="cart-qty-btn cart-page-qty-btn"
                      onClick={() => cart.updateQuantity(item.id, item.q + 1)}
                    >
                      <i className="fa-solid fa-plus" />
                    </button>
                  </div>

                  <button
                    onClick={() => cart.removeItem(item.id)}
                    className="cart-page-item-remove"
                    aria-label={`إزالة ${item.name} من السلة`}
                  >
                    <i className="fa-solid fa-trash-can" />
                  </button>
                </div>
              ))}

              <button className="btn btn-outline cart-page-clear-btn" onClick={() => cart.clearCart()}>
                تفريغ الحقيبة بالكامل
              </button>
            </div>

            <aside className="cart-page-aside">
              <div className="order-summary-platinum cart-page-summary">
                <h3 className="summary-headline">ملخص الطلب</h3>
                <div className="summary-row-plat">
                  <span>المجموع الفرعي</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="summary-row-plat">
                  <span>رسوم التوصيل</span>
                  <span>{formatCurrency(shipping)}</span>
                </div>
                <div className="summary-divider" />
                <div className="summary-total-plat cart-page-summary-total">
                  <span>الإجمالي</span>
                  <span>{formatCurrency(total)}</span>
                </div>

                <button className="btn-place-order" style={{ marginTop: 0 }} onClick={() => navigate("/checkout")}>
                  <span>إتمام الطلب</span>
                  <i className="fa-solid fa-arrow-left" />
                </button>

                <p className="cart-page-summary-note">
                  ستُدخل بيانات التوصيل ثم يُرسل طلبك عبر واتساب
                </p>
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
