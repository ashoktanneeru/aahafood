function resolveSiteUrl() {
  const explicitUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (explicitUrl) {
    return explicitUrl.startsWith("http") ? explicitUrl : `https://${explicitUrl}`;
  }

  const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() || process.env.VERCEL_URL?.trim();

  if (vercelUrl) {
    return vercelUrl.startsWith("http") ? vercelUrl : `https://${vercelUrl}`;
  }

  return "http://localhost:3000";
}

export const siteConfig = {
  name: "AahaFoods",
  description:
    "AahaFoods brings premium homemade Indian pickles, spice powders, snacks, and pantry staples to your doorstep with a warm handcrafted touch.",
  url: resolveSiteUrl(),
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "919999999999",
  razorpayLink:
    process.env.NEXT_PUBLIC_RAZORPAY_LINK ?? "https://rzp.io/l/aahafoods-demo",
  get whatsappLink() {
    return `https://wa.me/${this.whatsappNumber}`;
  },
};
