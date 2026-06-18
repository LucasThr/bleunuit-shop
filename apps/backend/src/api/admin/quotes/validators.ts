import { z } from "zod"

// Admin updates the workflow status of a quote request.
export const UpdateQuoteSchema = z.object({
  status: z.enum(["pending", "handled"]),
})
export type UpdateQuoteSchema = z.infer<typeof UpdateQuoteSchema>
