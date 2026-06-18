import { z } from "zod"

const Hours = z.object({
  monday: z.string().optional(),
  tuesday: z.string().optional(),
  wednesday: z.string().optional(),
  thursday: z.string().optional(),
  friday: z.string().optional(),
  saturday: z.string().optional(),
  sunday: z.string().optional(),
})

export const CreateStoreSchema = z.object({
  name: z.string(),
  slug: z.string(),
  address: z.string().nullish(),
  city: z.string().nullish(),
  postal_code: z.string().nullish(),
  phone: z.string().nullish(),
  email: z.string().nullish(),
  hours: Hours.nullish(),
  map_url: z.string().nullish(),
  latitude: z.number().nullish(),
  longitude: z.number().nullish(),
  additional_info: z.string().nullish(),
  description: z.string().nullish(),
  image: z.string().nullish(),
})
export type CreateStoreSchema = z.infer<typeof CreateStoreSchema>

export const UpdateStoreSchema = CreateStoreSchema.partial()
export type UpdateStoreSchema = z.infer<typeof UpdateStoreSchema>
