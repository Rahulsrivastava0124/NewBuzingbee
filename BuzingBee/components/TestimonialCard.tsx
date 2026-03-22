"use client";

import { motion } from "framer-motion";
import { Star, User } from "lucide-react";

interface TestimonialCardProps {
  name: string;
  company: string;
  avatar: string;
  rating: number;
  text: string;
  index: number;
}

export default function TestimonialCard({
  name,
  company,
  rating,
  text,
  index,
}: TestimonialCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.5, delay: index * 0.15 }}
      className="bg-card border border-border rounded-[14px] p-6 md:p-8
                 transition-all duration-300 hover:border-borderHover"
    >
      <div className="flex gap-1 mb-4">
        {Array.from({ length: rating }).map((_, i) => (
          <Star key={i} className="w-4 h-4 text-accent fill-accent" />
        ))}
      </div>
      <p className="text-textBody text-sm md:text-base leading-relaxed mb-6 italic">
        &ldquo;{text}&rdquo;
      </p>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-bgSection flex items-center justify-center">
          <User className="w-5 h-5 text-accent" />
        </div>
        <div>
          <div className="text-textHeading font-semibold text-sm">{name}</div>
          <div className="text-textMuted text-xs">{company}</div>
        </div>
      </div>
    </motion.div>
  );
}
