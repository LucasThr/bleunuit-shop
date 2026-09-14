import { z } from "zod"

// Opening hours as a flat list of intervals: several rows per day cover a
// lunch break, and a day with no row is closed.
const Time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Heure attendue au format HH:MM")

const Hours = z.array(
  z.object({
    day: z.enum([
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ]),
    opens: Time,
    closes: Time,
  })
)

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
