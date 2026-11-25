import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { legalMetadata, type LegalSection } from "@/components/LegalPage";
import { SITE_CONFIG } from "@/lib/constants";

const PATH = "/terms-and-conditions";

export const metadata: Metadata = legalMetadata(
  "Terms & Conditions",
  "The terms that govern use of the BuzingBee website and our digital marketing, web development, and AI services.",
  PATH,
);

const sections: LegalSection[] = [
  {
    id: "acceptance",
    title: "Acceptance of these terms",
    body: (
      <p>
        By using {SITE_CONFIG.url.replace("https://", "")} (the &quot;Website&quot;) or
        engaging {SITE_CONFIG.name} (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) for any service, you
        agree to these Terms &amp; Conditions, our{" "}
        <Link href="/privacy-policy">Privacy Policy</Link>, our{" "}
        <Link href="/refund-policy">Refund Policy</Link>, and our{" "}
        <Link href="/cookie-policy">Cookie Policy</Link>. If you do not agree,
        please do not use the Website or our services.
      </p>
    ),
  },
  {
    id: "services",
    title: "Our services",
    body: (
      <>
        <p>
          We provide digital marketing, website and app development, SEO, paid
          advertising management, branding, and AI and automation services. The
          exact scope, deliverables, timeline, and price of any engagement are
          set out in a written proposal, quotation, invoice, or agreement
          (the &quot;Project Agreement&quot;). If the Project Agreement conflicts with
          these terms, the Project Agreement wins for that project.
        </p>
        <p>
          Prices shown on the Website (for example on the{" "}
          <Link href="/pricing">pricing</Link> and{" "}
          <Link href="/startup">startup</Link> pages) are indicative and may
          change. The price that applies is the one in your accepted quotation
          or invoice.
        </p>
      </>
    ),
  },
  {
    id: "client-responsibilities",
    title: "Your responsibilities",
    body: (
      <ul>
        <li>Give accurate information and respond to requests for content, approvals, and feedback in good time. Delays on your side may move delivery dates.</li>
        <li>Make sure any text, images, logos, or other material you send us is yours to use, or that you have permission to use it.</li>
        <li>Keep login details, domain, hosting, and ad-account credentials you share with us accurate, and tell us when access should be removed.</li>
        <li>Use our deliverables lawfully and not for anything misleading, defamatory, or illegal.</li>
      </ul>
    ),
  },
  {
    id: "payments",
    title: "Fees and payment",
    body: (
      <ul>
        <li>Unless the Project Agreement says otherwise, projects begin after an advance payment, and the balance is due before final delivery or go-live.</li>
        <li>Monthly retainers (such as marketing or SEO plans) are billed in advance for each month and renew until cancelled.</li>
        <li>Invoices are payable within 7 days of issue unless stated otherwise. All amounts are in Indian Rupees (INR) and exclude applicable taxes such as GST, which are added where required.</li>
        <li>We may pause work, or withhold handover of source files and credentials, while payments are overdue.</li>
        <li>Third-party costs, such as domains, hosting, paid plugins, stock media, and advertising spend on Google, Meta, or other platforms, are separate from our fees and are paid by you unless the Project Agreement includes them.</li>
      </ul>
    ),
  },
  {
    id: "revisions",
    title: "Revisions and changes in scope",
    body: (
      <p>
        Each package includes the number of revision rounds stated in your
        Project Agreement. Requests beyond that, or work outside the agreed
        scope, will be quoted separately and started only after you approve the
        new quote.
      </p>
    ),
  },
  {
    id: "ip",
    title: "Intellectual property",
    body: (
      <>
        <p>
          Once you have paid in full, you own the final deliverables created
          specifically for you, such as your website design, content, and
          creatives. Until full payment, all rights stay with us.
        </p>
        <p>
          We keep ownership of our pre-existing tools, code libraries,
          templates, frameworks, and know-how, and grant you a non-exclusive,
          perpetual licence to use them as part of your deliverables.
          Third-party software, fonts, and stock media remain under their own
          licences. Unless you ask us not to, we may show completed work in our
          portfolio and case studies.
        </p>
        <p>
          All content on this Website, including text, graphics, logos, and
          code, belongs to {SITE_CONFIG.name} and may not be copied without
          our written permission.
        </p>
      </>
    ),
  },
  {
    id: "results",
    title: "No guarantee of results",
    body: (
      <p>
        Marketing, SEO, and advertising results depend on factors outside our
        control, including search engine and platform algorithms, competition,
        your budget, and market conditions. We will work with professional care,
        but we do not guarantee specific rankings, traffic, leads, sales, or
        return on ad spend. Any figures we share are estimates, not promises.
      </p>
    ),
  },
  {
    id: "ai",
    title: "AI tools and our chat assistant",
    body: (
      <p>
        Some of our services and the chat assistant on this Website use
        artificial intelligence. AI output can be incomplete or wrong, so please
        do not rely on chat replies as professional, legal, or financial advice.
        Anything the assistant says about prices, timelines, or scope is not
        binding until confirmed in a Project Agreement.
      </p>
    ),
  },
  {
    id: "confidentiality",
    title: "Confidentiality",
    body: (
      <p>
        We each agree to keep the other&apos;s non-public business information
        confidential and use it only for the project, except where disclosure is
        required by law.
      </p>
    ),
  },
  {
    id: "liability",
    title: "Limitation of liability",
    body: (
      <p>
        To the extent the law allows, we are not liable for indirect,
        incidental, or consequential losses, including lost profits, revenue,
        data, or business opportunities, or for outages and policy changes by
        third-party platforms (hosting providers, Google, Meta, and others). Our
        total liability for any claim relating to a project will not exceed the
        fees you paid us for that project in the 3 months before the claim.
      </p>
    ),
  },
  {
    id: "termination",
    title: "Termination",
    body: (
      <p>
        Either party may end an engagement with 15 days&apos; written notice, or
        immediately if the other party seriously breaches these terms and does
        not fix the breach within 7 days of being told. You will pay for all
        work done up to the end date. Refunds, if any, follow our{" "}
        <Link href="/refund-policy">Refund Policy</Link>.
      </p>
    ),
  },
  {
    id: "website-use",
    title: "Use of this Website",
    body: (
      <ul>
        <li>Do not try to gain unauthorised access to the Website, its servers, or our admin systems, or interfere with how they work.</li>
        <li>Do not submit false information, spam, or automated requests through our forms, OTP verification, or chat assistant.</li>
        <li>Links to third-party sites are for convenience only; we are not responsible for their content or practices.</li>
      </ul>
    ),
  },
  {
    id: "law",
    title: "Governing law and disputes",
    body: (
      <p>
        These terms are governed by the laws of India. We will first try to
        resolve any dispute through good-faith discussion. If that fails, the
        courts at Kolkata, West Bengal will have exclusive jurisdiction.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to these terms",
    body: (
      <p>
        We may update these terms from time to time. The &quot;Last updated&quot; date
        above shows the latest version. Changes do not affect a Project
        Agreement already signed unless both parties agree in writing.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms & Conditions"
      lastUpdated="25 November 2026"
      currentHref={PATH}
      intro={
        <p>
          These terms explain the rules for using our Website and working with
          {" "}{SITE_CONFIG.name}. Please read them before starting a project with us.
        </p>
      }
      sections={sections}
    />
  );
}
