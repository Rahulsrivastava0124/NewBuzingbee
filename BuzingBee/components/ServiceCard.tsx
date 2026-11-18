"use client";

import { motion } from "framer-motion";
import * as LucideIcons from "lucide-react";
import StarItem from "./StarItem";

interface ServiceCardProps {
  title: string;
  description: string;
  items: string[];
  icon: string;
  index: number;
}

export default function ServiceCard({
  title,
  description,
  items,
  icon,
  index,
}: ServiceCardProps) {
  const IconComponent =
    (
      LucideIcons as unknown as Record<
        string,
        React.ComponentType<{ className?: string }>
      >
    )[icon] || LucideIcons.Star;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="bg-card border border-border rounded-[14px] p-6 md:p-8
                 transition-all duration-300 hover:border-borderHover
                 hover:shadow-[0_0_30px_rgba(224,138,42,0.1)]
                 group"
    >
      <div
        className="w-12 h-12 rounded-xl bg-bgSection flex items-center justify-center mb-5
                      group-hover:bg-accent/10 transition-colors duration-300"
      >
        <IconComponent className="w-6 h-6 text-accent" />
      </div>
      <h3 className="text-xl md:text-2xl font-bold text-textHeading font-heading mb-3">
        {title}
      </h3>
      <p className="text-textMuted text-sm mb-5 leading-relaxed">
        {description}
      </p>
      <ul className="space-y-3">
        {items.map((item) => (
          <StarItem key={item} text={item} />
        ))}
      </ul>
    </motion.div>
  );
}
