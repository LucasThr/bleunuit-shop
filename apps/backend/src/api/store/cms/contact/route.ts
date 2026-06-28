import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CMS_MODULE } from "../../../../modules/cms"
import CmsModuleService from "../../../../modules/cms/service"

// Public contact details for the storefront. Authenticated by the
// publishable API key the SDK sends automatically on /store/* routes.
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const cms: CmsModuleService = req.scope.resolve(CMS_MODULE)
  const [contact] = await cms.listContacts({}, { take: 1 })

  return res.json({ contact: contact ?? null })
}
