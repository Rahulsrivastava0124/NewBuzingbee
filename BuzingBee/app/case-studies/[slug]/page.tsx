import type { Metadata } from "next";
import { ArrowLeft, Building2, Tag, TrendingUp } from "lucide-react";
import Link from "next/link";
import { fetchCaseStudyBySlug, fetchCaseStudyCards } from "@/lib/caseStudy";
import type { CaseStudyCardItem } from "@/lib/caseStudy";
import { SITE_CONFIG } from "@/lib/constants";
import { canonicalForPath, resolveCmsCanonical } from "@/lib/seo";

const toTitleFromSlug = (slug = "") =>
  slug
    .split("-")
    .filter(Boolean)
    .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

const sanitizeHtml = (html = "") =>
  html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+=("[^"]*"|'[^']*')/gi, "")
    .replace(/javascript:/gi, "");

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const cs = await fetchCaseStudyBySlug(slug);

  const title = cs?.seoTitle || cs?.title || toTitleFromSlug(slug);
  const description =
    cs?.seoDescription || cs?.summary || "Read this case study.";
  const image = cs?.image || "/og-image.png";
  const canonicalPath = `/case-studies/${slug}`;
  const canonicalUrl = resolveCmsCanonical(cs?.canonicalUrl, canonicalPath);

  return {
    title,
    description,
    keywords: cs?.seoKeywords,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      type: "article",
      url: canonicalUrl,
      images: [{ url: image }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function CaseStudyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [cs, allCards] = await Promise.all([
    fetchCaseStudyBySlug(slug),
    fetchCaseStudyCards().catch(
      (): CaseStudyCardItem[] => [] as CaseStudyCardItem[],
    ),
  ]);

  const title = cs?.title || toTitleFromSlug(slug);
  const image = cs?.image || "";
  const related = allCards.filter((c) => c.slug !== slug).slice(0, 3);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: cs?.summary || "",
    image: image || `${SITE_CONFIG.url}/og-image.png`,
    url: canonicalForPath(`/case-studies/${slug}`),
    author: { "@type": "Organization", name: SITE_CONFIG.name },
    publisher: {
      "@type": "Organization",
      name: SITE_CONFIG.name,
      logo: { "@type": "ImageObject", url: `${SITE_CONFIG.url}/logo.png` },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="container-max">
          <div className="mx-auto max-w-4xl">
            {/* Back */}
            <div className="mb-8">
              <Link
                href="/case-studies"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-bgSection px-4 py-2 text-sm font-medium text-textBody transition-all hover:border-accent/40 hover:text-accent"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Case Studies
              </Link>
            </div>

            {/* Header */}
            <header className="mb-10">
              <div className="flex flex-wrap gap-3 mb-4">
                {cs?.category && (
                  <span className="bg-accent text-bgPrimary text-xs font-bold px-3 py-1 rounded-full">
                    {cs.category}
                  </span>
                )}
                {cs?.industry && (
                  <span className="flex items-center gap-1 bg-bgSection border border-border text-textMuted text-xs font-medium px-3 py-1 rounded-full">
                    <Tag className="w-3 h-3" />
                    {cs.industry}
                  </span>
                )}
              </div>

              <h1 className="heading-page mb-4">
                {title}
              </h1>

              {cs?.client && (
                <div className="flex items-center gap-2 text-textMuted text-sm">
                  <Building2 className="w-4 h-4" />
                  <span>
                    Client:{" "}
                    <strong className="text-textBody">{cs.client}</strong>
                  </span>
                </div>
              )}

              {cs?.summary && (
                <p className="mt-4 text-textBody text-base md:text-lg leading-relaxed">
                  {cs.summary}
                </p>
              )}
            </header>

            {/* Hero Image */}
            {image && (
              <div className="rounded-2xl overflow-hidden mb-10 border border-border">
                <img
                  src={image}
                  alt={title}
                  className="w-full h-64 md:h-96 object-cover"
                  loading="eager"
                />
              </div>
            )}

            {/* Key Metrics */}
            {cs?.metrics && cs.metrics.length > 0 && (
              <div className="bg-bgSection border border-border rounded-2xl p-6 md:p-8 mb-10">
                <div className="flex items-center gap-2 mb-6">
                  <TrendingUp className="w-5 h-5 text-accent" />
                  <h2 className="text-lg font-bold text-textHeading font-heading">
                    Key Results
                  </h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {cs.metrics.map((m, i) => (
                    <div
                      key={i}
                      className="bg-card border border-accent/20 rounded-xl p-4 text-center"
                    >
                      <div className="text-2xl md:text-3xl font-bold text-accent mb-1">
                        {m.value}
                      </div>
                      <div className="text-textMuted text-xs">{m.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Challenge */}
            {cs?.challenge && (
              <div className="mb-10">
                <h2 className="heading-sub mb-4 pb-2 border-b border-border">
                  🎯 The Challenge
                </h2>
                <div
                  className="prose prose-invert prose-sm md:prose-base max-w-none
                    prose-headings:text-textHeading prose-headings:font-heading
                    prose-p:text-textBody prose-p:leading-relaxed
                    prose-strong:text-textHeading prose-a:text-accent
                    prose-blockquote:border-accent prose-blockquote:text-textMuted
                    prose-li:text-textBody prose-code:text-accent"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtml(cs.challenge),
                  }}
                />
              </div>
            )}

            {/* Solution */}
            {cs?.solution && (
              <div className="mb-10">
                <h2 className="heading-sub mb-4 pb-2 border-b border-border">
                  💡 Our Solution
                </h2>
                <div
                  className="prose prose-invert prose-sm md:prose-base max-w-none
                    prose-headings:text-textHeading prose-headings:font-heading
                    prose-p:text-textBody prose-p:leading-relaxed
                    prose-strong:text-textHeading prose-a:text-accent
                    prose-blockquote:border-accent prose-blockquote:text-textMuted
                    prose-li:text-textBody prose-code:text-accent"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtml(cs.solution),
                  }}
                />
              </div>
            )}

            {/* Results */}
            {cs?.results && (
              <div className="mb-10">
                <h2 className="heading-sub mb-4 pb-2 border-b border-border">
                  🚀 Results & Outcomes
                </h2>
                <div
                  className="prose prose-invert prose-sm md:prose-base max-w-none
                    prose-headings:text-textHeading prose-headings:font-heading
                    prose-p:text-textBody prose-p:leading-relaxed
                    prose-strong:text-textHeading prose-a:text-accent
                    prose-blockquote:border-accent prose-blockquote:text-textMuted
                    prose-li:text-textBody prose-code:text-accent"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(cs.results) }}
                />
              </div>
            )}

            {/* Tags */}
            {cs?.tags && cs.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-12">
                {cs.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-bgSection border border-border text-textMuted text-xs px-3 py-1 rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* CTA */}
            <div className="bg-accent/10 border border-accent/20 rounded-2xl p-8 text-center mb-16">
              <h3 className="text-2xl font-bold text-textHeading font-heading mb-3">
                Want Similar Results for Your Business?
              </h3>
              <p className="text-textMuted mb-6">
                Let&apos;s talk about how BuzingBee can help you grow.
              </p>
              <Link
                href="/contact"
                className="btn-primary gap-2"
              >
                Get a Free Consultation
              </Link>
            </div>

            {/* Related */}
            {related.length > 0 && (
              <div>
                <h2 className="heading-sub mb-6">
                  More Case Studies
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {related.map((item, i) => (
                    <Link
                      key={item.id}
                      href={`/case-studies/${item.slug}`}
                      className="bg-card border border-border rounded-xl p-5 hover:border-accent/40 transition-all group"
                    >
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-32 object-cover rounded-lg mb-3"
                          loading="lazy"
                        />
                      )}
                      <span className="text-accent text-xs font-bold">
                        {item.category}
                      </span>
                      <h4 className="text-textHeading font-semibold text-sm mt-1 group-hover:text-accent transition-colors line-clamp-2">
                        {item.title}
                      </h4>
                      {item.client && (
                        <p className="text-textMuted text-xs mt-1">
                          {item.client}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
