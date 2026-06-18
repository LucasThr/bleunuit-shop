import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { CMS_MODULE } from "../../modules/cms"
import CmsModuleService from "../../modules/cms/service"

// Service methods are typed against the generated model types; the input here
// is the Zod-validated body, so cast at the service boundary.
export const createBlogPostStep = createStep(
  "create-blog-post-step",
  async (input: Record<string, unknown>, { container }) => {
    const cms: CmsModuleService = container.resolve(CMS_MODULE)
    const created = await cms.createBlogPosts(input as any)
    return new StepResponse(created, created.id)
  },
  async (id, { container }) => {
    if (!id) return
    const cms: CmsModuleService = container.resolve(CMS_MODULE)
    await cms.deleteBlogPosts(id)
  }
)

export const updateBlogPostStep = createStep(
  "update-blog-post-step",
  async (input: { id: string } & Record<string, unknown>, { container }) => {
    const cms: CmsModuleService = container.resolve(CMS_MODULE)
    const updated = await cms.updateBlogPosts(input as any)
    return new StepResponse(updated)
  }
)

export const deleteBlogPostStep = createStep(
  "delete-blog-post-step",
  async ({ id }: { id: string }, { container }) => {
    const cms: CmsModuleService = container.resolve(CMS_MODULE)
    await cms.deleteBlogPosts(id)
    return new StepResponse(id)
  }
)
