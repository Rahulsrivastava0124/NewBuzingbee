"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { X } from "lucide-react";
import PricingCard from "@/components/PricingCard";
import SectionHeading from "@/components/SectionHeading";
import { pricingPlans, servicePlansByCategory } from "@/lib/data";

type PricingPlan = (typeof pricingPlans)[number];

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  const [pricingMode, setPricingMode] = useState<"subscription" | "project">(
    "subscription",
  );
  const [activeServicePlanTab, setActiveServicePlanTab] = useState(
    servicePlansByCategory[0].id,
  );

  const activeServicePlanCategory = servicePlansByCategory.find(
    (cat) => cat.id === activeServicePlanTab,
  );

  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
        <div className="absolute top-20 left-0 w-72 h-72 bg-accent/10 rounded-full blur-[120px]" />
        <div className="container-max relative z-10">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-textHeading font-heading">
            Pricing <span className="text-accent">Plans</span>
          </h1>
          <p className="mt-4 text-textBody max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
            Explore all pricing in one place — subscription plans with
            monthly/yearly billing or project-based plans by service category.
          </p>

          {/* Pricing mode toggle */}
          <div className="mt-8 flex items-center justify-center">
            <div className="inline-flex rounded-full border border-border bg-card p-1.5">
              <button
                onClick={() => setPricingMode("subscription")}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                  pricingMode === "subscription"
                    ? "bg-accent text-white"
                    : "text-textMuted hover:text-textHeading"
                }`}
              >
                Subscription Plans
              </button>
              <button
                onClick={() => setPricingMode("project")}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                  pricingMode === "project"
                    ? "bg-accent text-white"
                    : "text-textMuted hover:text-textHeading"
                }`}
              >
                Project Based Plans
              </button>
            </div>
          </div>

          {/* Monthly / Yearly toggle (only for subscription mode) */}
          {pricingMode === "subscription" && (
            <div className="mt-6 flex items-center justify-center gap-4">
              <span
                className={`text-sm font-medium transition-colors ${
                  !isYearly ? "text-accent" : "text-textMuted"
                }`}
              >
                Monthly
              </span>
              <button
                onClick={() => setIsYearly(!isYearly)}
                className="relative w-14 h-7 rounded-full bg-bgSection border border-border
                         transition-colors duration-300"
                aria-label="Toggle pricing period"
              >
                <motion.div
                  className="absolute top-0.5 w-6 h-6 rounded-full bg-accent"
                  animate={{ left: isYearly ? "calc(100% - 26px)" : "2px" }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </button>
              <span
                className={`text-sm font-medium transition-colors ${
                  isYearly ? "text-accent" : "text-textMuted"
                }`}
              >
                Yearly{" "}
                <span className="text-xs text-accent/70">(Save ~17%)</span>
              </span>
            </div>
          )}
        </div>
      </section>

      {/* All Pricing Plans (single section) */}
      <section className="section-padding pt-4 md:pt-6 bg-bgSection/40">
        <div className="container-max">
          <SectionHeading
            title="All Pricing Plans"
            subtitle={
              pricingMode === "subscription"
                ? "Compare monthly/yearly subscription plans for ongoing support."
                : "Choose project-based plans by service category."
            }
          />

          {pricingMode === "subscription" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 items-start">
              {pricingPlans.map((plan, i) => (
                <PricingCard
                  key={plan.id}
                  id={plan.id}
                  name={plan.name}
                  price={isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                  currency={plan.currency}
                  period={isYearly ? "year" : "month"}
                  description={plan.description}
                  features={plan.features}
                  featured={plan.featured}
                  index={i}
                  onReadMore={() => setSelectedPlan(plan)}
                />
              ))}
            </div>
          ) : (
            <>
              <div className="flex flex-wrap justify-center gap-3 mb-8">
                {servicePlansByCategory.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveServicePlanTab(cat.id)}
                    className={`px-5 py-2 rounded-full text-sm md:text-base font-semibold border transition-all
                      ${
                        activeServicePlanTab === cat.id
                          ? "bg-accent text-white border-accent"
                          : "bg-card text-textHeading border-border hover:border-accent/40 hover:text-accent"
                      }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {activeServicePlanCategory && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                  {activeServicePlanCategory.plans.map((plan, idx) => (
                    <div
                      key={plan.name}
                      className={`rounded-2xl border p-6 md:p-7 bg-card transition-all
                        ${
                          idx === 1
                            ? "border-accent/50 shadow-[0_0_24px_rgba(224,138,42,0.14)]"
                            : "border-border hover:border-accent/35"
                        }`}
                    >
                      {idx === 1 && (
                        <div className="inline-flex mb-4 rounded-full bg-accent/15 border border-accent/30 text-accent text-xs font-semibold px-3 py-1">
                          Most Popular
                        </div>
                      )}

                      <h3 className="text-xl font-bold text-textHeading font-heading">
                        {plan.name}
                      </h3>
                      <p className="mt-3 text-3xl font-bold text-accent font-heading leading-none font-numeric">
                        {plan.price}
                        {plan.period ? (
                          <span className="text-sm font-medium text-textMuted ml-1">
                            {plan.period}
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-3 text-sm text-textBody leading-relaxed min-h-[44px]">
                        {plan.description}
                      </p>

                      <ul className="mt-5 space-y-2.5 text-sm text-textBody">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2">
                            <span className="mt-1.5 h-2 w-2 rounded-full bg-accent shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <Link
                        href={`/contact?service=${activeServicePlanCategory.id}&plan=${encodeURIComponent(plan.name)}`}
                        className={`mt-6 inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-all
                          ${
                            idx === 1
                              ? "bg-accent text-white hover:bg-accentHover"
                              : "border border-border text-textHeading hover:border-accent/40 hover:text-accent"
                          }`}
                      >
                        Enquiry Now
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {selectedPlan && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-5">
          <button
            type="button"
            aria-label="Close plan details"
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSelectedPlan(null)}
          />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.25 }}
            className="relative z-10 w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-[20px] border border-border bg-card shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-2 md:px-8">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-accent mb-2">
                  Plan Details
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-textHeading font-heading">
                  {selectedPlan.name}
                </h2>
                <p className="mt-2 text-sm text-textMuted max-w-xl">
                  {selectedPlan.description}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPlan(null)}
                className="rounded-full border border-border p-2 text-textMuted hover:text-accent hover:border-accent transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[calc(85vh-180px)] overflow-y-auto px-6 py-6 md:px-8">
              <ul className="space-y-4">
                {selectedPlan.features.map((feature) => (
                  <FeatureListRow key={feature} text={feature} />
                ))}
              </ul>
            </div>

            <div className="border-t border-border px-6 py-5 md:px-8 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between bg-bgSection/50">
              <div className="text-sm text-textMuted">
                {selectedPlan.id === "basic"
                  ? `Starting at ${selectedPlan.currency}${selectedPlan.monthlyPrice.toLocaleString("en-IN")}`
                  : "Custom pricing shared after consultation."}
              </div>
              <Link
                href={
                  selectedPlan.id === "basic"
                    ? "/contact?plan=basic"
                    : `/contact?plan=${selectedPlan.id}&intent=enquiry`
                }
                className="inline-flex min-h-[46px] items-center justify-center rounded-[12px] bg-accent px-6 py-2.5 text-sm font-semibold leading-none text-[#1f1b12] transition-all duration-300 hover:bg-accentHover hover:shadow-[0_0_24px_rgba(250,204,21,0.35)] sm:self-auto self-start"
              >
                {selectedPlan.id === "basic" ? "Get Started" : "Enquiry Now"}
              </Link>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}

function FeatureListRow({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-1.5 h-2.5 w-2.5 rounded-full bg-accent flex-shrink-0" />
      <span className="text-textBody text-sm md:text-base leading-relaxed">
        {text}
      </span>
    </li>
  );
}
