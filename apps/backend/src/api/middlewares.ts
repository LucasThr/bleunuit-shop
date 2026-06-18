import {
  defineMiddlewares,
  validateAndTransformBody,
} from "@medusajs/framework/http"
import { UpdateHomepageSchema } from "./admin/cms/homepage/validators"
import {
  CreateBlogPostSchema,
  UpdateBlogPostSchema,
} from "./admin/cms/blog-posts/validators"
import {
  CreateStoreSchema,
  UpdateStoreSchema,
} from "./admin/cms/stores/validators"
import {
  CreateTestimonialSchema,
  UpdateTestimonialSchema,
} from "./admin/cms/testimonials/validators"
import {
  CreateBrandSchema,
  UpdateBrandSchema,
} from "./admin/cms/brands/validators"

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/cms/homepage",
      method: "POST",
      middlewares: [validateAndTransformBody(UpdateHomepageSchema)],
    },
    // Blog posts
    {
      matcher: "/admin/cms/blog-posts",
      method: "POST",
      middlewares: [validateAndTransformBody(CreateBlogPostSchema)],
    },
    {
      matcher: "/admin/cms/blog-posts/:id",
      method: "POST",
      middlewares: [validateAndTransformBody(UpdateBlogPostSchema)],
    },
    // Stores
    {
      matcher: "/admin/cms/stores",
      method: "POST",
      middlewares: [validateAndTransformBody(CreateStoreSchema)],
    },
    {
      matcher: "/admin/cms/stores/:id",
      method: "POST",
      middlewares: [validateAndTransformBody(UpdateStoreSchema)],
    },
    // Testimonials
    {
      matcher: "/admin/cms/testimonials",
      method: "POST",
      middlewares: [validateAndTransformBody(CreateTestimonialSchema)],
    },
    {
      matcher: "/admin/cms/testimonials/:id",
      method: "POST",
      middlewares: [validateAndTransformBody(UpdateTestimonialSchema)],
    },
    // Brands
    {
      matcher: "/admin/cms/brands",
      method: "POST",
      middlewares: [validateAndTransformBody(CreateBrandSchema)],
    },
    {
      matcher: "/admin/cms/brands/:id",
      method: "POST",
      middlewares: [validateAndTransformBody(UpdateBrandSchema)],
    },
  ],
})
