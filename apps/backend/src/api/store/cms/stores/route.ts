import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CMS_MODULE } from "../../../../modules/cms"
import CmsModuleService from "../../../../modules/cms/service"

// Public list of stores for the storefront.
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const cms: CmsModuleService = req.scope.resolve(CMS_MODULE)
  const stores = await cms.listStores({}, { order: { name: "ASC" } })
  return res.json({ stores })
}
