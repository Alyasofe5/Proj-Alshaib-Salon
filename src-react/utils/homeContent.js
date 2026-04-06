import { supabase } from "../lib/supabaseClient";

export const DEFAULT_CONTENT = {
  story: {
    heading: "أصل النكهة.. وشغف الجودة",
    text1: "في الحسّون، نحوّل حبات القهوة، وعبق البهارات، وخيرات المكسرات إلى تجربة استثنائية. بدأنا بشغف البحث عن الأجود، لنقدم لكم اليوم منتجات تُنتقى بعناية وتُحضّر بإتقان، لتبقى الأصالة حاضرة في كل رشفة وكل مذاق.",
    text2: "نحن لا نقدم منتجاً فحسب، بل نروي حكاية جودة تليق بذائقتكم.",
    image1: "/assets/images/hero.png",
    image2: "/assets/images/our-story-spices.png",
  },
  numbers: [
    { key: "products",  value: "60", suffix: "+", prefix: "",  title: "منتج مميز",      subtitle: "من القهوة والبهارات والمكسرات", tone: "gold" },
    { key: "markets",   value: "10", suffix: "+", prefix: "",  title: "أسواق وشراكات", subtitle: "في السوق المحلي والإقليمي",     tone: "stone" },
    { key: "customers", value: "10", suffix: "+", prefix: "K", title: "عميل يثق بنا",  subtitle: "ويختار الحسّون مراراً",         tone: "gold" },
  ],
  vision: [
    { key: "mission",    title: "رسالتنا", text: "نحن في مهمة لنشر الشغف مع كل فنجان قهوة، ونطمح إلى سنوات طويلة من الإتقان لنقدّم نكهات أصيلة تلهم الذائقة اليومية." },
    { key: "dream",      title: "حلمنا",   text: "حلمنا أن يكون الحسّون الاسم الأقرب إلى محبي الجودة، وأن نبني ثقافة من الشغف والثقة والاحترام في كل تجربة نقدمها." },
    { key: "leadership", title: "رؤيتنا", text: "أن نصبح الشريك الأكثر وثوقية في عالم القهوة والبهارات والمكسرات، مع حضور راسخ في الأسواق المحلية والإقليمية." },
    { key: "moments",    title: "وعدنا",  text: "أن نشارك عملاءنا لحظاتهم اليومية بمنتجات مثالية، لذيذة، وملهمة، تجعل الجودة حاضرة في أي وقت وأي مكان." },
  ],
  wholesale: {
    heading: "قطاع الأعمال ومبيعات الجملة",
    text: "نحن في محامص الحسّون نفهم متطلبات قطاع الأعمال بدقة. نقدم حلول توريد متكاملة تلبي شغف الفنادق والمقاهي والمطاعم بتقديم أجود أنواع البن والمكسرات العالمية لعملائهم.",
    benefits: [
      { icon: "fa-solid fa-boxes-stacked", title: "كميات تجارية", desc: "توريد القهوة والمكسرات والبهارات بكميات الجملة للمطاعم والفنادق." },
      { icon: "fa-solid fa-tags",          title: "أسعار حصرية",  desc: "عروض خاصة وعقود توريد بأسعار تنافسية جداً لشركاء الأعمال." },
      { icon: "fa-solid fa-truck-fast",    title: "توريد منتظم",  desc: "جداول توريد مرنة تضمن بقاء مخزونك طازجاً ومكتملاً دوماً." },
      { icon: "fa-solid fa-headset",       title: "دعم متخصص",   desc: "فريق مبيعات متفانٍ لتقديم الاستشارات الفنية واللوجستية لعملك." },
    ],
  },
  faq: [
    { question: "هل يتوفر الشحن لجميع مناطق المملكة؟",         answer: "نعم، نشحن لجميع مدن ومحافظات المملكة العربية السعودية عبر شركائنا في سمسا وأرامكس في وقت قياسي." },
    { question: "هل توفرون خدمة الطحن للقهوة؟",                 answer: "بالتأكيد، يمكنك اختيار نوع الطحنة المناسب لمعداتك (إسبريسو، فلتر، قهوة سعودية) عند طلب أي صنف من حبوب القهوة." },
    { question: "كيف يمكن الحصول على عينات لقطاع الجملة؟",     answer: "يمكنكم التواصل معنا عبر نموذج 'قطاع الأعمال' وسنقوم بترتيب إرسال عينات تذوق مخصصة لنوع نشاطكم التجاري." },
    { question: "ما هي سياسة الاسترجاع في حال وجود ملاحظات؟", answer: "رضا عملاءنا هو أولويتنا، في حال وجود أي ملاحظة على الجودة، نرجو التواصل معنا خلال 24 ساعة لتبديل المنتج فوراً." },
  ],
};

export async function fetchHomeContent() {
  const { data, error } = await supabase
    .from("site_content")
    .select("key, value")
    .in("key", ["homepage_content", "curated_ids"]);

  if (error || !data?.length) return { content: DEFAULT_CONTENT, curatedIds: [] };

  const result = {};
  data.forEach((row) => {
    try { result[row.key] = JSON.parse(row.value); } catch { result[row.key] = row.value; }
  });

  return {
    content: result.homepage_content ? { ...DEFAULT_CONTENT, ...result.homepage_content } : DEFAULT_CONTENT,
    curatedIds: result.curated_ids || [],
  };
}

export async function saveHomeData(content, curatedIds) {
  const rows = [
    { key: "homepage_content", value: JSON.stringify(content), updated_at: new Date().toISOString() },
    { key: "curated_ids",      value: JSON.stringify(curatedIds), updated_at: new Date().toISOString() },
  ];
  const { error } = await supabase.from("site_content").upsert(rows, { onConflict: "key" });
  if (error) throw error;
}

// للقراءة المتزامنة من localStorage كـ fallback
export function loadHomeContent() {
  try {
    const raw = localStorage.getItem("alhason_homepage_content");
    if (raw) return { ...DEFAULT_CONTENT, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_CONTENT;
}

export function loadCuratedIds() {
  try { return JSON.parse(localStorage.getItem("alhason_curated_ids") || "[]"); } catch { return []; }
}
