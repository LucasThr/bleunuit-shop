import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { CMS_MODULE } from "../../modules/cms"
import CmsModuleService from "../../modules/cms/service"

export type UpsertContactInput = {
  store_name?: string | null
  address?: string | null
  phone?: string | null
  email?: string | null
  hours?: { label: string; value: string }[] | null
}

// The contact block is a singleton: there is only ever one row. This step
// creates it on first write and updates it thereafter.
export const upsertContactStep = createStep(
  "upsert-contact",
  async (input: UpsertContactInput, { container }) => {
    const cms: CmsModuleService = container.resolve(CMS_MODULE)

    const [existing] = await cms.listContacts({}, { take: 1 })

    // The json column (hours) holds an array; Medusa's generated types model
    // json as objects, so cast at the service boundary.
    if (existing) {
      const updated = await cms.updateContacts({
        id: existing.id,
        ...input,
      } as any)
      return new StepResponse(updated)
    }

    const created = await cms.createContacts(input as any)
    return new StepResponse(created)
  }
)
