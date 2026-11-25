import Link from "next/link";
import type { ReactNode } from "react";
import { SITE_CONFIG } from "@/lib/constants";

export type LegalSection = {
  id: string;
  title: string;
  body: ReactNode;
};

export const LEGAL_LINKS = [
  { label: "Terms & Conditions", href: "/terms-and-conditions" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Refund Policy", href: "/refund-policy" },
  { label: "Cookie Policy", href: "/cookie-policy" },
];

type Props = {
  title: string;
  intro: ReactNode;
  lastUpdated: string;
  sections: LegalSection[];
  currentHref: string;
};

export default function LegalPage({
  title,
  intro,
  lastUpdated,
  sections,
  currentHref,
}: Props) {
  return (
    <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="container-max">
        <header className="max-w-3xl">
          <p className="text-sm font-semibold text-accent">Legal</p>
          <h1 className="heading-page mt-3">{title}</h1>
          <p className="mt-3 text-sm text-textMuted">
            Last updated: {lastUpdated}
          </p>
          <div className="mt-5 text-base md:text-lg leading-relaxed text-textBody">
            {intro}
          </div>
        </header>

        <div className="mt-12 grid gap-10 lg:grid-cols-[240px_1fr]">
          <aside className="lg:sticky lg:top-28 self-start space-y-8">
            <nav aria-label="On this page">
              <p className="text-xs font-semibold uppercase tracking-wider text-textMuted mb-3">
                On this page
              </p>
              <ol className="space-y-2 text-sm">
                {sections.map((s, i) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className="text-textBody hover:text-accent transition-colors"
                    >
                      {i + 1}. {s.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
            <nav aria-label="Legal pages">
              <p className="text-xs font-semibold uppercase tracking-wider text-textMuted mb-3">
                Policies
              </p>
              <ul className="space-y-2 text-sm">
                {LEGAL_LINKS.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      aria-current={l.href === currentHref ? "page" : undefined}
                      className={
                        l.href === currentHref
                          ? "font-semibold text-accent"
                          : "text-textBody hover:text-accent transition-colors"
                      }
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          <article
            className="max-w-3xl space-y-10 text-textBody leading-relaxed
              [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2
              [&_a]:text-accent [&_a:hover]:underline [&_strong]:text-textHeading"
          >
            {sections.map((s, i) => (
              <section key={s.id} id={s.id} className="scroll-mt-28">
                <h2 className="text-xl md:text-2xl font-bold font-heading text-textHeading">
                  {i + 1}. {s.title}
                </h2>
                {s.body}
              </section>
            ))}

            <section className="rounded-card border border-border bg-card p-6">
              <h2 className="text-lg font-bold font-heading text-textHeading">
                Questions?
              </h2>
              <p>
                Write to us at{" "}
                <a href={`mailto:${SITE_CONFIG.email}`}>{SITE_CONFIG.email}</a>,
                call <a href={`tel:${SITE_CONFIG.phone}`}>{SITE_CONFIG.phone}</a>,
                or use our <Link href="/contact">contact page</Link>. We usually
                reply within 2 working days.
              </p>
            </section>
          </article>
        </div>
      </div>
    </section>
  );
}

export const legalMetadata = (title: string, description: string, path: string) => ({
  title,
  description,
  alternates: { canonical: path },
  openGraph: {
    title: `${title} | ${SITE_CONFIG.name}`,
    description,
    url: path,
    type: "website" as const,
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: `${title} | ${SITE_CONFIG.name}`,
    description,
  },
});
