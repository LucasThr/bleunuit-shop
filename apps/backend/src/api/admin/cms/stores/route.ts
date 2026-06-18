import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { CMS_MODULE } from "../../../../modules/cms"
import CmsModuleService from "../../../../modules/cms/service"
import { createStoreWorkflow } from "../../../../workflows/store"
import { CreateStoreSchema } from "./validators"

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const cms: CmsModuleService = req.scope.resolve(CMS_MODULE)
  const [items, count] = await cms.listAndCountStores(
    {},
    { order: { name: "ASC" } }
  )
  return res.json({ items, count })
}

export async function POST(
  req: AuthenticatedMedusaRequest<CreateStoreSchema>,
  res: MedusaResponse
) {
  const { result } = await createStoreWorkflow(req.scope).run({
    input: req.validatedBody,
  })
  return res.json({ item: result })
}
