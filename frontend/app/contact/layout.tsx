import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "تواصل معنا | Maqass — سجّل صالونك مجاناً",
  description:
    "سجّل صالونك في منصة مقص مجاناً! أرسل طلبك وسيتواصل فريقنا خلال 24 ساعة لتفعيل حسابك وإعداد نظام الحجوزات.",
  alternates: {
    canonical: "https://maqas.site/contact",
  },
  openGraph: {
    title: "تواصل معنا | Maqass — سجّل صالونك مجاناً",
    description:
      "سجّل صالونك في منصة مقص مجاناً! أرسل طلبك وسيتواصل فريقنا خلال 24 ساعة.",
    url: "https://maqas.site/contact",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
