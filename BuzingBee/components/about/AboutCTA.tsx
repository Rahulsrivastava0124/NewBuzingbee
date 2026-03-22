import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Phone } from "lucide-react";

export default function AboutCTA() {
  return (
    <section className="section-padding pt-0">
      <div className="container-max">
        <div className="relative overflow-hidden rounded-[32px] border border-border bg-card px-6 py-10 md:px-10 lg:px-14 lg:py-14">
          <div className="absolute inset-0 bg-gradient-to-r from-accent/10 via-accent/5 to-transparent" />
          <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_320px] items-center">
            <div>
              <div className="inline-flex items-center rounded-full border border-accent/20 bg-accent/10 px-4 py-2 text-sm font-semibold text-accent">
                Let&apos;s build your next growth stage
              </div>
              <h2 className="mt-5 text-3xl md:text-4xl lg:text-5xl font-bold text-textHeading font-heading leading-tight">
                Need a team that can think, create, ship, and scale with you?
              </h2>
              <p className="mt-4 max-w-2xl text-textBody text-base md:text-lg leading-relaxed">
                Tell us what you are building and we&apos;ll help map the right
                blend of strategy, technology, and performance execution.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link href="/contact" className="btn-primary gap-2">
                  Start Your Project <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="tel:+919507981942" className="btn-outline gap-2">
                  Call Us <Phone className="w-4 h-4" />
                </Link>
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-[320px]">
              <div className="relative aspect-[4/4.5] overflow-hidden rounded-[28px] border border-border bg-white shadow-xl">
                <Image
                  src="/assets/image/services2.jpg"
                  alt="Client strategy session"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
