import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CMS_MODULE } from "../../../../modules/cms"
import CmsModuleService from "../../../../modules/cms/service"

// Public list of published blog posts for the storefront, newest first.
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const cms: CmsModuleService = req.scope.resolve(CMS_MODULE)
  const blog_posts = await cms.listBlogPosts(
    { published: true },
    { order: { publish_date: "DESC" } }
  )
  return res.json({ blog_posts })
}
