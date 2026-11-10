"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  Phone,
  MessageCircle,
  ArrowUpRight,
  ChevronDown,
} from "lucide-react";
import { NAV_LINKS, SITE_CONFIG } from "@/lib/constants";
import { serviceCategories } from "@/lib/data";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";

// desktop bar is a trimmed set; the full NAV_LINKS list stays in the mobile menu + footer
const DESKTOP_LINKS = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Our Work", href: "/portfolio" },
  { label: "Insights", href: "/blog" },
];

export default function Navbar() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [enquiryForm, setEnquiryForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const pathname = usePathname();
  const currentPath = pathname || "/";

  const isActiveLink = (href: string) => {
    if (href === "/") {
      return currentPath === "/";
    }

    return currentPath === href || currentPath.startsWith(`${href}/`);
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!enquiryOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [enquiryOpen]);

  const handleEnquirySubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const params = new URLSearchParams({
      source: "navbar",
      name: enquiryForm.name,
      email: enquiryForm.email,
      phone: enquiryForm.phone,
      message: enquiryForm.message,
    });

    setEnquiryOpen(false);
    router.push(`/contact?${params.toString()}`);
  };

  const enquiryModal = (
    <AnimatePresence>
      {enquiryOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/45 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 md:p-7 shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setEnquiryOpen(false)}
              aria-label="Close enquiry form"
              className="absolute top-3 right-3 inline-flex w-9 h-9 items-center justify-center rounded-full border border-border text-textMuted hover:text-accent hover:border-accent transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-2xl font-bold text-textHeading font-heading pr-8">
              Get Your Free Audit
            </h3>
            <p className="mt-1 text-sm text-textMuted">
              Share your details and we&apos;ll send you a short plan for growing your business.
            </p>

            <form onSubmit={handleEnquirySubmit} className="mt-5 space-y-3">
              <input
                type="text"
                required
                placeholder="Your Name"
                value={enquiryForm.name}
                onChange={(e) =>
                  setEnquiryForm((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full rounded-xl border border-border bg-bgPrimary px-4 py-2.5 text-sm text-textHeading placeholder:text-textMuted outline-none focus:border-accent"
              />
              <input
                type="email"
                required
                placeholder="Email Address"
                value={enquiryForm.email}
                onChange={(e) =>
                  setEnquiryForm((prev) => ({ ...prev, email: e.target.value }))
                }
                className="w-full rounded-xl border border-border bg-bgPrimary px-4 py-2.5 text-sm text-textHeading placeholder:text-textMuted outline-none focus:border-accent"
              />
              <input
                type="tel"
                required
                placeholder="Phone Number"
                value={enquiryForm.phone}
                onChange={(e) =>
                  setEnquiryForm((prev) => ({ ...prev, phone: e.target.value }))
                }
                className="w-full rounded-xl border border-border bg-bgPrimary px-4 py-2.5 text-sm text-textHeading placeholder:text-textMuted outline-none focus:border-accent"
              />
              <textarea
                rows={4}
                placeholder="Tell us about your requirement"
                value={enquiryForm.message}
                onChange={(e) =>
                  setEnquiryForm((prev) => ({
                    ...prev,
                    message: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-border bg-bgPrimary px-4 py-2.5 text-sm text-textHeading placeholder:text-textMuted outline-none focus:border-accent resize-none"
              />

              <button type="submit" className="btn-primary w-full mt-1">
                Request my free audit
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 font-jakarta transition-all duration-300 ${
          scrolled
            ? "bg-paper/55 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_1px_0_rgba(18,20,28,0.08)]"
            : "bg-transparent"
        }`}
      >
        <nav className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
          <div
            className={`flex items-center gap-4 xl:gap-8 transition-[height] duration-300 ${
              scrolled ? "h-14 md:h-16" : "h-14 md:h-20"
            }`}
          >
            {/* Logo */}
            <Link href="/" className="shrink-0">
              <img
                src="/buzingbee-logo.webp"
                alt={`${SITE_CONFIG.name} — Digital Marketing & AI`}
                width={944}
                height={257}
                className="h-9 md:h-11 w-auto dark:hidden"
              />
              {/* same logo with off-white lettering for dark mode */}
              <img
                src="/buzingbee-logo-dark.webp"
                alt={`${SITE_CONFIG.name} — Digital Marketing & AI`}
                width={944}
                height={257}
                className="hidden h-9 md:h-11 w-auto dark:block"
              />
            </Link>

            {/* Desktop nav */}
            <div className="hidden xl:flex flex-1 items-center justify-center gap-10 2xl:gap-14 min-w-0">
              {DESKTOP_LINKS.map((link) => {
                const active = isActiveLink(link.href);
                const linkClass = `relative inline-flex items-center gap-1.5 py-2 text-[16px] transition-colors duration-300 ${
                  active
                    ? "font-bold text-ink"
                    : "font-medium text-ink/85 hover:text-ink"
                }`;
                const underline = active && (
                  <span className="absolute left-0 -bottom-1.5 h-[3px] w-full rounded-full bg-[#fdb905]" />
                );

                if (link.href !== "/services") {
                  return (
                    <Link key={link.href} href={link.href} className={linkClass}>
                      {link.label}
                      {underline}
                    </Link>
                  );
                }

                return (
                  <div key={link.href} className="relative group">
                    <Link href={link.href} className={linkClass}>
                      {link.label}
                      <ChevronDown className="w-4 h-4 transition-transform duration-200 group-hover:rotate-180" />
                      {underline}
                    </Link>
                    <div className="invisible opacity-0 translate-y-2 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:visible group-focus-within:opacity-100 group-focus-within:translate-y-0 transition-all duration-200 absolute left-1/2 -translate-x-1/2 top-full pt-3">
                      <div className="w-72 rounded-2xl border border-[#fdb905]/25 bg-paper p-2 shadow-[0_18px_40px_rgba(18,20,28,0.12)]">
                        {serviceCategories.map((cat) => (
                          <Link
                            key={cat.id}
                            href={`/services#${cat.id}`}
                            className="block rounded-xl px-4 py-2.5 text-sm font-medium text-ink hover:bg-[#fdb905]/10"
                          >
                            {cat.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* CTA + Hamburger */}
            <div className="ml-auto flex items-center gap-3 shrink-0">
              <AnimatedThemeToggler
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:text-[#f5a300] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink [&_svg]:h-5 [&_svg]:w-5"
                title="Switch light / dark theme"
              />
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  setEnquiryOpen(true);
                }}
                className="btn-honey hidden xl:inline-flex"
              >
                Get Free Audit
                <ArrowUpRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="xl:hidden text-ink p-2"
                aria-label="Toggle menu"
              >
                {mobileOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </nav>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="xl:hidden bg-paper/75 backdrop-blur-2xl backdrop-saturate-150 border-t border-[#fdb905]/25 overflow-hidden"
            >
              <div className="px-4 py-6 space-y-2">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative block text-base py-2 pl-3 rounded-md transition-colors duration-300 ${
                      isActiveLink(link.href)
                        ? "font-bold text-ink bg-[#fdb905]/15"
                        : "font-medium text-ink/85 hover:text-ink"
                    }`}
                  >
                    {isActiveLink(link.href) && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-[#fdb905]" />
                    )}
                    {link.label}
                  </Link>
                ))}
                <div className="flex items-center gap-3 pt-3">
                  <a
                    href={`tel:${SITE_CONFIG.phone.replace(/\s/g, "")}`}
                    aria-label="Call us"
                    className="btn-light btn-icon"
                  >
                    <Phone className="w-5 h-5" />
                  </a>
                  <a
                    href={`https://wa.me/${SITE_CONFIG.whatsapp}?text=Hi%20BuzingBee%2C%20I%27m%20interested%20in%20your%20services.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="WhatsApp us"
                    className="btn-light btn-icon !text-green-600"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      setEnquiryOpen(true);
                    }}
                    className="btn-honey flex-1"
                  >
                    Get Free Audit
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
      {mounted ? createPortal(enquiryModal, document.body) : null}
    </>
  );
}
