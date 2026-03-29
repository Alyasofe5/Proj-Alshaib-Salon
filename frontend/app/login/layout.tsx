import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "تسجيل الدخول — لوحة تحكم صالونك",
  description:
    "دخول لوحة تحكم مقص Maqass: حجوزات، موظفون، تقارير مالية، وإدارة صالونك من مكان واحد.",
  alternates: {
    canonical: "https://maqas.site/login/",
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
