import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing Plans — Affordable Website & Marketing Packages",
  description:
    "Choose from our flexible pricing plans: Basic, Standard, and Premium. Get a professional website with domain, hosting, SEO, and more starting at ₹9,999.",
  keywords: [
    "pricing plans",
    "digital marketing pricing",
    "website package cost",
    "startup pricing",
    "BuzingBee pricing",
  ],
  alternates: {
    canonical: "/pricing",
  },
  openGraph: {
    title: "Pricing Plans — Affordable Website & Marketing Packages",
    description:
      "Compare BuzingBee subscription and project-based pricing plans for marketing, development, and AI services.",
    url: "/pricing",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pricing Plans — Affordable Website & Marketing Packages",
    description:
      "Compare BuzingBee subscription and project-based pricing plans for marketing, development, and AI services.",
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
