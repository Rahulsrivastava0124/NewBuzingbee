import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, Check } from "lucide-react";
import { SERVICE_PAGES, getServicePage } from "@/lib/servicePages";
import { SITE_CONFIG } from "@/lib/constants";
import { canonicalForPath } from "@/lib/seo";

// only the slugs listed in lib/servicePages.ts exist; anything else is a 404
export const dynamicParams = false;

export function generateStaticParams() {
  return SERVICE_PAGES.map((p) => ({ slug: p.slug }));
}

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const page = getServicePage(slug);
  if (!page) return {};
  const path = `/services/${page.slug}`;
  return {
    // absolute: the services layout's own title stops the root "%s | BuzingBee" template
    title: { absolute: `${page.metaTitle} | ${SITE_CONFIG.name}` },
    description: page.metaDescription,
    keywords: page.keywords,
    alternates: { canonical: path },
    openGraph: {
      title: page.metaTitle,
      description: page.metaDescription,
      url: path,
      type: "website",
      images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: page.metaTitle,
      description: page.metaDescription,
    },
  };
}

export default async function ServiceLandingPage({ params }: Params) {
  const { slug } = await params;
  const page = getServicePage(slug);
  if (!page) notFound();

  const url = canonicalForPath(`/services/${page.slug}`);
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        "@id": `${url}#service`,
        name: page.name,
        serviceType: page.name,
        description: page.metaDescription,
        url,
        provider: { "@id": `${SITE_CONFIG.url}/#organization` },
        areaServed: "Worldwide",
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: page.name,
          itemListElement: page.offerings.map((o) => ({
            "@type": "Offer",
            itemOffered: { "@type": "Service", name: o.title, description: o.desc },
          })),
        },
      },
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        mainEntity: page.faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: canonicalForPath("/") },
          { "@type": "ListItem", position: 2, name: "Services", item: canonicalForPath("/services") },
          { "@type": "ListItem", position: 3, name: page.name, item: url },
        ],
      },
    ],
  };

  const others = SERVICE_PAGES.filter((p) => p.slug !== page.slug);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* Hero */}
      <section className="bg-paper px-4 pb-16 pt-36 sm:px-6 lg:px-12 lg:pt-44">
        <div className="mx-auto max-w-[1100px]">
          <nav aria-label="Breadcrumb" className="mb-6 text-sm text-slate">
            <Link href="/" className="hover:text-ink">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/services" className="hover:text-ink">Services</Link>
            <span className="mx-2">/</span>
            <span className="text-ink">{page.name}</span>
          </nav>
          <p className="mb-4 inline-flex rounded-full bg-[#fdb905]/20 px-4 py-1.5 text-sm font-semibold text-ink">
            {page.eyebrow}
          </p>
          <h1 className="max-w-[20ch] text-[34px] font-semibold leading-[1.15] tracking-[-0.02em] text-ink sm:text-[48px]">
            {page.heading}
          </h1>
          <p className="mt-6 max-w-[60ch] text-lg leading-relaxed text-slate">{page.intro}</p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/contact" className="btn-honey">
              Get a free consultation
              <ArrowUpRight className="h-5 w-5" />
            </Link>
            <Link href="/pricing" className="btn-light">
              View pricing
            </Link>
          </div>
        </div>
      </section>

      {/* What we do */}
      <section className="bg-comb/50 px-4 py-20 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-[1100px]">
          <h2 className="text-[28px] font-semibold tracking-[-0.02em] text-ink sm:text-[36px]">
            What we do
          </h2>
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {page.offerings.map((o) => (
              <li key={o.title} className="rounded-card border border-ink/10 bg-surface p-6">
                <h3 className="flex items-start gap-3 text-lg font-semibold text-ink">
                  <Check className="mt-1 h-5 w-5 shrink-0 text-[#fdb905]" aria-hidden="true" />
                  {o.title}
                </h3>
                <p className="mt-2 pl-8 leading-relaxed text-slate">{o.desc}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Process */}
      <section className="bg-paper px-4 py-20 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-[1100px]">
          <h2 className="text-[28px] font-semibold tracking-[-0.02em] text-ink sm:text-[36px]">
            How we work
          </h2>
          <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {page.process.map((step, i) => (
              <li key={step.title} className="border-t-2 border-[#fdb905] pt-4">
                <span className="text-sm font-semibold text-slate">Step {i + 1}</span>
                <h3 className="mt-1 text-lg font-semibold text-ink">{step.title}</h3>
                <p className="mt-2 leading-relaxed text-slate">{step.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-comb/50 px-4 py-20 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-[800px]">
          <h2 className="text-[28px] font-semibold tracking-[-0.02em] text-ink sm:text-[36px]">
            Frequently asked questions
          </h2>
          <div className="mt-8 divide-y divide-ink/10 rounded-card border border-ink/10 bg-surface">
            {page.faqs.map((f) => (
              <details key={f.q} className="group p-6">
                <summary className="cursor-pointer list-none text-lg font-semibold text-ink">
                  {f.q}
                </summary>
                <p className="mt-3 leading-relaxed text-slate">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA + related */}
      <section className="bg-paper px-4 py-20 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-[1100px] rounded-card bg-[#0b0d14] p-8 text-white sm:p-12">
          <h2 className="text-[26px] font-semibold sm:text-[32px]">Ready to talk about {page.name.toLowerCase()}?</h2>
          <p className="mt-3 max-w-[55ch] text-white/70">
            Book a free one-to-one consultation. We will look at where you are today and suggest the next steps.
          </p>
          <Link href="/contact" className="btn-honey mt-6">
            Book a free call
            <ArrowUpRight className="h-5 w-5" />
          </Link>
        </div>
        <div className="mx-auto mt-12 max-w-[1100px]">
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-slate">More services</p>
          <ul className="mt-4 flex flex-wrap gap-3">
            {others.map((o) => (
              <li key={o.slug}>
                <Link
                  href={`/services/${o.slug}`}
                  className="inline-flex rounded-full border border-ink/15 px-4 py-2 text-sm font-medium text-ink hover:border-[#fdb905]"
                >
                  {o.name}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/services"
                className="inline-flex rounded-full border border-ink/15 px-4 py-2 text-sm font-medium text-ink hover:border-[#fdb905]"
              >
                All services
              </Link>
            </li>
          </ul>
        </div>
      </section>
    </>
  );
}
