import type { Metadata } from "next";
import localFont from "next/font/local";
import "@/styles/globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ChatWidget from "@/components/ChatWidget";
import PageViewTracker from "@/components/PageViewTracker";
import { SITE_CONFIG } from "@/lib/constants";

// General Sans, self-hosted from app/fonts (the regular weights the site uses)
const generalSans = localFont({
  src: [
    { path: "./fonts/GeneralSans-Light.otf", weight: "300", style: "normal" },
    { path: "./fonts/GeneralSans-Regular.otf", weight: "400", style: "normal" },
    { path: "./fonts/GeneralSans-Medium.otf", weight: "500", style: "normal" },
    { path: "./fonts/GeneralSans-Semibold.otf", weight: "600", style: "normal" },
    { path: "./fonts/GeneralSans-Bold.otf", weight: "700", style: "normal" },
  ],
  variable: "--font-general-sans",
  display: "swap",
  // Preloading all five weights (~150 KB) competed with the CSS the first paint
  // needs; text now paints in the size-matched fallback and swaps when they arrive
  preload: false,
});
 

export const metadata: Metadata = {
  title: {
    default: `${SITE_CONFIG.name} — Digital Marketing & AI Services Agency`,
    template: `%s | ${SITE_CONFIG.name}`,
  },
  alternates: {
    canonical: "https://buzingbee.com/",
  },
  description:
    "BuzingBee is a digital marketing and AI services agency. We help businesses grow with web development, mobile apps, SEO, paid ads, and AI-powered automation.",
  metadataBase: new URL(SITE_CONFIG.url),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_CONFIG.url,
    siteName: SITE_CONFIG.name,
    title: `${SITE_CONFIG.name} — Digital Marketing & AI Services Agency`,
    description:
      "BuzingBee is a leading digital marketing and AI services agency helping businesses grow with intelligent solutions.",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_CONFIG.name} — Digital Marketing & AI Services Agency`,
    description:
      "BuzingBee is a digital marketing and AI services agency.",
    images: ["/og-image.png"],
  },
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
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_CONFIG.url}/#organization`,
      name: SITE_CONFIG.name,
      url: SITE_CONFIG.url,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_CONFIG.url}/android-chrome-512x512.png`,
        width: 512,
        height: 512,
      },
      image: `${SITE_CONFIG.url}/og-image.png`,
      description:
        "BuzingBee provides digital marketing services and AI services to help businesses grow.",
      email: SITE_CONFIG.email,
      knowsAbout: [
        "SEO",
        "AI SEO",
        "LLM SEO",
        "Generative Engine Optimization",
        "Answer Engine Optimization",
        "Local SEO",
        "AI automation",
        "AI chatbot development",
        "Google Ads",
        "Meta Ads",
        "Social media marketing",
        "Performance marketing",
        "Web development",
        "Web application development",
        "Mobile app development",
      ],
      sameAs: Object.values(SITE_CONFIG.socials),
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer service",
        telephone: SITE_CONFIG.phone,
        email: SITE_CONFIG.email,
        areaServed: "Worldwide",
        availableLanguage: ["English", "Hindi"],
      },
      address: {
        "@type": "PostalAddress",
        streetAddress: "01, Bank Rd, Bank More",
        addressLocality: "Dhanbad",
        addressRegion: "Jharkhand",
        postalCode: "826007",
        addressCountry: "IN",
      },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_CONFIG.url}/#website`,
      name: SITE_CONFIG.name,
      url: SITE_CONFIG.url,
      description: "Digital marketing services and AI services to grow your business online.",
      publisher: { "@id": `${SITE_CONFIG.url}/#organization` },
      hasPart: [
        {
          "@type": ["WebPage", "SiteNavigationElement"],
          "@id": `${SITE_CONFIG.url}/#home`,
          name: "Home",
          url: `${SITE_CONFIG.url}/`,
          isPartOf: { "@id": `${SITE_CONFIG.url}/#website` },
        },
        // main sections, so search engines see them as the site's key pages
        ...[
          ["Shopify Stores", "/services/shopify-development"],
          ["Performance Marketing", "/services/performance-marketing"],
          ["AI Automation", "/services/ai-automation"],
          ["Our Services", "/services"],
          ["Pricing Plans", "/pricing"],
          ["Our Portfolio", "/portfolio"],
          ["Our Blog", "/blog"],
          ["Contact Us", "/contact"],
        ].map(([name, path]) => ({
          "@type": ["WebPage", "SiteNavigationElement"],
          "@id": `${SITE_CONFIG.url}${path}#page`,
          name,
          url: `${SITE_CONFIG.url}${path}`,
          isPartOf: { "@id": `${SITE_CONFIG.url}/#website` },
        })),
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={generalSans.variable}>
      <head>
        {/* light by default; apply a saved "dark" choice before first paint so it never flashes light */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem("theme")==="dark")document.documentElement.classList.add("dark")}catch(e){}`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className="font-body antialiased overflow-x-hidden">
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
        <ChatWidget />
        <PageViewTracker />
      </body>
    </html>
  );
}
