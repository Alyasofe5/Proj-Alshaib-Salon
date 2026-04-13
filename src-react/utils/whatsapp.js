const WHATSAPP_NUMBER = "962700000000"; // غيّر هذا للرقم الحقيقي

/**
 * يبني رسالة واتساب ويفتح الرابط
 * @param {Array} items - عناصر السلة
 * @param {number} total - الإجمالي النهائي
 * @param {Object} customer - بيانات العميل (اختياري)
 */
export function orderViaWhatsapp(items, total, customer = {}) {
  const productLines = items.map(
    (item) => `• ${item.name} × ${item.q} — ${(item.price * item.q).toFixed(2)} د.أ`
  );

  const lines = [
    "🛒 *طلب جديد — محامص ومطاحن الحسّون*",
    "",
    "*المنتجات:*",
    ...productLines,
    "",
  ];

  if (customer.name) lines.push(`👤 *الاسم:* ${customer.name}`);
  if (customer.phone) lines.push(`📞 *الهاتف:* ${customer.phone}`);
  if (customer.city)  lines.push(`🏙️ *المدينة:* ${customer.city}`);
  if (customer.address) lines.push(`📍 *العنوان:* ${customer.address}`);

  if (customer.coupon || customer.discount > 0 || customer.shipping > 0) {
    lines.push("");
    if (customer.coupon)       lines.push(`🎟️ *كود الخصم:* ${customer.coupon}`);
    if (customer.discount > 0) lines.push(`💸 *الخصم:* -${customer.discount.toFixed(2)} د.أ`);
    if (customer.shipping > 0) lines.push(`🚚 *التوصيل:* ${customer.shipping.toFixed(2)} د.أ`);
  }

  lines.push("");
  lines.push(`💰 *الإجمالي: ${total.toFixed(2)} د.أ*`);
  lines.push("");
  lines.push("أرجو تأكيد الطلب وتحديد موعد التوصيل 🙏");

  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;
  window.open(url, "_blank", "noopener,noreferrer");
}
