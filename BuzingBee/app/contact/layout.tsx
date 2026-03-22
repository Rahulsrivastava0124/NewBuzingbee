import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us — Get a Free Quote",
  description:
    "Contact BuzingBee for digital marketing, web development, and AI services. Fill out our form or call us to get a free quote for your project.",
  keywords: [
    "contact BuzingBee",
    "get a free quote",
    "digital agency contact",
    "web development quote",
    "marketing consultation",
  ],
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact Us — Get a Free Quote",
    description:
      "Reach out to BuzingBee for development, marketing, AI, and growth services. Get a free quote for your project.",
    url: "/contact",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Us — Get a Free Quote",
    description:
      "Reach out to BuzingBee for development, marketing, AI, and growth services. Get a free quote for your project.",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
