import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "تواصل معنا — تسجيل صالون وحجوزات أونلاين",
  description:
    "سجّل صالونك في منصة مقص Maqass مجاناً: طلب تفعيل، دعم خلال 24 ساعة، وإعداد نظام حجوزات وإدارة صالون احترافي.",
  alternates: {
    canonical: "https://maqas.site/contact/",
  },
  openGraph: {
    siteName: "Maqass",
    title: "تواصل معنا — تسجيل صالون | مقص Maqass",
    description:
      "سجّل صالونك في مقص مجاناً. فريقنا يجهّز لك الحجوزات والإدارة بسرعة.",
    url: "https://maqas.site/contact/",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
