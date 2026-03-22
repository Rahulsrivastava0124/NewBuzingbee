"use client";

import { MessageCircle } from "lucide-react";
import { SITE_CONFIG } from "@/lib/constants";

export default function FloatingButtons() {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      <a
        href={`https://wa.me/${SITE_CONFIG.whatsapp}?text=Hi%20BuzingBee%2C%20I%27m%20interested%20in%20your%20services.`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="w-14 h-14 rounded-full bg-[#25D366] flex items-center justify-center
                   shadow-[0_0_20px_rgba(37,211,102,0.4)] hover:scale-110
                   transition-transform duration-300"
      >
        <MessageCircle className="w-6 h-6 text-white" />
      </a>
    </div>
  );
}
