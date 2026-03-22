import Image from "next/image";
import SectionHeading from "@/components/SectionHeading";

export default function OurStory() {
  return (
    <section className="section-padding">
      <div className="container-max grid gap-10 lg:grid-cols-[0.95fr_1.05fr] items-center">
        <div className="relative">
          <div className="relative overflow-hidden rounded-[28px] border border-border bg-card aspect-[4/4.5]">
            <Image
              src="https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80"
              alt="Team discussing strategy"
              fill
              className="object-cover"
            />
          </div>
          <div className="absolute -bottom-6 right-4 sm:right-6 rounded-2xl border border-border bg-white px-5 py-4 shadow-xl">
            <div className="text-xl font-bold text-textHeading font-heading">
              One partner
            </div>
            <div className="text-sm text-textMuted mt-1">
              Strategy, design, tech, growth
            </div>
          </div>
        </div>

        <div>
          <SectionHeading
            align="left"
            title="Our Story"
            subtitle="Built to replace fragmented agency workflows with one smart, accountable team."
          />
          <div className="space-y-5 text-textBody leading-relaxed">
            <p>
              BuzingBee started with a simple belief: ambitious businesses
              should not have to manage separate vendors for marketing, design,
              development, and automation just to get real momentum.
            </p>
            <p>
              We brought those capabilities together into one agile team that
              can move from idea to launch quickly, while keeping strategy,
              execution, and measurement tightly aligned.
            </p>
            <p>
              Today, we help clients launch modern websites, run performance
              campaigns, improve SEO, and deploy AI-powered systems that save
              time and increase conversion.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
