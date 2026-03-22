"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { servicePlansByCategory } from "@/lib/data";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function StartupPlanPage() {
  const router = useRouter();
  // Extract first (minimal/starter) plan from each service category
  const startupPlans = servicePlansByCategory.map((category) => ({
    category: category.label,
    categoryId: category.id,
    plan: category.plans[0], // First plan is always the minimal/starter plan
  }));

  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
        <div className="absolute top-20 left-0 w-72 h-72 bg-accent/10 rounded-full blur-[120px]" />
        <div className="absolute top-40 right-10 w-64 h-64 bg-accent/5 rounded-full blur-[120px]" />

        <div className="container-max relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-block px-4 py-2 rounded-full border border-accent/30 bg-accent/5 text-accent font-semibold text-sm mb-6">
              🚀 Startup Plans
            </div>

            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-textHeading font-heading">
              Minimal Cost Plans for{" "}
              <span className="text-accent">Startups</span>
            </h1>

            <p className="mt-4 text-textBody max-w-3xl mx-auto text-base md:text-lg leading-relaxed">
              Get started with our most affordable plans across all services.
              Perfect for businesses launching or testing new services without
              breaking the budget. Scale up as you grow.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-accent text-accent font-semibold hover:bg-accent/5 transition-all"
              >
                View All Plans
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-accent text-white font-semibold hover:bg-accentHover transition-all"
              >
                Get Customized Quote
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Startup Plans Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-bgSection">
        <div className="container-max">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-textHeading font-heading">
              Starter Plans for All Services
            </h2>
            <p className="mt-3 text-textMuted max-w-2xl mx-auto">
              Each service category offers a minimal entry point. Start small
              and upgrade as your business grows.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {startupPlans.map((item, index) => (
              <motion.div
                key={item.categoryId}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-accent/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />

                <div className="relative bg-white rounded-2xl border border-border p-6 sm:p-8 hover:border-accent/30 transition-colors">
                  {/* Category Label */}
                  <div className="inline-block px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-semibold mb-4">
                    {item.category}
                  </div>

                  {/* Plan Name */}
                  <h3 className="text-2xl font-bold text-textHeading font-heading mb-2">
                    {item.plan.name}
                  </h3>

                  {/* Description */}
                  <p className="text-textMuted text-sm mb-4">
                    {item.plan.description}
                  </p>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-textHeading font-numeric">
                        {item.plan.price}
                      </span>
                      {item.plan.period && (
                        <span className="text-textMuted text-sm">
                          {item.plan.period}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Features */}
                  <div className="mb-6 space-y-3">
                    {item.plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="mt-1 w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
                        <span className="text-textBody text-sm leading-relaxed">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <button
                    className="w-full py-3 rounded-lg bg-accent text-white font-semibold hover:bg-accentHover transition-colors"
                    onClick={() => {
                      const url = new URL("/contact", window.location.origin);
                      url.searchParams.set("service", item.category);
                      url.searchParams.set("plan", item.plan.name);
                      router.push(
                        `${url.pathname}?${url.searchParams.toString()}`,
                      );
                    }}
                  >
                    Get Started
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Comparison Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="container-max">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-bgSection rounded-2xl border border-border p-8 sm:p-12"
          >
            <h2 className="text-3xl font-bold text-textHeading font-heading mb-8">
              What's Included in Startup Plans?
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                {
                  icon: "✓",
                  title: "Core Service Setup",
                  description:
                    "Get the essential features you need to start and validate your strategy.",
                },
                {
                  icon: "✓",
                  title: "Monthly Reporting",
                  description:
                    "Track progress with clear, actionable monthly performance reports.",
                },
                {
                  icon: "✓",
                  title: "Expert Consultation",
                  description:
                    "Work with our team to get your strategy right from day one.",
                },
                {
                  icon: "✓",
                  title: "Scalable Foundation",
                  description:
                    "Easily upgrade to growth or enterprise plans as your business expands.",
                },
                {
                  icon: "✓",
                  title: "Dedicated Support",
                  description:
                    "Get timely support and quick responses to your service-related questions.",
                },
                {
                  icon: "✓",
                  title: "No Long-term Lock-in",
                  description:
                    "Month-to-month flexibility. Scale up, adjust, or add services anytime.",
                },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.08 }}
                  viewport={{ once: true }}
                  className="flex gap-4"
                >
                  <div className="text-3xl text-accent font-bold flex-shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-textHeading mb-2">
                      {item.title}
                    </h4>
                    <p className="text-textMuted text-sm">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="container-max">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-accent/5 to-accent/10 rounded-2xl border border-accent/20 p-8 sm:p-12 text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-textHeading font-heading mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-textMuted max-w-2xl mx-auto mb-8">
              Choose any startup plan and join hundreds of growing businesses.
              Our team is ready to support your journey.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-8 py-3 rounded-lg bg-accent text-white font-semibold hover:bg-accentHover transition-all"
              >
                Start Your Journey
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center px-8 py-3 rounded-lg border border-accent text-accent font-semibold hover:bg-accent/5 transition-all"
              >
                Compare All Plans
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
