import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { CMS_MODULE } from "../../modules/cms"
import CmsModuleService from "../../modules/cms/service"

export type UpsertHomepageInput = {
  hero_badge?: string | null
  hero_location?: string | null
  hero_title?: string | null
  hero_subtitle?: string | null
  hero_image?: string | null
  hero_highlights?: { title: string; description: string }[] | null
  hero_promo_eyebrow?: string | null
  hero_promo_value?: string | null
  hero_promo_label?: string | null
  hero_promo_note?: string | null
  value_props?: { eyebrow: string; title: string; description: string }[] | null
  method_title?: string | null
  method_intro?: string | null
  method_steps?: { title: string; description: string }[] | null
  cta_title?: string | null
  cta_text?: string | null
}

// The homepage is a singleton: there is only ever one row. This step creates
// it on first write and updates it thereafter. Upsert is a single logical
// mutation, so keeping it in one step is fine.
export const upsertHomepageStep = createStep(
  "upsert-homepage",
  async (input: UpsertHomepageInput, { container }) => {
    const cms: CmsModuleService = container.resolve(CMS_MODULE)

    const [existing] = await cms.listHomepages({}, { take: 1 })

    // The json columns (hero_highlights, value_props, method_steps) hold
    // arrays; Medusa's generated types model json as objects, so cast at the
    // service boundary.
    if (existing) {
      const updated = await cms.updateHomepages({
        id: existing.id,
        ...input,
      } as any)
      return new StepResponse(updated)
    }

    const created = await cms.createHomepages(input as any)
    return new StepResponse(created)
  }
)
