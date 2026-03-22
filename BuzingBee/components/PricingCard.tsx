"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import FeatureItem from "./FeatureItem";

interface PricingCardProps {
  id: string;
  name: string;
  price: number;
  currency: string;
  period: string;
  description: string;
  features: string[];
  featured: boolean;
  index: number;
  onReadMore: () => void;
}

export default function PricingCard({
  id,
  name,
  price,
  currency,
  period,
  description,
  features,
  featured,
  index,
  onReadMore,
}: PricingCardProps) {
  const visibleFeatures = features.slice(0, 7);
  const remainingCount = Math.max(features.length - visibleFeatures.length, 0);
  const isBasicPlan = id === "basic";
  const ctaLabel = isBasicPlan ? "Get Started" : "Enquiry Now";
  const href = isBasicPlan
    ? "/contact?plan=basic"
    : `/contact?plan=${id}&intent=enquiry`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.5, delay: index * 0.15 }}
      className={`relative bg-card rounded-[14px] p-6 md:p-8 flex flex-col
                  transition-all duration-300
                  ${
                    featured
                      ? "border-2 border-accent glow-amber scale-[1.02]"
                      : "border border-border hover:border-borderHover"
                  }`}
    >
      {featured && (
        <div
          className="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent text-bgPrimary
                        px-4 py-1 rounded-full text-sm font-bold whitespace-nowrap"
        >
          Most Popular
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-xl font-bold text-textHeading font-heading">
          {name}
        </h3>
        <p className="text-textMuted text-sm mt-1">{description}</p>
      </div>

      <div className="mb-6">
        {isBasicPlan ? (
          <>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-textMuted mb-2">
              Starts At
            </div>
            <span className="text-4xl md:text-5xl font-bold text-textHeading font-heading font-numeric">
              {currency}
              {price.toLocaleString("en-IN")}
            </span>
            <span className="text-textMuted text-sm font-numeric">
              /{period}
            </span>
          </>
        ) : (
          <>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-textMuted mb-2">
              Custom Pricing
            </div>
            <div className="text-3xl md:text-4xl font-bold text-textHeading font-heading">
              On Conversation
            </div>
            <div className="text-textMuted text-sm mt-1">
              Share your goals and get a tailored quote.
            </div>
          </>
        )}
      </div>

      <ul className="space-y-3 flex-1 mb-8">
        {visibleFeatures.map((feature) => (
          <FeatureItem key={feature} text={feature} />
        ))}
      </ul>

      {remainingCount > 0 && (
        <button
          type="button"
          onClick={onReadMore}
          className="mb-6 self-start text-sm font-semibold text-accent hover:text-accentHover transition-colors"
        >
          Read more ({remainingCount} more)
        </button>
      )}

      <Link
        href={href}
        className={`inline-flex w-full min-h-[44px] items-center justify-center text-center px-5 py-2.5 rounded-[12px] text-sm font-semibold transition-all duration-300 leading-none
                    ${
                      featured
                        ? "bg-accent text-bgPrimary hover:bg-accentHover hover:shadow-[0_0_24px_rgba(224,138,42,0.3)]"
                        : "bg-transparent border border-accent text-accent hover:bg-accent hover:text-bgPrimary"
                    }`}
      >
        {ctaLabel}
      </Link>
    </motion.div>
  );
}
