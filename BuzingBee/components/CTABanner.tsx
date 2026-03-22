"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function CTABanner() {
  return (
    <section className="section-padding relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-accent/10 via-accent/5 to-transparent" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-[100px]" />
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="container-max relative z-10 text-center"
      >
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-textHeading font-heading mb-4">
          Ready to Grow Your Business?
        </h2>
        <p className="text-textBody text-base md:text-lg max-w-xl mx-auto mb-8 leading-relaxed">
          Partner with BuzingBee and let&apos;s build something extraordinary
          together. Your success story starts here.
        </p>
        <Link href="/contact" className="btn-primary gap-2">
          Start Your Project <ArrowRight className="w-5 h-5" />
        </Link>
      </motion.div>
    </section>
  );
}
