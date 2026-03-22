"use client";

import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Clock, Send } from "lucide-react";
import { SITE_CONFIG } from "@/lib/constants";

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  service: string;
  budget: string;
  message: string;
}

export default function ContactPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ContactFormData>();

  const onSubmit = async (data: ContactFormData) => {
    // EmailJS integration placeholder
    console.log("Form submitted:", data);
    alert("Thank you! We'll get back to you within 24 hours.");
    reset();
  };

  const contactInfo = [
    { icon: MapPin, label: "Address", value: SITE_CONFIG.address },
    {
      icon: Phone,
      label: "Phone",
      value: SITE_CONFIG.phone,
      href: `tel:${SITE_CONFIG.phone}`,
    },
    {
      icon: Mail,
      label: "Email",
      value: SITE_CONFIG.email,
      href: `mailto:${SITE_CONFIG.email}`,
    },
    { icon: Clock, label: "Working Hours", value: SITE_CONFIG.workingHours },
  ];

  const inputClasses =
    "w-full bg-bgSection border border-border rounded-[14px] px-4 py-3 text-textBody text-sm placeholder:text-textMuted/50 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all duration-300";

  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
        <div className="absolute top-20 right-0 w-72 h-72 bg-accent/10 rounded-full blur-[120px]" />
        <div className="container-max relative z-10">
          <span className="inline-block bg-accent/10 text-accent text-sm font-semibold px-4 py-1.5 rounded-full mb-4 border border-accent/20">
            Let&apos;s Talk
          </span>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-textHeading font-heading">
            Contact <span className="text-accent">Us</span>
          </h1>
          <p className="mt-4 text-textBody max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
            Have a project in mind? Let&apos;s discuss how we can help your
            business grow. We&apos;d love to hear from you.
          </p>
        </div>
      </section>

      {/* Form + Info */}
      <section className="section-padding pt-4">
        <div className="container-max grid grid-cols-1 lg:grid-cols-5 gap-8 md:gap-12">
          {/* Form */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-3 bg-card border border-border rounded-[14px] p-6 md:p-10"
          >
            <h2 className="text-2xl font-bold text-textHeading font-heading mb-6">
              Send Us a Message
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <input
                    {...register("name", { required: "Name is required" })}
                    placeholder="Your Name *"
                    className={inputClasses}
                  />
                  {errors.name && (
                    <p className="text-red-400 text-xs mt-1">
                      {errors.name.message}
                    </p>
                  )}
                </div>
                <div>
                  <input
                    {...register("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: "Invalid email",
                      },
                    })}
                    placeholder="Your Email *"
                    className={inputClasses}
                  />
                  {errors.email && (
                    <p className="text-red-400 text-xs mt-1">
                      {errors.email.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <input
                  {...register("phone")}
                  placeholder="Phone Number"
                  className={inputClasses}
                />
                <select {...register("service")} className={inputClasses}>
                  <option value="">Select a Service</option>
                  <option value="web-development">Web Development</option>
                  <option value="mobile-app">Mobile App Development</option>
                  <option value="ai-ml">AI & ML Development</option>
                  <option value="seo">SEO Optimization</option>
                  <option value="social-media">Social Media Marketing</option>
                  <option value="ppc">Google & Meta Ads</option>
                  <option value="email-marketing">Email Marketing</option>
                  <option value="branding">Brand Identity & Logo</option>
                  <option value="ecommerce">E-Commerce Solutions</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <select {...register("budget")} className={inputClasses}>
                <option value="">Select Budget Range</option>
                <option value="below-5k">Below ₹5,000</option>
                <option value="5k-10k">₹5,000 — ₹10,000</option>
                <option value="10k-25k">₹10,000 — ₹25,000</option>
                <option value="25k-50k">₹25,000 — ₹50,000</option>
                <option value="50k-1l">₹50,000 — ₹1,00,000</option>
                <option value="above-1l">Above ₹1,00,000</option>
              </select>

              <div>
                <textarea
                  {...register("message", {
                    required: "Please share some details",
                  })}
                  placeholder="Tell us about your project *"
                  rows={5}
                  className={inputClasses}
                />
                {errors.message && (
                  <p className="text-red-400 text-xs mt-1">
                    {errors.message.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full gap-2 disabled:opacity-50"
              >
                {isSubmitting ? "Sending..." : "Send Message"}{" "}
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-2 space-y-6"
          >
            <div className="bg-card border border-border rounded-[14px] p-6 md:p-8">
              <h3 className="text-xl font-bold text-textHeading font-heading mb-6">
                Get In Touch
              </h3>
              <div className="space-y-5">
                {contactInfo.map((info) => (
                  <div key={info.label} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <info.icon className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <div className="text-textMuted text-xs mb-0.5">
                        {info.label}
                      </div>
                      {info.href ? (
                        <a
                          href={info.href}
                          className="text-textBody text-sm hover:text-accent transition-colors"
                        >
                          {info.value}
                        </a>
                      ) : (
                        <div className="text-textBody text-sm">
                          {info.value}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Map placeholder */}
            <div className="bg-card border border-border rounded-[14px] overflow-hidden h-64">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3684.1!2d88.3629!3d22.5726!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjLCsDM0JzIxLjQiTiA4OMKwMjEnNDYuNCJF!5e0!3m2!1sen!2sin!4v1234567890"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="BuzingBee Location"
              />
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
