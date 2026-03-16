import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "الشروط والأحكام | Maqass — اتفاقية الاستخدام",
  description:
    "اقرأ شروط وأحكام استخدام منصة مقص لإدارة الصالونات. تعرّف على حقوقك والتزاماتك كمستخدم للمنصة.",
  alternates: {
    canonical: "https://maqas.site/terms",
  },
  openGraph: {
    title: "الشروط والأحكام | Maqass",
    description:
      "شروط وأحكام استخدام منصة مقص لإدارة الصالونات.",
    url: "https://maqas.site/terms",
  },
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
