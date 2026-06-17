import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { CMS_MODULE } from "../../../../modules/cms"
import CmsModuleService from "../../../../modules/cms/service"
import updateHomepageWorkflow from "../../../../workflows/update-homepage"
import { UpdateHomepageSchema } from "./validators"

// Read the homepage content for the admin editor.
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const cms: CmsModuleService = req.scope.resolve(CMS_MODULE)
  const [homepage] = await cms.listHomepages({}, { take: 1 })

  return res.json({ homepage: homepage ?? null })
}

// Upsert the homepage content from the admin editor.
export async function POST(
  req: AuthenticatedMedusaRequest<UpdateHomepageSchema>,
  res: MedusaResponse
) {
  const { result } = await updateHomepageWorkflow(req.scope).run({
    input: req.validatedBody,
  })

  return res.json({ homepage: result })
}
