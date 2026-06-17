import CmsModuleService from "./service"
import { Module } from "@medusajs/framework/utils"

export const CMS_MODULE = "cms"

export default Module(CMS_MODULE, {
  service: CmsModuleService,
})
