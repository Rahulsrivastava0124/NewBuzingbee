import {
  Bot,
  Gauge,
  Layers3,
  MessageSquareMore,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import SectionHeading from "@/components/SectionHeading";

const reasons = [
  {
    title: "AI-first delivery",
    description:
      "We use automation and AI where it improves speed, insight, and consistency.",
    icon: Bot,
  },
  {
    title: "One integrated team",
    description:
      "Marketing, design, development, and optimization stay aligned from day one.",
    icon: Layers3,
  },
  {
    title: "Performance mindset",
    description:
      "Every engagement is tied to business outcomes, not vanity metrics.",
    icon: Gauge,
  },
  {
    title: "Clear communication",
    description:
      "You always know what is being built, why it matters, and what happens next.",
    icon: MessageSquareMore,
  },
  {
    title: "Reliable execution",
    description:
      "We keep scope realistic, timelines practical, and quality consistently high.",
    icon: ShieldCheck,
  },
  {
    title: "Built to scale",
    description:
      "Our systems are designed to grow with your campaigns, product, and team.",
    icon: Sparkles,
  },
];

export default function WhyUs() {
  return (
    <section className="section-padding bg-bgSection">
      <div className="container-max">
        <SectionHeading
          title="Why Choose Us"
          subtitle="Simple processes, modern tooling, and a team that treats your growth like a shared mission."
        />
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {reasons.map((reason) => {
            const Icon = reason.icon;
            return (
              <div
                key={reason.title}
                className="rounded-[24px] border border-border bg-white p-6 md:p-7"
              >
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="mt-5 text-xl font-bold text-textHeading font-heading">
                  {reason.title}
                </h3>
                <p className="mt-3 text-textMuted leading-relaxed">
                  {reason.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
