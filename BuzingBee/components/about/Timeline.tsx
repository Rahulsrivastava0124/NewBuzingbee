import SectionHeading from "@/components/SectionHeading";

const phases = [
  {
    step: "01",
    title: "Discover",
    description:
      "We align on goals, audience, offers, and the fastest route to traction.",
  },
  {
    step: "02",
    title: "Design",
    description:
      "We shape the message, experience, and conversion path before launch.",
  },
  {
    step: "03",
    title: "Build",
    description:
      "Our team executes web, content, campaigns, and automation in sync.",
  },
  {
    step: "04",
    title: "Scale",
    description:
      "We optimize what works, expand channels, and systemize future growth.",
  },
];

export default function Timeline() {
  return (
    <section className="section-padding">
      <div className="container-max">
        <SectionHeading
          title="How We Work"
          subtitle="A focused timeline that keeps projects simple, transparent, and outcome-driven."
        />
        <div className="grid gap-6 lg:grid-cols-4">
          {phases.map((phase, index) => (
            <div
              key={phase.step}
              className="relative rounded-[24px] border border-border bg-card p-6 md:p-7"
            >
              <div className="text-sm font-bold tracking-[0.2em] text-accent">
                {phase.step}
              </div>
              <h3 className="mt-4 text-2xl font-bold text-textHeading font-heading">
                {phase.title}
              </h3>
              <p className="mt-3 text-textMuted leading-relaxed">
                {phase.description}
              </p>
              {index < phases.length - 1 && (
                <div className="hidden lg:block absolute top-10 -right-3 w-6 h-[2px] bg-accent/40" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
