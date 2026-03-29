import type { Metadata } from "next";

const SITE = "https://maqas.site";

/** صفحة الحجز العامة — عنوان فريد يميّزها عن الصفحة الرئيسية (مهم لسيتلينكس وجوجل) */
export const metadata: Metadata = {
  title: "حجز موعد صالون أونلاين — رابط حجز ذكي لصالونك",
  description:
    "احجز موعدك في صالونك المفضل عبر مقص Maqass: نظام حجز أونلاين، عرض الخدمات والأسعار، واختيار الموعد المناسب بسهولة من أي جهاز.",
  keywords: [
    "حجز صالون",
    "موعد حلاقة",
    "حجز أونلاين صالون",
    "مقص حجز",
    "maqass book",
    "salon booking jordan",
  ],
  alternates: {
    canonical: `${SITE}/book/`,
  },
  openGraph: {
    type: "website",
    url: `${SITE}/book/`,
    siteName: "Maqass",
    title: "حجز موعد صالون أونلاين — مقص Maqass",
    description:
      "احجز موعدك في صالونك المفضل عبر منصة مقص: حجز ذكي، خدمات وأسعار، وتجربة سلسة.",
    locale: "ar_JO",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function BookLayout({ children }: { children: React.ReactNode }) {
  return children;
}
