import { z } from "zod"

export const CreateBlogPostSchema = z.object({
  title: z.string(),
  slug: z.string(),
  publish_date: z.string().nullish(),
  author: z.string().nullish(),
  excerpt: z.string().nullish(),
  featured_image: z.string().nullish(),
  category: z.string().nullish(),
  content: z.string().nullish(),
  published: z.boolean().optional(),
})
export type CreateBlogPostSchema = z.infer<typeof CreateBlogPostSchema>

export const UpdateBlogPostSchema = CreateBlogPostSchema.partial()
export type UpdateBlogPostSchema = z.infer<typeof UpdateBlogPostSchema>
