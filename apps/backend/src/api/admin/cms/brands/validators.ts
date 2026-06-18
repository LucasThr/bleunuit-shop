import { z } from "zod"

export const CreateBrandSchema = z.object({
  name: z.string(),
  slug: z.string(),
  logo: z.string().nullish(),
  website: z.string().nullish(),
  description: z.string().nullish(),
  rank: z.number().nullish(),
})
export type CreateBrandSchema = z.infer<typeof CreateBrandSchema>

export const UpdateBrandSchema = CreateBrandSchema.partial()
export type UpdateBrandSchema = z.infer<typeof UpdateBrandSchema>
