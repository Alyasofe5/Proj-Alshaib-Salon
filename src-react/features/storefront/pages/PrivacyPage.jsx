import React from "react";
import { Link } from "react-router-dom";

function scrollTo(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}
import "../storefront.css";

const SECTIONS = [
  {
    title: "المعلومات التي نجمعها",
    content: `نجمع المعلومات التي تقدمها مباشرةً عند إنشاء حساب أو إتمام طلب شراء أو التواصل معنا، وتشمل: الاسم الكامل، عنوان البريد الإلكتروني، رقم الهاتف، عنوان التوصيل، وبيانات الدفع المشفّرة. كما نجمع تلقائياً بيانات تقنية مثل عنوان IP ونوع المتصفح وصفحات الزيارة لتحسين تجربة الاستخدام.`,
  },
  {
    title: "كيف نستخدم معلوماتك",
    content: `نستخدم بياناتك لمعالجة طلباتك وتوصيل مشترياتك، وإرسال تحديثات الطلب والإشعارات الخاصة بالعروض (بموافقتك)، وتحسين منتجاتنا وخدماتنا، والامتثال للمتطلبات القانونية والتنظيمية في المملكة الأردنية الهاشمية.`,
  },
  {
    title: "مشاركة المعلومات مع الأطراف الثالثة",
    content: `لا نبيع بياناتك الشخصية أو نتاجر بها. قد نشارك معلوماتك مع شركاء التوصيل (سمسا، أرامكس) لإتمام عملية الشحن، ومعالجي الدفع الآمن، والجهات القانونية عند الاقتضاء القانوني فقط. جميع شركاؤنا ملتزمون بمعايير حماية البيانات ذاتها.`,
  },
  {
    title: "أمان البيانات",
    content: `نطبّق معايير أمان متقدمة تشمل التشفير SSL لجميع البيانات المنقولة، وتشفير بيانات الدفع وفق معايير PCI-DSS، وصلاحيات وصول محدودة للموظفين، ومراجعات أمنية دورية لأنظمتنا. ومع ذلك، لا يوجد نظام آمن بالكامل، وننصح بعدم مشاركة كلمات المرور.`,
  },
  {
    title: "ملفات الارتباط (Cookies)",
    content: `نستخدم ملفات الارتباط لحفظ تفضيلاتك وعناصر سلة التسوق وجلسة تسجيل الدخول. يمكنك التحكم في إعدادات الكوكيز من متصفحك، غير أن تعطيلها قد يؤثر على بعض وظائف الموقع.`,
  },
  {
    title: "حقوقك",
    content: `يحق لك في أي وقت: طلب الاطلاع على بياناتك الشخصية، طلب تصحيحها أو تحديثها، طلب حذفها من أنظمتنا، الاعتراض على معالجتها لأغراض التسويق، وسحب موافقتك على النشرة البريدية. للممارسة أي من هذه الحقوق، تواصل معنا عبر البريد الإلكتروني.`,
  },
  {
    title: "التواصل معنا",
    content: `لأي استفسار يتعلق بسياسة الخصوصية أو بياناتك الشخصية، يمكنك التواصل مع فريقنا عبر: البريد الإلكتروني: info@alhason.com — الهاتف: 07XXXXXXXX — العنوان: عمان، شارع مكة، الأردن.`,
  },
];

export default function PrivacyPage() {
  return (
    <div className="legal-page">
      <div className="legal-hero">
        <div className="container">
          <div className="legal-hero-inner">
            <span className="legal-tag">آخر تحديث: أبريل 2026</span>
            <h1 className="legal-title">سياسة الخصوصية</h1>
            <p className="legal-subtitle">
              نلتزم في محامص ومطاحن الحسّون بحماية خصوصيتك وأمان بياناتك الشخصية. تشرح هذه السياسة كيف نجمع معلوماتك ونستخدمها ونحميها.
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
              <i className="fa-solid fa-shield-halved" />
              <p>تخضع هذه السياسة لأحكام قوانين حماية البيانات المعمول بها في المملكة الأردنية الهاشمية. نحتفظ بحق تعديلها في أي وقت مع إخطارك بالتغييرات الجوهرية.</p>
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
