import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { CMS_MODULE } from "../../../../../modules/cms"
import CmsModuleService from "../../../../../modules/cms/service"
import {
  updateStoreWorkflow,
  deleteStoreWorkflow,
} from "../../../../../workflows/store"
import { UpdateStoreSchema } from "../validators"

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const cms: CmsModuleService = req.scope.resolve(CMS_MODULE)
  const item = await cms.retrieveStore(req.params.id)
  return res.json({ item })
}

export async function POST(
  req: AuthenticatedMedusaRequest<UpdateStoreSchema>,
  res: MedusaResponse
) {
  const { result } = await updateStoreWorkflow(req.scope).run({
    input: { id: req.params.id, ...req.validatedBody },
  })
  return res.json({ item: result })
}

export async function DELETE(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  await deleteStoreWorkflow(req.scope).run({
    input: { id: req.params.id },
  })
  return res.json({ id: req.params.id, object: "store", deleted: true })
}
