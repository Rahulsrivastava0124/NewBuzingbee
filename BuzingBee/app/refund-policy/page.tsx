import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { legalMetadata, type LegalSection } from "@/components/LegalPage";
import { SITE_CONFIG } from "@/lib/constants";

const PATH = "/refund-policy";

export const metadata: Metadata = legalMetadata(
  "Refund & Cancellation Policy",
  "BuzingBee's refund and cancellation rules for website, app, marketing, SEO, advertising, and AI service projects and monthly plans.",
  PATH,
);

const sections: LegalSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: (
      <p>
        Our services are custom work, so time and effort start the day a
        project begins. This policy explains when a refund is possible and how
        to cancel. It applies together with our{" "}
        <Link href="/terms-and-conditions">Terms &amp; Conditions</Link> and any
        Project Agreement you sign with us. If your Project Agreement has
        different refund terms, those apply.
      </p>
    ),
  },
  {
    id: "before-start",
    title: "Cancellation before work starts",
    body: (
      <p>
        If you cancel within 48 hours of paying an advance and before we have
        started work (no kickoff call, research, design, or setup has
        happened), we will refund the advance in full, minus any payment
        gateway charges.
      </p>
    ),
  },
  {
    id: "projects",
    title: "Website, app, and design projects",
    body: (
      <ul>
        <li>Once work has started, the advance payment is non-refundable, as it covers planning, research, and resources already committed.</li>
        <li>If you cancel mid-project, you pay for work completed up to the cancellation date. Any amount you paid beyond that will be refunded.</li>
        <li>No refund is due once a deliverable has been approved by you, handed over, or published live.</li>
        <li>If we cannot deliver the agreed scope for reasons on our side, you will receive a refund for the undelivered part of the work.</li>
      </ul>
    ),
  },
  {
    id: "monthly",
    title: "Monthly marketing, SEO, and retainer plans",
    body: (
      <ul>
        <li>Monthly plans are billed in advance and are non-refundable for the month already started.</li>
        <li>You can cancel at any time with 15 days&apos; written notice before your next billing date; you will not be charged for following months.</li>
        <li>Discounted quarterly or yearly plans are not refundable for unused months unless the Project Agreement says otherwise.</li>
      </ul>
    ),
  },
  {
    id: "ad-spend",
    title: "Advertising spend and third-party costs",
    body: (
      <p>
        Money spent on Google, Meta, or other ad platforms, and fees for
        domains, hosting, paid plugins, licences, and stock media, are paid to
        third parties and cannot be refunded by us. Any refund of those amounts
        depends on the provider&apos;s own policy.
      </p>
    ),
  },
  {
    id: "no-refund",
    title: "When refunds are not given",
    body: (
      <ul>
        <li>Dissatisfaction with results such as rankings, traffic, leads, or sales, since these depend on factors outside our control.</li>
        <li>Delays caused by late content, feedback, approvals, or payments from your side.</li>
        <li>A change of mind or change in business plans after work has started.</li>
        <li>Projects paused by you for more than 30 days without reply.</li>
      </ul>
    ),
  },
  {
    id: "how-to",
    title: "How to request a refund or cancel",
    body: (
      <p>
        Email <a href={`mailto:${SITE_CONFIG.email}`}>{SITE_CONFIG.email}</a>{" "}
        from your registered email address with your invoice number and the
        reason for your request. We will reply within 5 working days.
      </p>
    ),
  },
  {
    id: "processing",
    title: "How refunds are paid",
    body: (
      <p>
        Approved refunds are paid to the original payment method, or by bank
        transfer, within 7–10 working days of approval. Your bank may take a
        few extra days to show the amount. Gateway charges and taxes already
        paid to the government may be deducted where the law allows.
      </p>
    ),
  },
];

export default function RefundPolicyPage() {
  return (
    <LegalPage
      title="Refund & Cancellation Policy"
      lastUpdated="25 November 2026"
      currentHref={PATH}
      intro={
        <p>
          We want every client to feel confident working with us. Here is a
          clear explanation of how cancellations and refunds work.
        </p>
      }
      sections={sections}
    />
  );
}
