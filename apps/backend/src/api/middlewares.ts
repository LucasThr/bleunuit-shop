import {
  defineMiddlewares,
  validateAndTransformBody,
} from "@medusajs/framework/http"
import { UpdateHomepageSchema } from "./admin/cms/homepage/validators"

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/cms/homepage",
      method: "POST",
      middlewares: [validateAndTransformBody(UpdateHomepageSchema)],
    },
  ],
})
