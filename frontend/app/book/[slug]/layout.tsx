import type { Metadata, ResolvingMetadata } from "next";

type Props = {
  params: { slug: string };
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const slug = params.slug;
  const capitalizedSlug = slug.charAt(0).toUpperCase() + slug.slice(1);

  return {
    title: `حجز موعد - ${capitalizedSlug} | Maqas`,
    description: `احجز موعدك الآن في صالون ${capitalizedSlug} عبر منصة مقص — حجز ذكي، خدمات وأسعار، وتجربة سلسة.`,
  };
}

export default function SlugLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
