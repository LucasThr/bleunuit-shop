import { MedusaService } from "@medusajs/framework/utils"
import Homepage from "./models/homepage"
import BlogPost from "./models/blog-post"
import Store from "./models/store"
import Testimonial from "./models/testimonial"
import Brand from "./models/brand"
import Contact from "./models/contact"

class CmsModuleService extends MedusaService({
  Homepage,
  BlogPost,
  Store,
  Testimonial,
  Brand,
  Contact,
}) {}

export default CmsModuleService
