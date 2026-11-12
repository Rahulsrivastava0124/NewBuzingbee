// "Recent projects": a slow, continuous marquee of project cards (photo, client,
// service, two results). Reuses the .marquee animation from globals.css, which pauses on
// hover and stops for reduced-motion visitors (they can scroll the row sideways instead).

const PROJECTS = [
  {
    name: "NaturaGlow",
    service: "Social Media Marketing",
    image: "/projects/naturaglow.webp",
    stats: [
      { value: "+240%", label: "Instagram Reach" },
      { value: "+180%", label: "Website Traffic" },
    ],
  },
  {
    name: "Urban Bites",
    service: "Google Ads",
    image: "/projects/urban-bites.webp",
    stats: [
      { value: "+320%", label: "New Customers" },
      { value: "+150%", label: "Revenue Growth" },
    ],
  },
  {
    name: "NextGen Academy",
    service: "SEO & Content Marketing",
    image: "/projects/nextgen-academy.webp",
    stats: [
      { value: "+280%", label: "Organic Traffic" },
      { value: "+120%", label: "Enrollments" },
    ],
  },
];

// one "half" of the loop holds the list twice, so it is wider than any screen;
// the track holds two halves and slides -50% for a seamless loop
const HALF = [...PROJECTS, ...PROJECTS];

function ProjectCard({ project }: { project: (typeof PROJECTS)[number] }) {
  return (
    <article className="w-[300px] shrink-0 overflow-hidden rounded-2xl border border-ink/10 bg-surface sm:w-[380px]">
      <img
        src={project.image}
        alt={`${project.name} project`}
        className="aspect-[16/9] w-full object-cover"
        loading="lazy"
      />
      <div className="p-6">
        <h3 className="text-lg font-semibold text-ink">{project.name}</h3>
        <p className="mt-1 text-sm text-slate">{project.service}</p>
        <dl className="mt-6 grid grid-cols-2 divide-x divide-ink/10">
          {project.stats.map((s, i) => (
            <div key={s.label} className={i === 0 ? "pr-4" : "pl-6"}>
              <dt className="sr-only">{s.label}</dt>
              <dd className="text-2xl font-semibold tracking-[-0.01em] text-ink">{s.value}</dd>
              <dd className="mt-1 text-sm text-slate">{s.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </article>
  );
}

export default function ProjectsMarquee() {
  return (
    <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)] motion-reduce:overflow-x-auto">
      {/* inline duration: the .marquee rule in globals.css would override a utility class */}
      <div className="marquee flex w-max" style={{ animationDuration: "60s" }}>
        {[0, 1].map((copy) => (
          // pr-6 (not a gap between halves) keeps the -50% loop seamless
          <div key={copy} className="flex gap-6 pr-6">
            {HALF.map((p, i) => (
              // screen readers get each project once
              <div key={`${p.name}-${i}`} aria-hidden={copy === 1 || i >= PROJECTS.length}>
                <ProjectCard project={p} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
