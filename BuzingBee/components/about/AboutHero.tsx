import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export default function AboutHero() {
  return (
    <section className="pt-32 pb-16 md:pb-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute -top-10 left-0 w-72 h-72 rounded-full bg-accent/10 blur-[120px]" />
      <div className="absolute top-24 right-0 w-80 h-80 rounded-full bg-accent/10 blur-[140px]" />
      <div className="container-max relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-4 py-2 text-sm font-semibold text-accent">
            <Sparkles className="w-4 h-4" />
            Built for modern growth
          </div>
          <h1 className="mt-6 text-3xl md:text-5xl lg:text-6xl font-bold text-textHeading font-heading leading-tight">
            We build brands, products, and growth systems that move faster.
          </h1>
          <p className="mt-5 max-w-2xl mx-auto text-base md:text-lg leading-relaxed text-textBody">
            BuzingBee combines strategy, creative execution, and AI-first
            delivery to help startups, SMEs, and scaling teams turn ideas into
            measurable business growth.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact" className="btn-primary gap-2">
              Connect With Us <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/portfolio" className="btn-outline gap-2">
              See Our Work
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              ["500+", "Projects shipped"],
              ["200+", "Clients supported"],
              ["98%", "Satisfaction rate"],
            ].map(([value, label]) => (
              <div
                key={label}
                className="rounded-2xl border border-border bg-card px-5 py-4"
              >
                <div className="text-2xl font-bold font-numeric text-textHeading">
                  {value}
                </div>
                <div className="mt-1 text-sm text-textMuted">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
