import { CategoriesSection } from "@/components/categories-section";
import { FeaturedProducts } from "@/components/featured-products";
import { HeroSection } from "@/components/hero-section";
import { HomeCta } from "@/components/home-cta";
import { TestimonialsSection } from "@/components/testimonials-section";
import { WhyChooseUs } from "@/components/why-choose-us";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturedProducts />
      <CategoriesSection />
      <WhyChooseUs />
      <TestimonialsSection />
      <HomeCta />
    </>
  );
}
