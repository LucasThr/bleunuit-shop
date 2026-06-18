import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { CMS_MODULE } from "../../../../modules/cms"
import CmsModuleService from "../../../../modules/cms/service"
import { createTestimonialWorkflow } from "../../../../workflows/testimonial"
import { CreateTestimonialSchema } from "./validators"

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const cms: CmsModuleService = req.scope.resolve(CMS_MODULE)
  const [items, count] = await cms.listAndCountTestimonials(
    {},
    { order: { rank: "ASC" } }
  )
  return res.json({ items, count })
}

export async function POST(
  req: AuthenticatedMedusaRequest<CreateTestimonialSchema>,
  res: MedusaResponse
) {
  const { result } = await createTestimonialWorkflow(req.scope).run({
    input: req.validatedBody,
  })
  return res.json({ item: result })
}
