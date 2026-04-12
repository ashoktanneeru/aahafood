export const siteConfig = {
  name: "AahaFoods",
  description:
    "AahaFoods brings premium homemade Indian pickles, spice powders, snacks, and pantry staples to your doorstep with a warm handcrafted touch.",
  url: "https://aahafoods.vercel.app",
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "919999999999",
  razorpayLink:
    process.env.NEXT_PUBLIC_RAZORPAY_LINK ?? "https://rzp.io/l/aahafoods-demo",
  get whatsappLink() {
    return `https://wa.me/${this.whatsappNumber}`;
  },
};
