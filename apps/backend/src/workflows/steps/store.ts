import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { CMS_MODULE } from "../../modules/cms"
import CmsModuleService from "../../modules/cms/service"

export const createStoreStep = createStep(
  "create-store-step",
  async (input: Record<string, unknown>, { container }) => {
    const cms: CmsModuleService = container.resolve(CMS_MODULE)
    const created = await cms.createStores(input as any)
    return new StepResponse(created, created.id)
  },
  async (id, { container }) => {
    if (!id) return
    const cms: CmsModuleService = container.resolve(CMS_MODULE)
    await cms.deleteStores(id)
  }
)

export const updateStoreStep = createStep(
  "update-store-step",
  async (input: { id: string } & Record<string, unknown>, { container }) => {
    const cms: CmsModuleService = container.resolve(CMS_MODULE)
    const updated = await cms.updateStores(input as any)
    return new StepResponse(updated)
  }
)

export const deleteStoreStep = createStep(
  "delete-store-step",
  async ({ id }: { id: string }, { container }) => {
    const cms: CmsModuleService = container.resolve(CMS_MODULE)
    await cms.deleteStores(id)
    return new StepResponse(id)
  }
)
