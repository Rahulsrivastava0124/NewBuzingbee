import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { legalMetadata, type LegalSection } from "@/components/LegalPage";
import { SITE_CONFIG } from "@/lib/constants";

const PATH = "/cookie-policy";

export const metadata: Metadata = legalMetadata(
  "Cookie Policy",
  "Which cookies and browser storage the BuzingBee website uses, why, and how you can control them.",
  PATH,
);

const items = [
  {
    name: "theme",
    type: "Local storage",
    provider: SITE_CONFIG.name,
    purpose: "Remembers whether you chose light or dark mode.",
    duration: "Until you clear it",
  },
  {
    name: "Cloudflare Turnstile",
    type: "Essential / security",
    provider: "Cloudflare",
    purpose: "Checks that form submissions come from a person, not a bot.",
    duration: "Short-lived, during the check",
  },
  {
    name: "Chat session ID",
    type: "Functional (in memory, not saved)",
    provider: SITE_CONFIG.name,
    purpose: "Keeps your chat assistant conversation together while the page is open.",
    duration: "Until you close or reload the page",
  },
];

const sections: LegalSection[] = [
  {
    id: "what",
    title: "What cookies are",
    body: (
      <p>
        Cookies are small text files a website saves in your browser. Similar
        tools, such as local storage, keep small pieces of information on your
        device. In this policy, &quot;cookies&quot; covers both.
      </p>
    ),
  },
  {
    id: "which",
    title: "Cookies we use",
    body: (
      <>
        <p>
          We keep cookies to a minimum. We do <strong>not</strong> use
          advertising cookies or sell your browsing data. Our page-view counter
          works without setting any cookie.
        </p>
        <div className="mt-4 overflow-x-auto rounded-card border border-border">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-card text-textHeading">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Provider</th>
                <th className="px-4 py-3 font-semibold">Purpose</th>
                <th className="px-4 py-3 font-semibold">Duration</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.name} className="border-t border-border align-top">
                  <td className="px-4 py-3 font-medium text-textHeading">{c.name}</td>
                  <td className="px-4 py-3">{c.type}</td>
                  <td className="px-4 py-3">{c.provider}</td>
                  <td className="px-4 py-3">{c.purpose}</td>
                  <td className="px-4 py-3">{c.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    ),
  },
  {
    id: "third-party",
    title: "Third-party content",
    body: (
      <p>
        Some pages may embed or link to content from other services, such as
        social media profiles, videos, or maps. Those services may set their
        own cookies under their own policies, which we do not control. If we
        add analytics or advertising cookies in the future, we will update this
        policy and ask for your consent first where the law requires it.
      </p>
    ),
  },
  {
    id: "control",
    title: "How to control cookies",
    body: (
      <>
        <p>
          You can block or delete cookies in your browser settings. Blocking
          essential cookies may stop our contact form or chat assistant from
          working. Browser help pages:
        </p>
        <ul>
          <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">Google Chrome</a></li>
          <li><a href="https://support.mozilla.org/en-US/kb/clear-cookies-and-site-data-firefox" target="_blank" rel="noopener noreferrer">Mozilla Firefox</a></li>
          <li><a href="https://support.apple.com/en-in/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer">Safari</a></li>
          <li><a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer">Microsoft Edge</a></li>
        </ul>
      </>
    ),
  },
  {
    id: "more",
    title: "More information",
    body: (
      <p>
        To learn how we handle personal information more broadly, read our{" "}
        <Link href="/privacy-policy">Privacy Policy</Link>.
      </p>
    ),
  },
];

export default function CookiePolicyPage() {
  return (
    <LegalPage
      title="Cookie Policy"
      lastUpdated="25 November 2026"
      currentHref={PATH}
      intro={
        <p>
          This policy explains the cookies and similar technologies used on the{" "}
          {SITE_CONFIG.name} Website and how you can manage them.
        </p>
      }
      sections={sections}
    />
  );
}
