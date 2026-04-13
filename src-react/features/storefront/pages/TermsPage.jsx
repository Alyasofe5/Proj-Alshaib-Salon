import React from "react";
import { Link } from "react-router-dom";

function scrollTo(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}
import "../storefront.css";

const SECTIONS = [
  {
    title: "قبول الشروط",
    content: `باستخدامك لموقع محامص ومطاحن الحسّون أو إجراء أي عملية شراء، فإنك توافق على الالتزام بهذه الشروط والأحكام. إن كنت لا توافق على أي بند من هذه الشروط، يُرجى التوقف عن استخدام الموقع. نحتفظ بحق تعديل هذه الشروط في أي وقت، وسيُعدّ استمرارك في استخدام الموقع موافقةً على التعديلات.`,
  },
  {
    title: "الحسابات والتسجيل",
    content: `أنت مسؤول عن الحفاظ على سرية بيانات حسابك وكلمة مرورك. تتحمل المسؤولية الكاملة عن جميع الأنشطة التي تجري تحت حسابك. يجب أن تكون قد بلغت 18 عاماً أو أكثر لإنشاء حساب وإجراء عمليات الشراء. نحتفظ بحق إلغاء أي حساب يُشتبه في إساءة استخدامه.`,
  },
  {
    title: "المنتجات والأسعار",
    content: `جميع المنتجات المعروضة على الموقع خاضعة للتوفر. نحتفظ بحق تغيير الأسعار في أي وقت دون إشعار مسبق، غير أن الطلبات المؤكدة لن تتأثر بتغييرات الأسعار اللاحقة. الصور المعروضة هي للإيضاح فقط وقد تختلف قليلاً عن المنتج الفعلي. جميع الأوزان والكميات المذكورة تقريبية.`,
  },
  {
    title: "الطلبات والدفع",
    content: `يُعدّ استلامك لتأكيد الطلب بريداً إلكترونياً إشعاراً بتلقّي طلبك لا قبولاً نهائياً به. نحتفظ بحق رفض أي طلب أو إلغائه في حالات الشك بالاحتيال أو عدم توفر المنتج. يجب أن تكون جميع بيانات الدفع صحيحة وأن تكون مفوّضاً باستخدام وسيلة الدفع المقدمة.`,
  },
  {
    title: "الشحن والتوصيل",
    content: `نسعى لتوصيل طلباتك في المواعيد المحددة، إلا أن مواعيد التوصيل تقديرية ولا تُعدّ ضماناً ملزماً. لسنا مسؤولين عن التأخيرات الناجمة عن ظروف خارجة عن إرادتنا كالأحوال الجوية أو الإضرابات. تنتقل مسؤولية البضائع إلى العميل فور تسليمها لشركة الشحن.`,
  },
  {
    title: "الملكية الفكرية",
    content: `جميع المحتويات على هذا الموقع من شعارات وصور ونصوص وتصاميم هي ملك حصري لمحامص ومطاحن الحسّون ومحمية بقوانين حقوق الملكية الفكرية. يُحظر نسخ أي محتوى أو إعادة استخدامه أو توزيعه دون إذن كتابي مسبق منا.`,
  },
  {
    title: "تحديد المسؤولية",
    content: `لن نكون مسؤولين عن أي أضرار غير مباشرة أو عرضية أو تبعية ناجمة عن استخدام موقعنا أو منتجاتنا. مسؤوليتنا القصوى في جميع الأحوال لا تتجاوز قيمة الطلب المعني. هذا لا يؤثر على أي حقوق قانونية لا يمكن التنازل عنها بموجب القانون الأردني.`,
  },
  {
    title: "القانون المطبّق",
    content: `تخضع هذه الشروط وتُفسَّر وفقاً لقوانين المملكة الأردنية الهاشمية. أي نزاع ينشأ عن هذه الشروط يخضع للاختصاص القضائي الحصري للمحاكم الأردنية المختصة في عمّان.`,
  },
];

export default function TermsPage() {
  return (
    <div className="legal-page">
      <div className="legal-hero">
        <div className="container">
          <div className="legal-hero-inner">
            <span className="legal-tag">آخر تحديث: أبريل 2026</span>
            <h1 className="legal-title">الشروط والأحكام</h1>
            <p className="legal-subtitle">
              يُرجى قراءة هذه الشروط بعناية قبل استخدام موقع محامص ومطاحن الحسّون أو إجراء أي عملية شراء.
            </p>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="legal-body">
          <aside className="legal-toc">
            <div className="legal-toc-inner">
              <p className="legal-toc-label">المحتويات</p>
              <ul>
                {SECTIONS.map((s, i) => (
                  <li key={i}>
                    <a href="#" onClick={(e) => { e.preventDefault(); scrollTo(`section-${i}`); }}>{s.title}</a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          <main className="legal-content">
            {SECTIONS.map((s, i) => (
              <section key={i} id={`section-${i}`} className="legal-section">
                <h2 className="legal-section-title">
                  <span className="legal-section-num">{String(i + 1).padStart(2, "0")}</span>
                  {s.title}
                </h2>
                <p className="legal-section-text">{s.content}</p>
              </section>
            ))}

            <div className="legal-footer-note">
              <i className="fa-solid fa-scale-balanced" />
              <p>تسري هذه الشروط اعتباراً من تاريخ آخر تحديث. استمرارك في استخدام الموقع بعد أي تعديل يُعدّ قبولاً صريحاً للشروط المحدّثة.</p>
            </div>

            <div className="legal-back">
              <Link to="/" className="btn btn-outline">
                <i className="fa-solid fa-arrow-right" /> العودة للرئيسية
              </Link>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
