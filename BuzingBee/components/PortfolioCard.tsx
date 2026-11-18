"use client";

import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";

interface PortfolioCardProps {
  title: string;
  category: string;
  description: string;
  image: string;
  index: number;
}

export default function PortfolioCard({
  title,
  category,
  description,
  index,
}: PortfolioCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="bg-card border border-border rounded-[14px] overflow-hidden
                 transition-all duration-300 hover:border-borderHover group relative"
    >
      <div className="h-56 bg-bgSection relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-accent/5" />
        <div className="absolute top-4 left-4 bg-bgPrimary/80 backdrop-blur-sm text-accent text-xs font-bold px-3 py-1 rounded-full border border-border">
          {category}
        </div>
        {/* Hover overlay */}
        <div
          className="absolute inset-0 bg-bgPrimary/80 backdrop-blur-sm opacity-0 group-hover:opacity-100
                        transition-all duration-300 flex items-center justify-center"
        >
          <div
            className="w-12 h-12 rounded-full bg-accent flex items-center justify-center
                          scale-75 group-hover:scale-100 transition-transform duration-300"
          >
            <ExternalLink className="w-5 h-5 text-bgPrimary" />
          </div>
        </div>
      </div>
      <div className="p-6">
        <h3 className="text-lg font-bold text-textHeading font-heading mb-2">
          {title}
        </h3>
        <p className="text-textMuted text-sm leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}
