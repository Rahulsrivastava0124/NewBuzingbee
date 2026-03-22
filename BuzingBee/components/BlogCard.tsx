"use client";

import { motion } from "framer-motion";
import { Calendar, ArrowRight } from "lucide-react";
import Link from "next/link";

interface BlogCardProps {
  title: string;
  excerpt: string;
  category: string;
  date: string;
  image: string;
  slug: string;
  index: number;
}

export default function BlogCard({
  title,
  excerpt,
  category,
  date,
  image,
  slug,
  index,
}: BlogCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="bg-card border border-border rounded-[14px] overflow-hidden
                 transition-all duration-300 hover:border-borderHover group"
    >
      <div className="h-48 bg-bgSection relative overflow-hidden">
        {image ? (
          <img
            src={image}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-transparent" />
        <div className="absolute top-4 left-4 bg-accent text-bgPrimary text-xs font-bold px-3 py-1 rounded-full">
          {category}
        </div>
        {!image ? (
          <div className="absolute inset-0 flex items-center justify-center text-accent/50">
            <span className="text-sm font-semibold">BuzingBee Blog</span>
          </div>
        ) : null}
      </div>
      <div className="p-6">
        <div className="flex items-center gap-2 text-textMuted text-xs mb-3">
          <Calendar className="w-3 h-3" />
          {date}
        </div>
        <h3
          className="text-lg font-bold text-textHeading font-heading mb-2 line-clamp-2
                       group-hover:text-accent transition-colors duration-300"
        >
          {title}
        </h3>
        <p className="text-textMuted text-sm leading-relaxed mb-4 line-clamp-3">
          {excerpt}
        </p>
        <Link
          href={`/blog/${slug}`}
          className="inline-flex items-center gap-2 text-accent text-sm font-semibold
                     group-hover:gap-3 transition-all duration-300"
        >
          Read More <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </motion.div>
  );
}
