"use client";

import { usePathname } from "next/navigation";

import { FloatingWhatsApp } from "@/components/floating-whatsapp";
import { Navbar } from "@/components/navbar";
import { SiteFooter } from "@/components/site-footer";
import { VisitorTracker } from "@/components/visitor-tracker";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");

  if (isAdminRoute) {
    return (
      <>
        {children}
        <VisitorTracker disabled />
      </>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <Navbar />
      <main className="pt-24 sm:pt-28">{children}</main>
      <SiteFooter />
      <FloatingWhatsApp />
      <VisitorTracker />
    </div>
  );
}
