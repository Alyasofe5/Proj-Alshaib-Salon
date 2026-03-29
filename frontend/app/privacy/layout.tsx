import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "سياسة الخصوصية — بيانات صالونك على مقص Maqass",
  description:
    "سياسة الخصوصية لمنصة مقص: كيف نحمي بيانات صالونك وعملائك والتزاماتنا أمام القانون.",
  alternates: {
    canonical: "https://maqas.site/privacy/",
  },
  openGraph: {
    siteName: "Maqass",
    title: "سياسة الخصوصية | مقص Maqass",
    description: "حماية بيانات صالونك وعملائك على منصة مقص.",
    url: "https://maqas.site/privacy/",
  },
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
