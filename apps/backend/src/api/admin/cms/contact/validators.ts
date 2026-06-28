import { z } from "zod"

const HoursRow = z.object({
  label: z.string(),
  value: z.string(),
})

// All fields optional/nullable: the admin form saves the whole contact block
// at once, and any field may be left empty (the storefront has fallbacks).
export const UpdateContactSchema = z.object({
  store_name: z.string().nullish(),
  address: z.string().nullish(),
  phone: z.string().nullish(),
  email: z.string().nullish(),
  hours: z.array(HoursRow).nullish(),
})

export type UpdateContactSchema = z.infer<typeof UpdateContactSchema>
