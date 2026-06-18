import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { CMS_MODULE } from "../../../../../modules/cms"
import CmsModuleService from "../../../../../modules/cms/service"
import {
  updateTestimonialWorkflow,
  deleteTestimonialWorkflow,
} from "../../../../../workflows/testimonial"
import { UpdateTestimonialSchema } from "../validators"

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const cms: CmsModuleService = req.scope.resolve(CMS_MODULE)
  const item = await cms.retrieveTestimonial(req.params.id)
  return res.json({ item })
}

export async function POST(
  req: AuthenticatedMedusaRequest<UpdateTestimonialSchema>,
  res: MedusaResponse
) {
  const { result } = await updateTestimonialWorkflow(req.scope).run({
    input: { id: req.params.id, ...req.validatedBody },
  })
  return res.json({ item: result })
}

export async function DELETE(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  await deleteTestimonialWorkflow(req.scope).run({
    input: { id: req.params.id },
  })
  return res.json({ id: req.params.id, object: "testimonial", deleted: true })
}
