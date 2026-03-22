import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portfolio — Our Work & Case Studies",
  description:
    "See the projects BuzingBee has delivered: websites, mobile apps, e-commerce stores, brand identities, and digital marketing campaigns.",
  keywords: [
    "portfolio",
    "case studies",
    "website projects",
    "marketing case studies",
    "BuzingBee portfolio",
  ],
  alternates: {
    canonical: "/portfolio",
  },
  openGraph: {
    title: "Portfolio — Our Work & Case Studies",
    description:
      "Explore BuzingBee case studies, portfolio work, and real project outcomes across design, development, and marketing.",
    url: "/portfolio",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Portfolio — Our Work & Case Studies",
    description:
      "Explore BuzingBee case studies, portfolio work, and real project outcomes across design, development, and marketing.",
  },
};

export default function PortfolioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
