import { createSupabasePublicClient } from "@/lib/supabase";
import { HomepageContent } from "@/lib/types";

type SiteContentRecord = {
  key: string;
  value: HomepageContent | null;
};

export const fallbackHomepageContent: HomepageContent = {
  heroVideos: [
    {
      src: "https://player.vimeo.com/external/434045526.sd.mp4?s=6d484d25cf14f7d8baeb1fed909749d16f285194&profile_id=139&oauth2_token_id=57447761",
      label: "Pickle preparation",
    },
    {
      src: "https://player.vimeo.com/external/434045540.sd.mp4?s=6ca0c4fd6f77b8c65bfe6430e75068d90f196c35&profile_id=139&oauth2_token_id=57447761",
      label: "Spices grinding",
    },
    {
      src: "https://player.vimeo.com/external/371433846.sd.mp4?s=756bbcf7b4ad89c1c3cc596f0dd013d3a7481529&profile_id=139&oauth2_token_id=57447761",
      label: "Traditional cooking",
    },
  ],
  testimonials: [
    {
      name: "Kavya R.",
      quote:
        "The mango pickle tastes exactly like what my grandmother used to make. Rich, balanced, and beautifully packed.",
    },
    {
      name: "Rahul S.",
      quote:
        "The podi and roasted makhana combo has become a repeat order in our house. It feels boutique, but deeply comforting.",
    },
    {
      name: "Shreya P.",
      quote:
        "Finally found a homemade food brand that looks gift-ready and still tastes like it came from a family kitchen.",
    },
  ],
};

function sanitizeHomepageContent(content?: Partial<HomepageContent> | null): HomepageContent {
  const heroVideos =
    content?.heroVideos
      ?.filter((item) => item?.src?.trim() && item?.label?.trim())
      .map((item) => ({
        src: item.src.trim(),
        label: item.label.trim(),
      })) ?? [];

  const testimonials =
    content?.testimonials
      ?.filter((item) => item?.name?.trim() && item?.quote?.trim())
      .map((item) => ({
        name: item.name.trim(),
        quote: item.quote.trim(),
      })) ?? [];

  return {
    heroVideos: heroVideos.length > 0 ? heroVideos : fallbackHomepageContent.heroVideos,
    testimonials: testimonials.length > 0 ? testimonials : fallbackHomepageContent.testimonials,
  };
}

export async function getHomepageContent() {
  const supabase = createSupabasePublicClient();

  if (!supabase) {
    return fallbackHomepageContent;
  }

  try {
    const { data, error } = await supabase
      .from("site_content")
      .select("key, value")
      .eq("key", "homepage")
      .maybeSingle();

    if (error || !data) {
      return fallbackHomepageContent;
    }

    return sanitizeHomepageContent((data as SiteContentRecord).value);
  } catch {
    return fallbackHomepageContent;
  }
}
