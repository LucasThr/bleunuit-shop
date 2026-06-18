import { z } from "zod"

// Public storefront "devis" (quote request) submission.
export const CreateQuoteSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().nullish(),
  message: z.string().nullish(),
  product_id: z.string().nullish(),
  product_title: z.string().nullish(),
})
export type CreateQuoteSchema = z.infer<typeof CreateQuoteSchema>
