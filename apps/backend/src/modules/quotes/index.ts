import QuotesModuleService from "./service"
import { Module } from "@medusajs/framework/utils"

export const QUOTES_MODULE = "quotes"

export default Module(QUOTES_MODULE, {
  service: QuotesModuleService,
})
