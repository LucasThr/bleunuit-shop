import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { CMS_MODULE } from "../../../../../modules/cms"
import CmsModuleService from "../../../../../modules/cms/service"
import {
  updateBlogPostWorkflow,
  deleteBlogPostWorkflow,
} from "../../../../../workflows/blog-post"
import { UpdateBlogPostSchema } from "../validators"

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const cms: CmsModuleService = req.scope.resolve(CMS_MODULE)
  const item = await cms.retrieveBlogPost(req.params.id)
  return res.json({ item })
}

export async function POST(
  req: AuthenticatedMedusaRequest<UpdateBlogPostSchema>,
  res: MedusaResponse
) {
  const { result } = await updateBlogPostWorkflow(req.scope).run({
    input: { id: req.params.id, ...req.validatedBody },
  })
  return res.json({ item: result })
}

export async function DELETE(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  await deleteBlogPostWorkflow(req.scope).run({
    input: { id: req.params.id },
  })
  return res.json({ id: req.params.id, object: "blog_post", deleted: true })
}
