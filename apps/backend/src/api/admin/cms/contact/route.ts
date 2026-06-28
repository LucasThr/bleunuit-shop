import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { CMS_MODULE } from "../../../../modules/cms"
import CmsModuleService from "../../../../modules/cms/service"
import updateContactWorkflow from "../../../../workflows/update-contact"
import { UpdateContactSchema } from "./validators"

// Read the contact details for the admin editor.
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const cms: CmsModuleService = req.scope.resolve(CMS_MODULE)
  const [contact] = await cms.listContacts({}, { take: 1 })

  return res.json({ contact: contact ?? null })
}

// Upsert the contact details from the admin editor.
export async function POST(
  req: AuthenticatedMedusaRequest<UpdateContactSchema>,
  res: MedusaResponse
) {
  const { result } = await updateContactWorkflow(req.scope).run({
    input: req.validatedBody,
  })

  return res.json({ contact: result })
}
