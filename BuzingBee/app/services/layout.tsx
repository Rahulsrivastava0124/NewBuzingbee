import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Services — Development, Marketing, AI, LLM SEO & GEO",
  description:
    "Explore BuzingBee services: website development, web application development, mobile app development, digital marketing, paid ads, AI automation, LLM SEO, AI SEO, and GEO strategies for business growth.",
  keywords: [
    "digital marketing services",
    "dhanbad degital marketing agency",
    "dhanbad digital marketing agency",
    "digital marketing agency in dhanbad",
    "best digital marketing agency in dhanbad",
    "digital marketing company in dhanbad",
    "seo agency in dhanbad",
    "local seo services dhanbad",
    "google ads agency dhanbad",
    "meta ads agency dhanbad",
    "social media marketing agency dhanbad",
    "web development services",
    "website development services",
    "web application development services",
    "app development services",
    "mobile app development company",
    "android app development services",
    "ios app development services",
    "website development company",
    "website design agency",
    "ecommerce website development",
    "landing page design services",
    "mobile app development services",
    "AI services",
    "AI automation services",
    "AI chatbot development",
    "whatsapp chatbot automation",
    "lead generation automation",
    "LLM SEO services",
    "AI SEO services",
    "Generative Engine Optimization",
    "Answer Engine Optimization",
    "AEO services",
    "GEO agency",
    "LLM optimization agency",
    "chatgpt seo optimization",
    "google ai overview optimization",
    "content marketing services",
    "performance marketing services",
    "branding and marketing services",
    "GEO services",
    "BuzingBee services",
  ],
  alternates: {
    canonical: "/services",
  },
  openGraph: {
    title: "Services — Development, Marketing, AI, LLM SEO & GEO",
    description:
      "Explore BuzingBee services across website development, web app development, mobile app development, digital marketing, AI automation, LLM SEO, AI SEO, and generative engine optimization.",
    url: "/services",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Services — Development, Marketing, AI, LLM SEO & GEO",
    description:
      "Explore BuzingBee services across website development, web app development, mobile app development, digital marketing, AI automation, LLM SEO, AI SEO, and generative engine optimization.",
  },
};

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
