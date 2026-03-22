import { Eye, Target } from "lucide-react";

const cards = [
  {
    title: "Our Mission",
    icon: Target,
    description:
      "Help businesses grow with clear strategy, fast execution, and measurable digital systems that actually compound over time.",
  },
  {
    title: "Our Vision",
    icon: Eye,
    description:
      "Become the go-to AI-first growth partner for brands that want smarter marketing, stronger products, and scalable operations.",
  },
];

export default function MissionVision() {
  return (
    <section className="section-padding bg-bgSection">
      <div className="container-max grid gap-6 md:grid-cols-2">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="rounded-[28px] border border-border bg-white p-8 md:p-10 shadow-[0_20px_50px_rgba(31,27,18,0.04)]"
            >
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                <Icon className="w-7 h-7" />
              </div>
              <h2 className="mt-6 text-3xl font-bold text-textHeading font-heading">
                {card.title}
              </h2>
              <p className="mt-4 text-textBody leading-relaxed">
                {card.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
