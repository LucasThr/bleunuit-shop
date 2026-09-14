import { z } from "zod"

// Keep in sync with `categoryNames` in apps/storefront/src/pages/blog/index.astro
// and blog/[slug].astro: the storefront only knows how to label these keys.
export const BLOG_CATEGORIES = [
  "sleep-tips",
  "product-guides",
  "company-news",
] as const

export const CreateBlogPostSchema = z.object({
  title: z.string(),
  slug: z
    .string()
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "L'adresse de la page ne peut contenir que des minuscules, des chiffres et des tirets."
    ),
  publish_date: z.string().nullish(),
  author: z.string().nullish(),
  excerpt: z.string().nullish(),
  featured_image: z.string().nullish(),
  category: z.enum(BLOG_CATEGORIES).nullish(),
  content: z.string().nullish(),
  published: z.boolean().optional(),
})
export type CreateBlogPostSchema = z.infer<typeof CreateBlogPostSchema>

export const UpdateBlogPostSchema = CreateBlogPostSchema.partial()
export type UpdateBlogPostSchema = z.infer<typeof UpdateBlogPostSchema>
