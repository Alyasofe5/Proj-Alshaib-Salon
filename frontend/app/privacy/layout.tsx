import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "سياسة الخصوصية | Maqass — حماية بياناتك أولويتنا",
  description:
    "اطّلع على سياسة الخصوصية الخاصة بمنصة مقص. نحمي بيانات صالونك وعملائك بأعلى معايير الأمان والتشفير.",
  alternates: {
    canonical: "https://maqas.site/privacy",
  },
  openGraph: {
    title: "سياسة الخصوصية | Maqass",
    description:
      "نحمي بيانات صالونك وعملائك بأعلى معايير الأمان والتشفير.",
    url: "https://maqas.site/privacy",
  },
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
