"use client";

import { motion } from "framer-motion";
import { ArrowRight, Building2, Tag } from "lucide-react";
import Link from "next/link";

interface CaseStudyCardProps {
  title: string;
  slug: string;
  client: string;
  industry: string;
  summary: string;
  image: string;
  category: string;
  metrics: Array<{ label: string; value: string }>;
  index: number;
}

export default function CaseStudyCard({
  title,
  slug,
  client,
  industry,
  summary,
  image,
  category,
  metrics,
  index,
}: CaseStudyCardProps) {
  const topMetrics = metrics?.slice(0, 3) ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="bg-card border border-border rounded-[14px] overflow-hidden
                 transition-all duration-300 hover:border-borderHover group"
    >
      {/* Image */}
      <div className="h-48 bg-bgSection relative overflow-hidden">
        {image ? (
          <img
            src={image}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-accent/5 to-transparent flex items-center justify-center">
            <span className="text-accent/40 text-sm font-semibold">
              Case Study
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-bgPrimary/60 via-transparent to-transparent" />
        <div className="absolute top-4 left-4 bg-accent text-bgPrimary text-xs font-bold px-3 py-1 rounded-full">
          {category}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Client & Industry */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-textMuted mb-3">
          {client && (
            <div className="flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              {client}
            </div>
          )}
          {industry && (
            <div className="flex items-center gap-1">
              <Tag className="w-3 h-3" />
              {industry}
            </div>
          )}
        </div>

        <h3
          className="text-lg font-bold text-textHeading font-heading mb-2 line-clamp-2
                     group-hover:text-accent transition-colors duration-300"
        >
          {title}
        </h3>

        <p className="text-textMuted text-sm leading-relaxed mb-4 line-clamp-3">
          {summary}
        </p>

        {/* Metrics */}
        {topMetrics.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-4">
            {topMetrics.map((m, i) => (
              <div
                key={i}
                className="bg-accent/10 border border-accent/20 rounded-lg px-3 py-1.5 text-center"
              >
                <div className="text-accent font-bold text-sm">{m.value}</div>
                <div className="text-textMuted text-xs">{m.label}</div>
              </div>
            ))}
          </div>
        )}

        <Link
          href={`/case-studies/${slug}`}
          className="inline-flex items-center gap-2 text-accent text-sm font-semibold
                     group-hover:gap-3 transition-all duration-300"
        >
          Read Case Study <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </motion.div>
  );
}
