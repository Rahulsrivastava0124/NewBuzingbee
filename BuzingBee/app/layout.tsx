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
});
 

export const metadata: Metadata = {
  title: {
    default: `${SITE_CONFIG.name} — Digital Marketing & AI Services Agency`,
    template: `%s | ${SITE_CONFIG.name}`,
  },
  alternates: {
    canonical: "/",
  },
  description:
    "BuzingBee is a leading digital marketing and AI services agency. We help businesses grow with web development, mobile apps, SEO, paid ads, and AI-powered automation.",
  keywords: [
    "digital marketing agency",
    "dhanbad degital marketing agency",
    "dhanbad digital marketing agency",
    "digital marketing agency in dhanbad",
    "best digital marketing agency in dhanbad",
    "digital marketing company in dhanbad",
    "seo agency in dhanbad",
    "google ads agency",
    "meta ads agency",
    "social media marketing agency",
    "AI services",
    "AI SEO",
    "LLM SEO",
    "Generative Engine Optimization",
    "Answer Engine Optimization",
    "AEO services",
    "LLM optimization",
    "google ai overview optimization",
    "AI automation services",
    "AI chatbot development",
    "GEO services",
    "web development",
    "website development services",
    "web application development",
    "app development services",
    "website development company",
    "mobile app development",
    "mobile app development company",
    "android app development",
    "ios app development",
    "SEO services",
    "Google Ads",
    "social media marketing",
    "BuzingBee",
  ],
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
      "BuzingBee is a leading digital marketing and AI services agency.",
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
    icon: "/bee1-removebg-preview.png",
    apple: "/bee1-removebg-preview.png",
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
        url: `${SITE_CONFIG.url}/bee1-removebg-preview.png`,
      },
      image: `${SITE_CONFIG.url}/og-image.png`,
      description:
        "BuzingBee provides digital marketing services and AI services to help businesses grow.",
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
        areaServed: "Worldwide",
      },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_CONFIG.url}/#website`,
      name: SITE_CONFIG.name,
      url: SITE_CONFIG.url,
      publisher: { "@id": `${SITE_CONFIG.url}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${SITE_CONFIG.url}/?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
      hasPart: [
        {
          "@type": ["WebPage", "SiteNavigationElement"],
          "@id": `${SITE_CONFIG.url}/#home`,
          name: "Home",
          url: `${SITE_CONFIG.url}/`,
          isPartOf: { "@id": `${SITE_CONFIG.url}/#website` },
        },
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
        {/* apply the saved (or system) theme before first paint, so dark mode never flashes light */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`,
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
