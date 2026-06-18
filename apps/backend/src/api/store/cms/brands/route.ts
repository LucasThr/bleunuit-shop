import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CMS_MODULE } from "../../../../modules/cms"
import CmsModuleService from "../../../../modules/cms/service"

// Public list of partner brands for the storefront, by display rank.
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const cms: CmsModuleService = req.scope.resolve(CMS_MODULE)
  const brands = await cms.listBrands({}, { order: { rank: "ASC" } })
  return res.json({ brands })
}
