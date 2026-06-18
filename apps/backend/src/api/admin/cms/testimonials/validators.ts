import { z } from "zod"

export const CreateTestimonialSchema = z.object({
  quote: z.string(),
  name: z.string(),
  city: z.string().nullish(),
  rank: z.number().nullish(),
  published: z.boolean().optional(),
})
export type CreateTestimonialSchema = z.infer<typeof CreateTestimonialSchema>

export const UpdateTestimonialSchema = CreateTestimonialSchema.partial()
export type UpdateTestimonialSchema = z.infer<typeof UpdateTestimonialSchema>
