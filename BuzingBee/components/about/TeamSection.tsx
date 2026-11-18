import Image from "next/image";
import SectionHeading from "@/components/SectionHeading";

const team = [
  {
    name: "Strategy & Growth",
    role: "Performance planning, funnels, SEO and paid media alignment.",
    image: "/assets/image/objective_pic_2.jpg",
  },
  {
    name: "Creative & Brand",
    role: "Messaging, social creatives, campaigns, and polished visual systems.",
    image: "/assets/image/objective_pic_3.png",
  },
  {
    name: "Product & Engineering",
    role: "Web, app, automation, and AI workflows built for speed and scale.",
    image: "/assets/image/objective_pic_4.jpg",
  },
];

export default function TeamSection() {
  return (
    <section className="section-padding">
      <div className="container-max">
        <SectionHeading
          title="Our Team"
          subtitle="A cross-functional crew that thinks strategically, designs clearly, and ships fast."
        />
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {team.map((member) => (
            <div
              key={member.name}
              className="overflow-hidden rounded-[28px] border border-border bg-card group"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={member.image}
                  alt={member.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-6 md:p-7">
                <h3 className="text-2xl font-bold text-textHeading font-heading">
                  {member.name}
                </h3>
                <p className="mt-3 text-textBody leading-relaxed">
                  {member.role}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
