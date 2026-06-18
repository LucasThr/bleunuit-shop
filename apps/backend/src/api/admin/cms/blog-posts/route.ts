import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { CMS_MODULE } from "../../../../modules/cms"
import CmsModuleService from "../../../../modules/cms/service"
import { createBlogPostWorkflow } from "../../../../workflows/blog-post"
import { CreateBlogPostSchema } from "./validators"

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const cms: CmsModuleService = req.scope.resolve(CMS_MODULE)
  const [items, count] = await cms.listAndCountBlogPosts(
    {},
    { order: { publish_date: "DESC" } }
  )
  return res.json({ items, count })
}

export async function POST(
  req: AuthenticatedMedusaRequest<CreateBlogPostSchema>,
  res: MedusaResponse
) {
  const { result } = await createBlogPostWorkflow(req.scope).run({
    input: req.validatedBody,
  })
  return res.json({ item: result })
}
