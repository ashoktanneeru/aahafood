import Link from "next/link";
import { MessageCircleMore } from "lucide-react";

import { siteConfig } from "@/lib/site-config";

export function FloatingWhatsApp() {
  return (
    <Link
      href={siteConfig.whatsappLink}
      target="_blank"
      className="fixed bottom-5 right-5 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-brand-green text-white shadow-float transition hover:scale-105"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircleMore className="h-6 w-6" />
    </Link>
  );
}
