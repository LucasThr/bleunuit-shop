// Storefront CMS reads from the Medusa backend (custom `cms` module), via the
// /store/cms/* routes. Uses the same Medusa SDK instance as the commerce
// calls, so the publishable key is sent automatically. Each function returns
// the same shape the storefront previously got from Directus, so the Astro
// templates are unchanged.
import { sdk } from "./medusa";

export type HomepageContent = {
  hero_badge?: string | null;
  hero_location?: string | null;
  hero_title?: string | null;
  hero_subtitle?: string | null;
  hero_image?: string | null;
  hero_highlights?: { title: string; description: string }[] | null;
  hero_promo_eyebrow?: string | null;
  hero_promo_value?: string | null;
  hero_promo_label?: string | null;
  hero_promo_note?: string | null;
  value_props?: { eyebrow: string; title: string; description: string }[] | null;
  method_title?: string | null;
  method_intro?: string | null;
  method_steps?: { title: string; description: string }[] | null;
  cta_title?: string | null;
  cta_text?: string | null;
};

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  publish_date: string;
  author: string;
  excerpt?: string | null;
  featured_image?: string | null;
  category: string;
  content?: string | null;
  published: boolean;
};

export type Store = {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  postal_code: string;
  phone: string;
  email: string;
  hours?: Record<string, string> | null;
  map_url?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  additional_info?: string | null;
  description?: string | null;
  image?: string | null;
};

export type Testimonial = {
  id: string;
  quote: string;
  name: string;
  city?: string | null;
  rank?: number | null;
  published: boolean;
};

// ---- Homepage (singleton) -------------------------------------------------

export async function getHomepage(): Promise<HomepageContent | null> {
  const { homepage } = await sdk.client.fetch<{
    homepage: HomepageContent | null;
  }>("/store/cms/homepage");
  return homepage;
}

// ---- Blog posts -----------------------------------------------------------

export async function getAllBlogPosts(): Promise<BlogPost[]> {
  const { blog_posts } = await sdk.client.fetch<{ blog_posts: BlogPost[] }>(
    "/store/cms/blog-posts"
  );
  return blog_posts ?? [];
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const posts = await getAllBlogPosts();
  return posts.find((p) => p.slug === slug) ?? null;
}

export async function getBlogPostsByCategory(
  category: string
): Promise<BlogPost[]> {
  const posts = await getAllBlogPosts();
  return posts.filter((p) => p.category === category);
}

// ---- Stores ---------------------------------------------------------------

export async function getAllStores(): Promise<Store[]> {
  const { stores } = await sdk.client.fetch<{ stores: Store[] }>(
    "/store/cms/stores"
  );
  return stores ?? [];
}

export async function getStoreBySlug(slug: string): Promise<Store | null> {
  const stores = await getAllStores();
  return stores.find((s) => s.slug === slug) ?? null;
}

// ---- Testimonials ---------------------------------------------------------

export async function getTestimonials(): Promise<Testimonial[]> {
  const { testimonials } = await sdk.client.fetch<{
    testimonials: Testimonial[];
  }>("/store/cms/testimonials");
  return testimonials ?? [];
}
