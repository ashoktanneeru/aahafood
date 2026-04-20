import { CategoriesSection } from "@/components/categories-section";
import { FeaturedProducts } from "@/components/featured-products";
import { HeroSection } from "@/components/hero-section";
import { HomeCta } from "@/components/home-cta";
import { TestimonialsSection } from "@/components/testimonials-section";
import { WhyChooseUs } from "@/components/why-choose-us";
import { getHomepageContent } from "@/lib/homepage-content";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const homepageContent = await getHomepageContent();

  return (
    <>
      <HeroSection videos={homepageContent.heroVideos} />
      <FeaturedProducts />
      <CategoriesSection />
      <WhyChooseUs />
      <TestimonialsSection testimonials={homepageContent.testimonials} />
      <HomeCta />
    </>
  );
}
