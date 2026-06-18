import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  updateQuoteWorkflow,
  deleteQuoteWorkflow,
} from "../../../../workflows/quote"
import { UpdateQuoteSchema } from "../validators"

export async function POST(
  req: AuthenticatedMedusaRequest<UpdateQuoteSchema>,
  res: MedusaResponse
) {
  const { result } = await updateQuoteWorkflow(req.scope).run({
    input: { id: req.params.id, ...req.validatedBody },
  })
  return res.json({ item: result })
}

export async function DELETE(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  await deleteQuoteWorkflow(req.scope).run({
    input: { id: req.params.id },
  })
  return res.json({ id: req.params.id, object: "quote_request", deleted: true })
}
