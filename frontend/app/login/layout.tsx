import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "تسجيل الدخول | Maqass — لوحة تحكم صالونك",
  description:
    "سجّل دخولك إلى لوحة تحكم صالونك في منصة مقص. أدر حجوزاتك، موظفيك، وتقاريرك المالية بسهولة.",
  alternates: {
    canonical: "https://maqas.site/login",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
