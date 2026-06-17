import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CMS_MODULE } from "../../../../modules/cms"
import CmsModuleService from "../../../../modules/cms/service"

// Public homepage content for the storefront. Authenticated by the
// publishable API key the SDK sends automatically on /store/* routes.
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const cms: CmsModuleService = req.scope.resolve(CMS_MODULE)
  const [homepage] = await cms.listHomepages({}, { take: 1 })

  return res.json({ homepage: homepage ?? null })
}
