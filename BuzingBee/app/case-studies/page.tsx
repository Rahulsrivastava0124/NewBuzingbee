import type { Metadata } from "next";
import CaseStudyCard from "@/components/CaseStudyCard";
import { fetchCaseStudyCards } from "@/lib/caseStudy";
import { SITE_CONFIG } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Case Studies — Real Results for Real Businesses",
  description:
    "Explore how BuzingBee has helped businesses grow with digital marketing, web development, SEO, and AI-driven strategies. Real clients, real results.",
  keywords: [
    "case studies",
    "digital marketing results",
    "BuzingBee success stories",
    "client results",
    "SEO case study",
    "web development case study",
  ],
  alternates: { canonical: "/case-studies" },
  openGraph: {
    title: "Case Studies — Real Results for Real Businesses",
    description:
      "See how BuzingBee delivers measurable growth for clients across industries.",
    url: "/case-studies",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Case Studies — Real Results for Real Businesses",
    description:
      "See how BuzingBee delivers measurable growth for clients across industries.",
    images: ["/og-image.png"],
  },
  robots: { index: true, follow: true },
};

export default async function CaseStudiesPage() {
  let items: Awaited<ReturnType<typeof fetchCaseStudyCards>> = [];

  try {
    items = await fetchCaseStudyCards();
  } catch (err) {
    console.error("[CaseStudiesPage] Failed to fetch case studies:", err);
    items = [];
  }

  const schemaData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "BuzingBee Case Studies",
    description:
      "Real-world results delivered for clients through digital marketing and technology solutions.",
    url: `${SITE_CONFIG.url}/case-studies`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: items.map((cs, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE_CONFIG.url}/case-studies/${cs.slug}`,
        name: cs.title,
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      {/* Hero */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
        <div className="absolute top-10 right-10 w-72 h-72 bg-accent/10 rounded-full blur-[120px]" />
        <div className="container-max relative z-10">
          <span className="inline-block bg-accent/10 text-accent text-sm font-semibold px-4 py-1.5 rounded-full mb-4 border border-accent/20">
            Proven Results
          </span>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-textHeading font-heading">
            Our <span className="text-accent">Case Studies</span>
          </h1>
          <p className="mt-4 text-textBody max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
            Real stories of growth, transformation, and measurable success. See
            how we&apos;ve helped businesses across industries achieve their
            goals.
          </p>
        </div>
      </section>

      {/* Grid */}
      <section className="section-padding pt-4">
        <div className="container-max">
          {items.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-textMuted text-lg">
                Case studies coming soon. Check back shortly!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {items.map((cs, i) => (
                <CaseStudyCard
                  key={cs.id}
                  title={cs.title}
                  slug={cs.slug}
                  client={cs.client}
                  industry={cs.industry}
                  summary={cs.summary}
                  image={cs.image}
                  category={cs.category}
                  metrics={cs.metrics}
                  index={i}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
