import type { Metadata, Viewport } from "next";
import "./globals.css";
import ScrollToTop from "@/components/ScrollToTop";

// ─────────────────────────────────────────────
//  ENTERPRISE-GRADE SEO CONFIG — Maqass Platform
//  Based on practices used by Vercel, Linear, Notion
// ─────────────────────────────────────────────

const SITE_URL = "https://www.maqas.site";
const SITE_NAME = "مقص | Maqass";
const DEFAULT_TITLE = "مقص — منصة إدارة الصالونات في الأردن";
const DEFAULT_DESCRIPTION =
  "منصة متكاملة لإدارة الحجوزات والموظفين والتقارير المالية لصالونات الحلاقة في الأردن. رابط حجز ذكي، تقارير يومية، وإدارة محترفة بلمسة واحدة. جرّب مجاناً.";

export const metadata: Metadata = {
  // ── Core ──────────────────────────────────
  metadataBase: new URL(SITE_URL),

  title: {
    default: DEFAULT_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,

  keywords: [
    "صالون حلاقة",
    "إدارة صالون",
    "حجوزات أونلاين",
    "نظام حجز صالون",
    "برنامج صالون",
    "مقص",
    "maqass",
    "salon booking jordan",
    "salon management system",
    "حجز موعد حلاقة",
    "تطبيق صالون الأردن",
    "نظام إدارة الصالونات",
    "برنامج إدارة صالون حلاقة",
    "حجوزات صالون عمان",
    "إدارة موظفين صالون",
    "تقارير صالون",
    "منصة صالونات",
    "salon software arabic",
    "barber shop management",
    "salon SaaS jordan",
  ],

  authors: [{ name: "WR Technologies", url: "https://wr-technologies.net" }],
  creator: "WR Technologies",
  publisher: "WR Technologies",
  category: "software",

  // ── Open Graph (Facebook, WhatsApp, LinkedIn) ──
  openGraph: {
    type: "website",
    locale: "ar_JO",
    alternateLocale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "مقص — منصة إدارة الصالونات في الأردن",
        type: "image/png",
      },
    ],
  },

  // ── Twitter / X Card ──────────────────────
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [`${SITE_URL}/og-image.png`],
    creator: "@maqass_app",
    site: "@maqass_app",
  },

  // ── Canonical & Alternates ────────────────
  alternates: {
    canonical: SITE_URL,
    languages: {
      "ar-JO": SITE_URL,
      "ar": SITE_URL,
    },
  },

  // ── Robots ───────────────────────────────
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  // ── Icons & Manifest ──────────────────────
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.svg",
  },

  // ── Apple PWA ─────────────────────────────
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "مقص",
    startupImage: "/apple-touch-icon.png",
  },

  // ── Verification (add your codes when ready) ──
  verification: {
    // google: "YOUR_GOOGLE_SEARCH_CONSOLE_CODE",
    // yandex: "YOUR_YANDEX_CODE",
  },

  // ── Other ─────────────────────────────────
  applicationName: "مقص — Maqass",
  referrer: "origin-when-cross-origin",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)",  color: "#343434" },
    { media: "(prefers-color-scheme: light)", color: "#343434" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        {/* ── Structured Data (JSON-LD) — helps Google understand the page ── */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "مقص — Maqass",
              alternateName: "Maqass Salon Platform",
              url: SITE_URL,
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web, iOS, Android",
              description: DEFAULT_DESCRIPTION,
              offers: [
                {
                  "@type": "Offer",
                  price: "0",
                  priceCurrency: "JOD",
                  name: "الباقة المجانية",
                },
                {
                  "@type": "Offer",
                  price: "15",
                  priceCurrency: "JOD",
                  name: "الباقة الاحترافية",
                },
              ],
              publisher: {
                "@type": "Organization",
                name: "WR Technologies",
                url: "https://wr-technologies.net",
                logo: {
                  "@type": "ImageObject",
                  url: `${SITE_URL}/icon-192.png`,
                },
                contactPoint: {
                  "@type": "ContactPoint",
                  telephone: "+962-78-171-7990",
                  contactType: "customer support",
                  areaServed: "JO",
                  availableLanguage: ["Arabic", "English"],
                },
                address: {
                  "@type": "PostalAddress",
                  addressCountry: "JO",
                  addressLocality: "عمّان",
                },
              },
              featureList: [
                "حجوزات أونلاين ذكية 24/7",
                "إدارة الموظفين والعمولات",
                "تقارير مالية يومية وشهرية",
                "رابط حجز مخصص لكل صالون",
                "إشعارات واتساب تلقائية",
              ],
              inLanguage: "ar",
              isAccessibleForFree: true,
              screenshot: `${SITE_URL}/og-image.png`,
            }),
          }}
        />

        {/* ── Preconnect to speed up font loading ── */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          as="style"
          href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-tajawal antialiased" suppressHydrationWarning>
        <ScrollToTop />
        {children}
      </body>
    </html>
  );
}
