import type { Metadata } from "next";
import { Comfortaa } from "next/font/google";

import { CartProvider } from "@/components/cart-provider";
import { FloatingWhatsApp } from "@/components/floating-whatsapp";
import { Navbar } from "@/components/navbar";
import { SiteFooter } from "@/components/site-footer";
import { ThemeProvider } from "@/components/theme-provider";
import { siteConfig } from "@/lib/site-config";

import "./globals.css";

const comfortaa = Comfortaa({
  subsets: ["latin"],
  variable: "--font-comfortaa",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: [
    "homemade food",
    "Indian pickles",
    "spice powders",
    "traditional snacks",
    "AahaFoods",
  ],
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: "/brand/logo-full-color.png",
        width: 796,
        height: 241,
        alt: siteConfig.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: ["/brand/logo-full-color.png"],
  },
  alternates: {
    canonical: siteConfig.url,
  },
  icons: {
    icon: "/brand/icon.png",
    apple: "/brand/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={comfortaa.variable}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <CartProvider>
            <div className="relative min-h-screen overflow-x-hidden">
              <Navbar />
              <main className="pt-24 sm:pt-28">{children}</main>
              <SiteFooter />
              <FloatingWhatsApp />
            </div>
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
