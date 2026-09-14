import { MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { CMS_MODULE } from "../../modules/cms"
import CmsModuleService from "../../modules/cms/service"

// The slug is the public URL of the article, so two posts may never share one.
async function assertUniqueSlug(
  cms: CmsModuleService,
  slug: unknown,
  id?: string
) {
  if (typeof slug !== "string" || !slug) return
  const existing = await cms.listBlogPosts({ slug })
  if (existing.some((post) => post.id !== id)) {
    throw new MedusaError(
      MedusaError.Types.DUPLICATE_ERROR,
      `L'adresse « ${slug} » est déjà utilisée par un autre article.`
    )
  }
}

// Service methods are typed against the generated model types; the input here
// is the Zod-validated body, so cast at the service boundary.
export const createBlogPostStep = createStep(
  "create-blog-post-step",
  async (input: Record<string, unknown>, { container }) => {
    const cms: CmsModuleService = container.resolve(CMS_MODULE)
    await assertUniqueSlug(cms, input.slug)
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
    await assertUniqueSlug(cms, input.slug, input.id)
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
