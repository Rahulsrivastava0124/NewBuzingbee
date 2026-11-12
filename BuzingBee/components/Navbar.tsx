"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  Phone,
  MessageCircle,
  ArrowUpRight,
  ChevronDown,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { NAV_LINKS, SITE_CONFIG } from "@/lib/constants";
import { AUDIT_POPUP_EVENT, openAuditPopup } from "@/lib/audit-popup";
import { SERVICES } from "@/components/ServicesGrid";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import TurnstileWidget, { TURNSTILE_SITE_KEY } from "@/components/TurnstileWidget";

// desktop menu: the site's own links (the external Restaurant link stays in mobile menu + footer)
const DESKTOP_LINKS = NAV_LINKS.filter((link) => link.href.startsWith("/"));

// homepage sections the menu links to, in page order (used to underline the one in view)
const SECTION_IDS = ["about", "work", "insights", "all-services"];

const ENQUIRY_API_URL = process.env.NEXT_PUBLIC_API_BASE_URL
  ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/enquiries/submit`
  : "https://api.buzingbee.com/api/enquiries/submit";

const EMPTY_FORM = { name: "", email: "", phone: "", message: "" };

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [enquiryForm, setEnquiryForm] = useState(EMPTY_FORM);
  const [submitState, setSubmitState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [submitMessage, setSubmitMessage] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaReset, setCaptchaReset] = useState(0);
  const pathname = usePathname();
  const currentPath = pathname || "/";
  const [activeSection, setActiveSection] = useState("");

  // scroll-spy: the active section is the last one whose top has scrolled up to just
  // under the navbar; above the first one, Home is active
  useEffect(() => {
    const update = () => {
      let current = "";
      for (const id of SECTION_IDS) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 140) current = id;
      }
      setActiveSection(current);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [pathname]);

  const isActiveLink = (href: string) => {
    if (currentPath !== "/") return false;
    if (href === "/") return activeSection === "";
    const id = href.slice(2); // "/#about" → "about"
    return activeSection === id;
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

  // other parts of the page open the popup via openAuditPopup() (lib/audit-popup.ts)
  useEffect(() => {
    const open = (e: Event) => {
      const service = (e as CustomEvent<{ service?: string }>).detail?.service;
      if (service) {
        setEnquiryForm((prev) => ({
          ...prev,
          message: prev.message || `I'm interested in ${service}.`,
        }));
      }
      // clear the last result, but let a send that's still in flight report back here
      setSubmitState((state) => (state === "submitting" ? state : "idle"));
      setSubmitMessage("");
      setMobileOpen(false);
      setEnquiryOpen(true);
    };
    window.addEventListener(AUDIT_POPUP_EVENT, open);
    return () => window.removeEventListener(AUDIT_POPUP_EVENT, open);
  }, []);

  useEffect(() => {
    if (!enquiryOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [enquiryOpen]);

  // sends the enquiry to the admin panel (same API the old contact form used)
  const handleEnquirySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (TURNSTILE_SITE_KEY && !captchaToken) {
      setSubmitState("error");
      setSubmitMessage("Please complete the verification below.");
      return;
    }

    setSubmitState("submitting");
    setSubmitMessage("");

    try {
      const response = await fetch(ENQUIRY_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...enquiryForm, source: "audit-popup", captchaToken }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.message || "Failed to submit enquiry");

      setSubmitState("success");
      setSubmitMessage(payload?.message || "Thank you! We'll be in touch shortly with your audit.");
      setEnquiryForm(EMPTY_FORM);
    } catch (error) {
      setSubmitState("error");
      setSubmitMessage(
        error instanceof Error ? error.message : "Something went wrong. Please try again.",
      );
    } finally {
      setCaptchaReset((n) => n + 1); // a token can only be used once
    }
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

              <TurnstileWidget onToken={setCaptchaToken} resetSignal={captchaReset} />

              <button
                type="submit"
                disabled={submitState === "submitting"}
                className="btn-primary w-full mt-1 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitState === "submitting" ? "Sending…" : "Request my free audit"}
              </button>

              {submitState === "success" && (
                <p role="status" className="flex items-start gap-2 rounded-xl bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-400">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {submitMessage}
                </p>
              )}
              {submitState === "error" && (
                <p role="alert" className="flex items-start gap-2 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {submitMessage}
                </p>
              )}
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

                if (link.label !== "Services") {
                  return (
                    <Link key={link.href} href={link.href} className={linkClass}>
                      {link.label}
                      {underline}
                    </Link>
                  );
                }

                // Services: link to the grid, plus a dropdown of the 8 services
                // (each opens the free-audit popup pre-filled with that service)
                return (
                  <div key={link.href} className="relative group">
                    <Link href={link.href} className={linkClass}>
                      {link.label}
                      <ChevronDown className="w-4 h-4 transition-transform duration-200 group-hover:rotate-180" />
                      {underline}
                    </Link>
                    <div className="invisible opacity-0 translate-y-2 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:visible group-focus-within:opacity-100 group-focus-within:translate-y-0 transition-all duration-200 absolute left-1/2 -translate-x-1/2 top-full pt-3">
                      <div className="w-80 rounded-2xl border border-[#fdb905]/25 bg-surface p-2 shadow-[0_18px_40px_rgba(18,20,28,0.12)]">
                        {SERVICES.map((svc) => (
                          <button
                            key={svc.title}
                            type="button"
                            onClick={() => openAuditPopup(svc.title)}
                            className="block w-full rounded-xl px-4 py-2.5 text-left text-sm font-medium text-ink hover:bg-[#fdb905]/10 focus-visible:bg-[#fdb905]/10 focus-visible:outline-none"
                          >
                            {svc.title}
                          </button>
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
                onClick={() => openAuditPopup()}
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
                    onClick={() => setMobileOpen(false)} // same-page section jumps don't change the route
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
                    onClick={() => openAuditPopup()}
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
