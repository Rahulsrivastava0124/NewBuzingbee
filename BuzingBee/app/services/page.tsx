"use client";

import { ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import React from "react";
import CTABanner from "@/components/CTABanner";
import { serviceCategories } from "@/lib/data";

export default function ServicesPage() {
  const [activeTab, setActiveTab] = React.useState(serviceCategories[0].id);

  const activeCategory = serviceCategories.find((cat) => cat.id === activeTab);

  return (
    <>
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
        <div className="absolute top-20 right-0 w-72 h-72 bg-accent/10 rounded-full blur-[120px]" />
        <div className="container-max relative z-10">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-textHeading font-heading">
            Our <span className="text-accent">Services</span>
          </h1>
          <p className="mt-4 text-textBody max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
            Comprehensive digital solutions tailored to accelerate your business
            growth — from development to marketing.
          </p>
        </div>
      </section>

      <section className="section-padding pt-4 md:pt-6">
        <div className="container-max">
          <div className="flex flex-wrap justify-center gap-2.5 md:gap-3 mb-7 md:mb-8">
            {serviceCategories.map((cat) => (
              <button
                key={cat.id}
                className={`px-4 md:px-5 py-2 rounded-full font-semibold border transition-colors text-sm md:text-base whitespace-nowrap ${
                  activeTab === cat.id
                    ? "bg-accent text-white border-accent"
                    : "bg-bgSection text-textHeading border-border hover:bg-accent/10"
                }`}
                onClick={() => setActiveTab(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {activeCategory && (
            <div className="mb-8 text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-textHeading font-heading mb-2">
                {activeCategory.label}
              </h2>
              <p className="text-textBody max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
                {activeCategory.description}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {activeCategory?.services.map((service) => (
              <div
                key={service.title}
                className="bg-card border border-border rounded-[18px] p-6 md:p-7 flex flex-col hover:border-accent/35 hover:shadow-[0_12px_32px_rgba(236,173,16,0.10)] transition-all duration-300"
              >
                <div className="flex items-center justify-between gap-3 mb-4">
                  <span className="inline-flex items-center rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                    {activeCategory.label}
                  </span>
                  <span className="text-xs text-textMuted font-medium">
                    {service.items.length} key deliverable
                    {service.items.length > 1 ? "s" : ""}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-textHeading font-heading mb-2">
                  {service.title}
                </h3>
                <p className="text-sm text-textMuted leading-relaxed mb-4">
                  Tailored execution designed to help your business move faster
                  with stronger visibility, conversion, and long-term growth.
                </p>
                <div className="mb-4 rounded-xl bg-bgSection/60 border border-border/60 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent mb-2">
                    What&apos;s included
                  </p>
                  <ul className="space-y-2.5 text-textBody text-sm leading-relaxed">
                    {service.items.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-auto flex items-center justify-between gap-3 pt-3 border-t border-border/70">
                  <div>
                    <p className="text-xs uppercase tracking-[0.12em] text-textMuted">
                      Ideal for
                    </p>
                    <p className="text-sm font-medium text-textHeading mt-1">
                      Brands ready to scale this channel
                    </p>
                  </div>
                  <Link
                    href={`/contact?service=${encodeURIComponent(service.title)}`}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:text-accentHover transition-colors shrink-0"
                  >
                    Start <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-bgSection">
        <div className="container-max">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-textHeading font-heading mb-6">
                Ready to Transform Your{" "}
                <span className="text-accent">Vision</span> Into Reality?
              </h2>
              <p className="text-textBody text-base md:text-lg leading-relaxed mb-6">
                Our team of experts is here to help you navigate the digital
                landscape and achieve your business goals. Whether you need a
                quick consultation or a full-scale project, we&apos;re ready to
                connect.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-accent" />
                  </div>
                  <span className="text-textBody">
                    Quick response times — we value your time
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-accent" />
                  </div>
                  <span className="text-textBody">
                    Customized solutions tailored to your needs
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-accent" />
                  </div>
                  <span className="text-textBody">
                    Expert team with years of industry experience
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-accent" />
                  </div>
                  <span className="text-textBody">
                    Transparent communication throughout the project
                  </span>
                </li>
              </ul>
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="tel:+91 95079 81942"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-accent text-white font-semibold hover:bg-accentHover transition-all"
                >
                  Call Now
                </a>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-accent text-accent font-semibold hover:bg-accent/5 transition-all"
                >
                  Get in Touch
                </Link>
              </div>
            </div>
            <div className="bg-card border border-border rounded-2xl p-8 md:p-10">
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="text-center">
                  <div className="text-4xl font-bold text-accent font-numeric mb-2">
                    500+
                  </div>
                  <p className="text-sm text-textMuted">Projects Completed</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-accent font-numeric mb-2">
                    200+
                  </div>
                  <p className="text-sm text-textMuted">Happy Clients</p>
                </div>
              </div>
              <div className="mb-8 p-6 bg-bgSection rounded-xl border border-border/50">
                <h4 className="text-lg font-bold text-textHeading mb-3">
                  Why Choose BuzingBee?
                </h4>
                <ul className="space-y-2 text-sm text-textMuted">
                  <li>✓ AI-First Development Approach</li>
                  <li>✓ Multi-Service Expertise</li>
                  <li>✓ Proven Track Record</li>
                  <li>✓ 24/7 Support Available</li>
                </ul>
              </div>
              <div className="p-4 bg-accent/10 rounded-lg border border-accent/20">
                <p className="text-sm font-semibold text-accent mb-2">
                  💼 Limited Time Offer
                </p>
                <p className="text-xs text-textMuted">
                  Get 20% off on your first service package when you book this
                  week
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <CTABanner />
    </>
  );
}
