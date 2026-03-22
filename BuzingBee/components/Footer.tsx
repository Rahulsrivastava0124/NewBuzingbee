import Link from "next/link";
import { NAV_LINKS, SITE_CONFIG } from "@/lib/constants";
import {
  FaInstagram,
  FaFacebookF,
  FaXTwitter,
  FaLinkedinIn,
} from "react-icons/fa6";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-card border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <img
                src="/bee1-removebg-preview.png"
                alt={SITE_CONFIG.name}
                className="w-8 h-8"
              />
              <span className="text-xl font-bold text-textHeading font-heading">
                Buzing<span className="text-accent">Bee</span>
              </span>
            </Link>
            <p className="text-textMuted text-sm leading-relaxed">
              We craft innovative digital marketing strategies and AI-powered
              solutions that help businesses thrive in the digital age.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-textHeading font-bold font-heading mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-textMuted text-sm hover:text-accent transition-colors duration-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-textHeading font-bold font-heading mb-4">
              Services
            </h4>
            <ul className="space-y-2 text-sm text-textMuted">
              <li>Web Design & Development</li>
              <li>Mobile App Development</li>
              <li>AI & ML Development</li>
              <li>SEO Optimization</li>
              <li>Social Media Marketing</li>
              <li>Google & Meta Ads</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-textHeading font-bold font-heading mb-4">
              Contact Us
            </h4>
            <ul className="space-y-2 text-sm text-textMuted">
              <li>{SITE_CONFIG.address}</li>
              <li>
                <a
                  href={`tel:${SITE_CONFIG.phone}`}
                  className="hover:text-accent transition-colors"
                >
                  {SITE_CONFIG.phone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${SITE_CONFIG.email}`}
                  className="hover:text-accent transition-colors"
                >
                  {SITE_CONFIG.email}
                </a>
              </li>
              <li>{SITE_CONFIG.workingHours}</li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-textMuted text-sm">
            &copy; {currentYear} {SITE_CONFIG.name}. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a
              href={SITE_CONFIG.socials.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="w-9 h-9 rounded-full border border-border flex items-center justify-center
                         text-textMuted hover:text-accent hover:border-accent transition-all duration-300"
            >
              <FaInstagram className="w-4 h-4" />
            </a>
            <a
              href={SITE_CONFIG.socials.facebook}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="w-9 h-9 rounded-full border border-border flex items-center justify-center
                         text-textMuted hover:text-accent hover:border-accent transition-all duration-300"
            >
              <FaFacebookF className="w-4 h-4" />
            </a>
            <a
              href={SITE_CONFIG.socials.twitter}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twitter / X"
              className="w-9 h-9 rounded-full border border-border flex items-center justify-center
                         text-textMuted hover:text-accent hover:border-accent transition-all duration-300"
            >
              <FaXTwitter className="w-4 h-4" />
            </a>
            <a
              href={SITE_CONFIG.socials.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="w-9 h-9 rounded-full border border-border flex items-center justify-center
                         text-textMuted hover:text-accent hover:border-accent transition-all duration-300"
            >
              <FaLinkedinIn className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
