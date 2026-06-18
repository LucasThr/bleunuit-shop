import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { CMS_MODULE } from "../../modules/cms"
import CmsModuleService from "../../modules/cms/service"

export const createBrandStep = createStep(
  "create-brand-step",
  async (input: Record<string, unknown>, { container }) => {
    const cms: CmsModuleService = container.resolve(CMS_MODULE)
    const created = await cms.createBrands(input as any)
    return new StepResponse(created, created.id)
  },
  async (id, { container }) => {
    if (!id) return
    const cms: CmsModuleService = container.resolve(CMS_MODULE)
    await cms.deleteBrands(id)
  }
)

export const updateBrandStep = createStep(
  "update-brand-step",
  async (input: { id: string } & Record<string, unknown>, { container }) => {
    const cms: CmsModuleService = container.resolve(CMS_MODULE)
    const updated = await cms.updateBrands(input as any)
    return new StepResponse(updated)
  }
)

export const deleteBrandStep = createStep(
  "delete-brand-step",
  async ({ id }: { id: string }, { container }) => {
    const cms: CmsModuleService = container.resolve(CMS_MODULE)
    await cms.deleteBrands(id)
    return new StepResponse(id)
  }
)
