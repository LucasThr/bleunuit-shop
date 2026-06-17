import { MedusaService } from "@medusajs/framework/utils"
import Homepage from "./models/homepage"

class CmsModuleService extends MedusaService({
  Homepage,
}) {}

export default CmsModuleService
