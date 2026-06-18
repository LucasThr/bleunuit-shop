import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { CMS_MODULE } from "../../../../modules/cms"
import CmsModuleService from "../../../../modules/cms/service"
import { createBrandWorkflow } from "../../../../workflows/brand"
import { CreateBrandSchema } from "./validators"

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const cms: CmsModuleService = req.scope.resolve(CMS_MODULE)
  const [items, count] = await cms.listAndCountBrands(
    {},
    { order: { rank: "ASC" } }
  )
  return res.json({ items, count })
}

export async function POST(
  req: AuthenticatedMedusaRequest<CreateBrandSchema>,
  res: MedusaResponse
) {
  const { result } = await createBrandWorkflow(req.scope).run({
    input: req.validatedBody,
  })
  return res.json({ item: result })
}
