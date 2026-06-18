import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { CMS_MODULE } from "../../modules/cms"
import CmsModuleService from "../../modules/cms/service"

export const createTestimonialStep = createStep(
  "create-testimonial-step",
  async (input: Record<string, unknown>, { container }) => {
    const cms: CmsModuleService = container.resolve(CMS_MODULE)
    const created = await cms.createTestimonials(input as any)
    return new StepResponse(created, created.id)
  },
  async (id, { container }) => {
    if (!id) return
    const cms: CmsModuleService = container.resolve(CMS_MODULE)
    await cms.deleteTestimonials(id)
  }
)

export const updateTestimonialStep = createStep(
  "update-testimonial-step",
  async (input: { id: string } & Record<string, unknown>, { container }) => {
    const cms: CmsModuleService = container.resolve(CMS_MODULE)
    const updated = await cms.updateTestimonials(input as any)
    return new StepResponse(updated)
  }
)

export const deleteTestimonialStep = createStep(
  "delete-testimonial-step",
  async ({ id }: { id: string }, { container }) => {
    const cms: CmsModuleService = container.resolve(CMS_MODULE)
    await cms.deleteTestimonials(id)
    return new StepResponse(id)
  }
)
