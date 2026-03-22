import { stats } from "@/lib/data";

export default function StatsBar() {
  return (
    <section className="px-4 sm:px-6 lg:px-8">
      <div className="container-max">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 rounded-[28px] border border-border bg-card px-5 py-6 md:px-8 md:py-8 shadow-[0_20px_60px_rgba(31,27,18,0.05)]">
          {stats.map((item) => (
            <div key={item.label} className="text-center lg:text-left">
              <div className="text-3xl md:text-4xl font-bold font-numeric text-accent">
                {item.value}
                {item.suffix}
              </div>
              <div className="mt-2 text-sm md:text-base text-textMuted">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
