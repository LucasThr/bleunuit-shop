import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { createQuoteWorkflow } from "../../../workflows/quote"
import { CreateQuoteSchema } from "./validators"

// Public: a storefront visitor requests a quote for an in-store-only product.
export async function POST(
  req: MedusaRequest<CreateQuoteSchema>,
  res: MedusaResponse
) {
  const { result } = await createQuoteWorkflow(req.scope).run({
    input: req.validatedBody,
  })
  return res.json({ quote: result })
}
