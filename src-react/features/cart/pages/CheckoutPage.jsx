import React, { useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useCart } from "../../../context/CartContext";
import { SHIPPING_COST } from "../../../constants/media";
import { applyCouponCode } from "../../../lib/api/coupons";
import { createOrder } from "../../../lib/api/orders";
import CustomSelect from "../../../shared/components/CustomSelect";
import { formatCurrency } from "../../../utils/formatCurrency";
import { orderViaWhatsapp } from "../../../utils/whatsapp";
import "../cart.css";

const CITIES = [
  "عمّان",
  "إربد",
  "الزرقاء",
  "العقبة",
  "السلط",
  "مادبا",
  "الكرك",
  "الطفيلة",
  "معان",
  "عجلون",
  "جرش",
  "المفرق",
  "باقي المحافظات",
].map((city) => ({ value: city, label: city }));

export default function CheckoutPage() {
  const cart = useCart();
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(null);
  const [couponMsg, setCouponMsg] = useState("");
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    city: "عمّان",
    address: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subtotal = cart.subtotal;
  const isShippingEnabled = localStorage.getItem("alhason_shipping_module") !== "false";
  const shipping = cart.items.length && isShippingEnabled ? SHIPPING_COST : 0;

  const discountValue = useMemo(() => {
    if (!discount) return 0;

    const nonSaleTotal = cart.items
      .filter((item) => !item.isOnSale)
      .reduce((sum, item) => sum + item.price * item.q, 0);

    return discount.discount_type === "percent"
      ? nonSaleTotal * (Number(discount.discount_value) / 100)
      : Math.min(nonSaleTotal, Number(discount.discount_value));
  }, [cart.items, discount]);

  const total = Math.max(0, subtotal - discountValue + shipping);

  if (!cart.items.length) {
    return <Navigate to="/shop" replace />;
  }

  async function handleCoupon() {
    if (!couponCode.trim()) return;

    const result = await applyCouponCode(couponCode.trim().toUpperCase());
    if (!result) {
      setDiscount(null);
      setCouponMsg("كود الخصم غير صحيح أو منتهي الصلاحية.");
      return;
    }

    setDiscount(result);
    setCouponMsg(
      `تم تفعيل خصم ${result.discount_value}${result.discount_type === "percent" ? "%" : " د.أ"} بنجاح`,
    );
  }

  async function handleOrder() {
    if (isSubmitting) return;

    if (!form.first_name || !form.last_name || !form.phone || !form.address) {
      window.Swal.fire("ملاحظة", "يرجى تعبئة جميع حقول التوصيل.", "warning");
      return;
    }

    if (form.phone.length !== 10) {
      window.Swal.fire("ملاحظة", "رقم الواتساب يجب أن يكون 10 أرقام.", "warning");
      return;
    }

    setIsSubmitting(true);

    try {
      await createOrder({
        customer_name: `${form.first_name} ${form.last_name}`.trim(),
        customer_phone: form.phone,
        customer_city: form.city,
        customer_address: form.address,
        items: cart.items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          q: item.q,
          image: item.image,
        })),
        subtotal,
        discount: discountValue,
        shipping,
        coupon_used: discount?.code || null,
        total,
        payment_method: "whatsapp",
        status: "pending",
      });

      orderViaWhatsapp(cart.items, total, {
        name: `${form.first_name} ${form.last_name}`.trim(),
        phone: form.phone,
        city: form.city,
        address: form.address,
        coupon: discount?.code || null,
        discount: discountValue,
        shipping,
      });

      cart.clearCart();
      navigate("/");
    } catch {
      window.Swal.fire("خطأ", "حدث خطأ أثناء معالجة الطلب. حاول مجددًا.", "error");
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
            <span>مراجعة السلة</span>
          </Link>

          <Link to="/" className="checkout-logo-link" aria-label="العودة إلى الرئيسية">
            <img src="assets/images/logo-gold.svg" alt="AL Hason" className="checkout-logo" />
          </Link>

          <div className="checkout-channel-note">
            <i className="fa-brands fa-whatsapp" />
            <span>طلب عبر واتساب</span>
          </div>
        </div>
      </header>

      <div className="container">
        <div className="platinum-checkout-grid">
          <main>
            <section className="checkout-section-lux">
              <h2 className="checkout-sec-title">
                <i className="fa-solid fa-map-location-dot" />
                <span>بيانات التوصيل</span>
              </h2>

              <div className="lux-form-grid">
                <div className="lux-field-stack">
                  <label htmlFor="checkout-first-name">الاسم الأول</label>
                  <input
                    id="checkout-first-name"
                    className="lux-input"
                    placeholder="أحمد"
                    value={form.first_name}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  />
                </div>

                <div className="lux-field-stack">
                  <label htmlFor="checkout-last-name">اسم العائلة</label>
                  <input
                    id="checkout-last-name"
                    className="lux-input"
                    placeholder="الحسّون"
                    value={form.last_name}
                    onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                  />
                </div>

                <div className="lux-field-stack">
                  <label htmlFor="checkout-phone">رقم واتساب</label>
                  <input
                    id="checkout-phone"
                    className="lux-input"
                    placeholder="07XXXXXXXX"
                    value={form.phone}
                    maxLength={10}
                    inputMode="numeric"
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setForm({ ...form, phone: value });
                    }}
                  />
                  {form.phone && form.phone.length !== 10 ? (
                    <span className="checkout-field-hint error">يجب أن يكون الرقم 10 أرقام</span>
                  ) : null}
                </div>

                <div className="lux-field-stack">
                  <label htmlFor="checkout-city">المدينة</label>
                  <CustomSelect
                    name="city"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    options={CITIES}
                  />
                </div>
              </div>

              <div className="lux-field-stack checkout-address-stack">
                <label htmlFor="checkout-address">العنوان التفصيلي</label>
                <input
                  id="checkout-address"
                  className="lux-input"
                  placeholder="المنطقة، الشارع، المعلم المجاور..."
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>
            </section>

            <section className="checkout-section-lux">
              <h2 className="checkout-sec-title">
                <i className="fa-solid fa-truck" />
                <span>طريقة الدفع</span>
              </h2>

              <div className="payment-card-lux active" style={{ cursor: "default" }}>
                <div className="pay-icon-lux">
                  <i className="fa-solid fa-handshake" style={{ color: "var(--color-secondary)" }} />
                </div>

                <div className="pay-info-lux">
                  <h4>الدفع عند الاستلام</h4>
                  <p>نقدًا عند وصول المندوب إلى باب منزلك</p>
                </div>

                <i className="fa-solid fa-truck-fast payment-card-trailing" />
              </div>
            </section>
          </main>

          <aside>
            <div className="order-summary-platinum">
              <h3 className="summary-headline">
                <i className="fa-solid fa-list-check" />
                <span>ملخص الطلب</span>
              </h3>

              <div className="summary-item-list">
                {cart.items.map((item) => (
                  <div className="summary-prod-mini" key={item.id}>
                    <span>
                      {item.name} <small className="summary-prod-qty">x {item.q}</small>
                    </span>
                    <span>{formatCurrency(item.price * item.q)}</span>
                  </div>
                ))}
              </div>

              <div className="coupon-box-lux">
                <input
                  placeholder="كود الخصم..."
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                />
                <button type="button" onClick={handleCoupon}>
                  تطبيق
                </button>
              </div>

              {couponMsg ? (
                <p className={`summary-feedback ${discount ? "success" : "error"}`}>{couponMsg}</p>
              ) : null}

              <div className="summary-divider" />

              <div className="summary-row-plat">
                <span>المجموع الفرعي</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>

              <div className="summary-row-plat">
                <span>رسوم التوصيل</span>
                <span>{formatCurrency(shipping)}</span>
              </div>

              {discountValue > 0 ? (
                <div className="summary-row-plat summary-row-discount">
                  <span>خصم الكوبون</span>
                  <span>-{formatCurrency(discountValue)}</span>
                </div>
              ) : null}

              <div className="summary-total-plat">
                <span>الإجمالي</span>
                <span>{formatCurrency(total)}</span>
              </div>

              <button className="btn-place-order" onClick={handleOrder} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin" />
                    <span>جاري الإرسال...</span>
                  </>
                ) : (
                  <>
                    <span>تأكيد وإرسال عبر واتساب</span>
                    <i className="fa-brands fa-whatsapp" />
                  </>
                )}
              </button>

              <p className="checkout-summary-note">
                سيتم فتح واتساب مع تفاصيل طلبك
                <br />
                وحفظ الطلب في النظام تلقائيًا
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
