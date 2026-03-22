"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import SectionHeading from "@/components/SectionHeading";
import PortfolioCard from "@/components/PortfolioCard";
import { portfolioItems, portfolioCategories } from "@/lib/data";

export default function PortfolioPage() {
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered =
    activeCategory === "All"
      ? portfolioItems
      : portfolioItems.filter((item) => item.category === activeCategory);

  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
        <div className="absolute bottom-0 left-20 w-72 h-72 bg-accent/10 rounded-full blur-[120px]" />
        <div className="container-max relative z-10">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-textHeading font-heading">
            Our <span className="text-accent">Portfolio</span>
          </h1>
          <p className="mt-4 text-textBody max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
            A showcase of projects we&apos;re proud of — websites, apps, brands,
            and digital campaigns that delivered real results.
          </p>
        </div>
      </section>

      {/* Filter + Grid */}
      <section className="section-padding pt-4">
        <div className="container-max">
          {/* Filter tabs */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
            {portfolioCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300
                  ${
                    activeCategory === cat
                      ? "bg-accent text-bgPrimary"
                      : "bg-card border border-border text-textMuted hover:border-borderHover hover:text-textBody"
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Grid */}
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
          >
            {filtered.map((item, i) => (
              <PortfolioCard
                key={item.id}
                title={item.title}
                category={item.category}
                description={item.description}
                image={item.image}
                index={i}
              />
            ))}
          </motion.div>
        </div>
      </section>
    </>
  );
}
