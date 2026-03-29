import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "الشروط والأحكام — استخدام منصة مقص Maqass",
  description:
    "شروط وأحكام استخدام منصة مقص لإدارة صالونات الحلاقة والحجوزات. حقوقك والتزاماتك كمستخدم.",
  alternates: {
    canonical: "https://maqas.site/terms/",
  },
  openGraph: {
    siteName: "Maqass",
    title: "الشروط والأحكام | مقص Maqass",
    description: "شروط استخدام منصة إدارة الصالونات مقص في الأردن.",
    url: "https://maqas.site/terms/",
  },
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
