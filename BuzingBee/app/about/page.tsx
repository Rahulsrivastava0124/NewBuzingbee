import type { Metadata } from "next";
import {
  AboutCTA,
  AboutHero,
  MissionVision,
  OurStory,
  TeamSection,
  Timeline,
  WhyUs,
} from "@/components/about";

export const metadata: Metadata = {
  title: "About BuzingBee — Story, Mission, Team & Process",
  description:
    "Explore BuzingBee's story, mission, team, and modern process for building digital products, performance marketing systems, and AI-first growth solutions.",
  keywords: [
    "about BuzingBee",
    "digital agency team",
    "AI-first agency",
    "marketing and development company",
    "BuzingBee story",
  ],
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About BuzingBee — Story, Mission, Team & Process",
    description:
      "Meet the team and story behind BuzingBee's digital marketing, development, and AI-first growth services.",
    url: "/about",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "About BuzingBee — Story, Mission, Team & Process",
    description:
      "Meet the team and story behind BuzingBee's digital marketing, development, and AI-first growth services.",
  },
};

export default function AboutPage() {
  return (
    <>
      <AboutHero />
      <OurStory />
      <MissionVision />
      <TeamSection />
      <WhyUs />
      <Timeline />
      <AboutCTA />
    </>
  );
}
