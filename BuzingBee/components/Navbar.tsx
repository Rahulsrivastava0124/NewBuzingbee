"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Phone, MessageCircle } from "lucide-react";
import { NAV_LINKS, SITE_CONFIG } from "@/lib/constants";

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
              Quick Enquiry
            </h3>
            <p className="mt-1 text-sm text-textMuted">
              Share your details and our team will contact you shortly.
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
                Submit Enquiry
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
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-bgPrimary/80 backdrop-blur-xl shadow-[0_1px_0_rgba(42,37,32,0.5)]"
            : "bg-transparent"
        }`}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 md:h-20 gap-4 xl:gap-6">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <img
                src="/bee1-removebg-preview.png"
                alt={SITE_CONFIG.name}
                className="w-9 h-9 md:w-10 md:h-10"
              />
              <span className="text-xl md:text-2xl font-bold text-textHeading font-heading">
                Buzing<span className="text-[#FACC15]">Bee</span>
              </span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden xl:flex flex-1 items-center justify-center gap-8 px-4 min-w-0">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative text-sm font-medium transition-colors duration-300 ${
                    isActiveLink(link.href)
                      ? "text-[#8A6500]"
                      : "text-textBody hover:text-[#8A6500]"
                  }`}
                >
                  {link.label}
                  {isActiveLink(link.href) && (
                    <span className="absolute left-0 -bottom-1 h-0.5 w-full rounded-full bg-[#B07D00]" />
                  )}
                </Link>
              ))}
            </div>

            {/* CTA + Hamburger */}
            <div className="ml-auto flex items-center gap-3 md:gap-4 shrink-0">
              <a
                href={`tel:${SITE_CONFIG.phone}`}
                aria-label="Call us"
                className="hidden xl:inline-flex w-20 h-10 items-center justify-center rounded-full border border-[#FACC15] text-[#FACC15] shadow-[0_8px_22px_rgba(31,27,18,0.18)] transition-colors"
              >
                <Phone className="w-4.5 h-4.5" />
              </a>
              <a
                href={`https://wa.me/${SITE_CONFIG.whatsapp}?text=Hi%20BuzingBee%2C%20I%27m%20interested%20in%20your%20services.`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp us"
                className="hidden xl:inline-flex w-10 h-10 items-center justify-center rounded-full border border-green-600 text-green-600 shadow-[0_8px_22px_rgba(31,27,18,0.18)] transition-colors"
              >
                <MessageCircle className="w-4.5 h-4.5" />
              </a>
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  setEnquiryOpen(true);
                }}
                className="hidden xl:inline-flex btn-primary bg-green-500 hover:bg-green-600 text-sm"
              >
                Get Free Call
              </button>
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="xl:hidden text-textHeading p-2"
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
              className="xl:hidden bg-bgPrimary/95 backdrop-blur-xl border-t border-border overflow-hidden"
            >
              <div className="px-4 py-6 space-y-4">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative block text-base font-medium py-2 pl-3 rounded-md transition-colors duration-300 ${
                      isActiveLink(link.href)
                        ? "text-[#8A6500] bg-[#F8EDC6]"
                        : "text-textBody hover:text-[#8A6500]"
                    }`}
                  >
                    {isActiveLink(link.href) && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-[#B07D00]" />
                    )}
                    {link.label}
                  </Link>
                ))}
                <div className="flex items-center gap-3 pt-1">
                  <a
                    href={`tel:${SITE_CONFIG.phone}`}
                    aria-label="Call us"
                    className="inline-flex w-11 h-11 items-center justify-center rounded-full border border-[#FACC15] bg-[#1f1b12] text-[#FACC15] hover:bg-[#2a2418] shadow-[0_8px_22px_rgba(31,27,18,0.18)] transition-colors"
                  >
                    <Phone className="w-5 h-5" />
                  </a>
                  <a
                    href={`https://wa.me/${SITE_CONFIG.whatsapp}?text=Hi%20BuzingBee%2C%20I%27m%20interested%20in%20your%20services.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="WhatsApp us"
                    className="inline-flex w-11 h-11 items-center justify-center rounded-full border border-[#FACC15] bg-[#1f1b12] text-[#FACC15] hover:bg-[#2a2418] shadow-[0_8px_22px_rgba(31,27,18,0.18)] transition-colors"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </a>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    setEnquiryOpen(true);
                  }}
                  className="btn-primary bg-green-400  w-full text-center mt-4"
                >
                  Get Free Call
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
      {mounted ? createPortal(enquiryModal, document.body) : null}
    </>
  );
}
