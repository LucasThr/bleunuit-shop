import { MedusaService } from "@medusajs/framework/utils"
import QuoteRequest from "./models/quote-request"

class QuotesModuleService extends MedusaService({
  QuoteRequest,
}) {}

export default QuotesModuleService
