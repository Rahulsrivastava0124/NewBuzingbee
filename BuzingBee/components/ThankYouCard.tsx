"use client";

import { CheckCircle } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";

// Who follows up on verified website leads; shown on the thank-you screen
export const LEAD_CONTACT = {
  name: "Sunny",
  role: "Client Success, BuzingBee",
  photo: "/team/sunny.webp",
};

type Props = {
  // visitor's first name, if known
  name?: string | null;
};

// Shown once the visitor's WhatsApp number is verified
export default function ThankYouCard({ name }: Props) {
  const contact = LEAD_CONTACT;
  return (
    <div role="status" className="flex flex-col items-center py-4 text-center">
      <div className="relative">
        <img
          src={contact.photo}
          alt={contact.name}
          width={112}
          height={112}
          className="h-28 w-28 rounded-full border-4 border-accent/40 bg-bgSection object-cover shadow-lg"
        />
        <span
          aria-hidden="true"
          className="absolute bottom-1 right-1 inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-[#25D366] text-white"
        >
          <FaWhatsapp className="h-4 w-4" />
        </span>
      </div>
      <h3 id="thank-you-title" className="mt-5 text-2xl font-bold text-textHeading font-heading">
        Thank you{name ? `, ${name}` : ""}!
      </h3>
      <p className="mt-2 max-w-sm text-sm text-textMuted">
        Your number is verified. <span className="font-semibold text-textHeading">{contact.name}</span> from
        our team will reach out to you shortly. We&apos;ve also sent a confirmation to your email.
      </p>
      <p className="mt-3 text-xs text-textMuted">
        {contact.name} · {contact.role}
      </p>
      <p className="mt-4 flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-400">
        <CheckCircle className="h-4 w-4" />
        Enquiry received
      </p>
    </div>
  );
}
