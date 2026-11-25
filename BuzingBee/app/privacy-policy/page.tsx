import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { legalMetadata, type LegalSection } from "@/components/LegalPage";
import { SITE_CONFIG } from "@/lib/constants";

const PATH = "/privacy-policy";

export const metadata: Metadata = legalMetadata(
  "Privacy Policy",
  "How BuzingBee collects, uses, stores, and protects personal information shared through our website, forms, chat assistant, and services.",
  PATH,
);

const sections: LegalSection[] = [
  {
    id: "who-we-are",
    title: "Who we are",
    body: (
      <p>
        {SITE_CONFIG.name} is a digital marketing, development, and AI services
        agency based in {SITE_CONFIG.address}. We are responsible for the
        personal information described in this policy. We handle it in line
        with the Digital Personal Data Protection Act, 2023 and the Information
        Technology Act, 2000 of India.
      </p>
    ),
  },
  {
    id: "what-we-collect",
    title: "Information we collect",
    body: (
      <>
        <p><strong>Information you give us</strong></p>
        <ul>
          <li><strong>Enquiry and contact forms:</strong> your name, email address, phone number, company, the service you are interested in, budget, and your message.</li>
          <li><strong>Phone verification:</strong> your phone number and a one-time password (OTP) sent by WhatsApp or SMS to confirm the enquiry is genuine. OTPs expire shortly after they are issued.</li>
          <li><strong>Chat assistant:</strong> the messages you type into the chat widget.</li>
          <li><strong>Clients:</strong> billing name, address, GST number, payment records, project materials, and any account access you share with us to deliver the work.</li>
        </ul>
        <p><strong>Information collected automatically</strong></p>
        <ul>
          <li><strong>Page-view statistics:</strong> the page you visit, your device type (mobile, tablet, or desktop), and the time of the visit. Your IP address is used to count unique visitors and to limit abuse, and is not used to build a profile of you.</li>
          <li><strong>Bot protection:</strong> our forms use Cloudflare Turnstile, which checks browser signals to tell people and bots apart.</li>
          <li><strong>Server logs:</strong> standard technical data such as IP address, browser type, and error details, kept for security and troubleshooting.</li>
        </ul>
        <p>
          We do not knowingly collect sensitive personal data such as financial
          account passwords, health data, or biometric data through this
          Website.
        </p>
      </>
    ),
  },
  {
    id: "how-we-use",
    title: "How we use your information",
    body: (
      <ul>
        <li>To reply to your enquiry, send quotes, and arrange calls.</li>
        <li>To deliver, invoice, and support the services you buy from us.</li>
        <li>To send a confirmation or thank-you message after you contact us.</li>
        <li>To keep the Website secure and prevent spam, fraud, and abuse.</li>
        <li>To understand which pages are useful and improve the Website.</li>
        <li>To meet legal, tax, and accounting obligations.</li>
      </ul>
    ),
  },
  {
    id: "legal-basis",
    title: "Why we are allowed to use it",
    body: (
      <p>
        We process your information because you gave consent by submitting a
        form or chatting with us, because we need it to perform a contract with
        you, or because the law requires it (for example, keeping invoices).
        You can withdraw consent at any time by contacting us; this does not
        affect processing already done.
      </p>
    ),
  },
  {
    id: "sharing",
    title: "Who we share it with",
    body: (
      <>
        <p>We do not sell or rent your personal information. We share it only with:</p>
        <ul>
          <li><strong>Service providers</strong> that help us run the business: cloud hosting and database providers, email delivery services, WhatsApp/SMS messaging providers for OTPs, Cloudflare for bot protection, and the automation and AI services that power our chat assistant.</li>
          <li><strong>Payment providers</strong> and banks, when you pay an invoice.</li>
          <li><strong>Authorities</strong>, when required by law or to protect our rights or the safety of others.</li>
        </ul>
        <p>
          Some providers may store data on servers outside India. Where that
          happens, we use providers with appropriate safeguards and share only
          what they need.
        </p>
      </>
    ),
  },
  {
    id: "retention",
    title: "How long we keep it",
    body: (
      <ul>
        <li>Enquiries and lead records: up to 24 months after our last contact, unless you become a client.</li>
        <li>Client and billing records: as long as required by Indian tax and accounting law (usually 8 years).</li>
        <li>OTP codes: deleted automatically after they expire.</li>
        <li>Page-view statistics: kept in aggregated form.</li>
      </ul>
    ),
  },
  {
    id: "security",
    title: "How we protect it",
    body: (
      <p>
        We use HTTPS encryption, access controls, password hashing, encrypted
        storage of sensitive settings, and audit logs on our admin systems. No
        method of transmission or storage is completely secure, but we work to
        protect your data and will notify affected people and authorities of a
        personal data breach as required by law.
      </p>
    ),
  },
  {
    id: "your-rights",
    title: "Your rights",
    body: (
      <>
        <p>You can ask us to:</p>
        <ul>
          <li>Tell you what personal information we hold about you.</li>
          <li>Correct or update inaccurate information.</li>
          <li>Delete your information, where we are not required to keep it.</li>
          <li>Withdraw your consent and stop marketing messages.</li>
          <li>Nominate another person to exercise these rights on your behalf.</li>
        </ul>
        <p>
          Email <a href={`mailto:${SITE_CONFIG.email}`}>{SITE_CONFIG.email}</a>{" "}
          with your request. We will respond within 30 days. If you are not
          satisfied, you may complain to the Data Protection Board of India.
        </p>
      </>
    ),
  },
  {
    id: "cookies",
    title: "Cookies and local storage",
    body: (
      <p>
        We use only a small number of essential cookies and browser storage
        items. See our <Link href="/cookie-policy">Cookie Policy</Link> for
        details.
      </p>
    ),
  },
  {
    id: "children",
    title: "Children",
    body: (
      <p>
        Our services are meant for businesses and adults. We do not knowingly
        collect personal information from anyone under 18. If you believe a
        child has sent us their data, contact us and we will delete it.
      </p>
    ),
  },
  {
    id: "grievance",
    title: "Grievance officer",
    body: (
      <p>
        For any privacy concern or complaint, contact our Grievance Officer at{" "}
        <a href={`mailto:${SITE_CONFIG.email}`}>{SITE_CONFIG.email}</a> or{" "}
        <a href={`tel:${SITE_CONFIG.phone}`}>{SITE_CONFIG.phone}</a>,{" "}
        {SITE_CONFIG.workingHours}.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: (
      <p>
        We may update this policy as our services or the law change. The
        &quot;Last updated&quot; date shows the current version. For significant
        changes, we will place a notice on the Website.
      </p>
    ),
  },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      lastUpdated="25 November 2026"
      currentHref={PATH}
      intro={
        <p>
          Your privacy matters to us. This policy explains what information we
          collect when you use our Website or work with us, why we collect it,
          and the choices you have.
        </p>
      }
      sections={sections}
    />
  );
}
