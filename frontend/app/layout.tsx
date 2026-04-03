import type { Metadata, Viewport } from "next";
import { Noto_Sans_Arabic } from "next/font/google";
import "./globals.css";
import ScrollToTop from "@/components/ScrollToTop";

const notoSansArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  display: "swap",
  weight: ["100", "400", "700", "900"],
  variable: "--font-noto",
});

import { Playfair_Display, Tajawal, Space_Mono, Cormorant_Garamond, Oswald } from "next/font/google";

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "700", "900"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
});

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
});

const oswald = Oswald({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
  variable: "--font-oswald",
});

const tajawal = Tajawal({
  subsets: ["arabic"],
  display: "swap",
  weight: ["400", "500", "700", "800", "900"],
  variable: "--font-tajawal",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "700"],
  variable: "--font-space-mono",
});

// ─────────────────────────────────────────────
//  ENTERPRISE-GRADE SEO CONFIG — Maqass Platform
//  Based on practices used by Vercel, Linear, Notion
// ─────────────────────────────────────────────

const SITE_URL = "https://maqas.site";
/** اسم العلامة الظاهر في نتائج Google (og:site_name، WebSite schema، التبويب) */
const BRAND_NAME = "Maqass";
const DEFAULT_TITLE =
  "مقص Maqass — منصة إدارة صالونات وحجوزات أونلاين في الأردن | برنامج صالون وحلاقة";
const DEFAULT_DESCRIPTION =
  "منصة مقص Maqass: إدارة صالون حلاقة، حجوزات أونلاين 24/7، موظفين، تقارير مالية، وربط حجز ذكي — مصمم لصالونات الأردن وعمان. جرّب مجاناً.";

export const metadata: Metadata = {
  // ── Core ──────────────────────────────────
  metadataBase: new URL(SITE_URL),

  title: {
    default: DEFAULT_TITLE,
    template: `%s | ${BRAND_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,

  keywords: [
    "مقص",
    "maqass",
    "Maqass",
    "صالون حلاقة",
    "إدارة صالون",
    "إدارة صالونات",
    "مقص صالون",
    "حجوزات أونلاين",
    "نظام حجز صالون",
    "برنامج صالون",
    "برنامج إدارة صالون",
    "حجز موعد حلاقة",
    "صالون عمان",
    "حجوزات صالون عمان",
    "تطبيق صالون الأردن",
    "نظام إدارة الصالونات",
    "برنامج إدارة صالون حلاقة",
    "إدارة موظفين صالون",
    "تقارير صالون",
    "منصة صالونات",
    "salon booking jordan",
    "salon management system",
    "barber shop management",
    "salon software arabic",
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
    siteName: BRAND_NAME,
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
    canonical: `${SITE_URL}/`,
    languages: {
      "ar-JO": `${SITE_URL}/`,
      "ar": `${SITE_URL}/`,
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

  // ── Icons & Manifest (favicon.ico + app/icon.* from /app take precedence in Next.js) ──
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/icon-192.png",
  },

  // ── Apple PWA ─────────────────────────────
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: BRAND_NAME,
    startupImage: "/apple-touch-icon.png",
  },

  // ── Verification (add your codes when ready) ──
  verification: {
    // google: "YOUR_GOOGLE_SEARCH_CONSOLE_CODE",
    // yandex: "YOUR_YANDEX_CODE",
  },

  // ── Other ─────────────────────────────────
  applicationName: BRAND_NAME,
  referrer: "origin-when-cross-origin",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#222022" },
    { media: "(prefers-color-scheme: light)", color: "#222022" },
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
    <html lang="ar" dir="rtl" className={`${notoSansArabic.variable} ${playfairDisplay.variable} ${cormorantGaramond.variable} ${oswald.variable} ${tajawal.variable} ${spaceMono.variable}`} suppressHydrationWarning>
      <head>
        {/* ── JSON-LD: Organization + WebSite + SoftwareApplication + روابط رئيسية (إشارات لسيتلينكس والعلامة) ── */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  "@id": `${SITE_URL}/#organization`,
                  name: BRAND_NAME,
                  alternateName: ["مقص", "Maqass Salon Platform", "maqas.site"],
                  url: `${SITE_URL}/`,
                  logo: {
                    "@type": "ImageObject",
                    url: `${SITE_URL}/icon-512.png`,
                    width: 512,
                    height: 512,
                  },
                  image: `${SITE_URL}/images/logo_new.png`,
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
                {
                  "@type": "WebSite",
                  "@id": `${SITE_URL}/#website`,
                  url: `${SITE_URL}/`,
                  name: BRAND_NAME,
                  alternateName: ["مقص", "مقص صالون", "إدارة صالونات", "maqas.site"],
                  description: DEFAULT_DESCRIPTION,
                  inLanguage: "ar-JO",
                  publisher: { "@id": `${SITE_URL}/#organization` },
                },
                {
                  "@type": "SoftwareApplication",
                  name: `مقص — ${BRAND_NAME}`,
                  alternateName: "Maqass Salon Platform",
                  url: `${SITE_URL}/`,
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
                  provider: { "@id": `${SITE_URL}/#organization` },
                  publisher: { "@id": `${SITE_URL}/#organization` },
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
                },
                {
                  "@type": "SiteNavigationElement",
                  name: "حجز صالون أونلاين",
                  url: `${SITE_URL}/book/`,
                },
                {
                  "@type": "SiteNavigationElement",
                  name: "تواصل معنا",
                  url: `${SITE_URL}/contact/`,
                },
                {
                  "@type": "SiteNavigationElement",
                  name: "سياسة الخصوصية",
                  url: `${SITE_URL}/privacy/`,
                },
                {
                  "@type": "SiteNavigationElement",
                  name: "الشروط والأحكام",
                  url: `${SITE_URL}/terms/`,
                },
                {
                  "@type": "SiteNavigationElement",
                  name: "تسجيل الدخول",
                  url: `${SITE_URL}/login/`,
                },
              ],
            }),
          }}
        />

        {/* ── W3C PWA capable ── */}
        <meta name="mobile-web-app-capable" content="yes" />

        {/* Google Fonts now optimized via next/font/google in layout.tsx */}
      </head>
      <body className={`${notoSansArabic.className} antialiased`} suppressHydrationWarning>
        <ScrollToTop />
        {children}
      </body>
    </html>
  );
}
