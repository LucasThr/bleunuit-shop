import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { QUOTES_MODULE } from "../../../modules/quotes"
import QuotesModuleService from "../../../modules/quotes/service"

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const quotes: QuotesModuleService = req.scope.resolve(QUOTES_MODULE)
  const [items, count] = await quotes.listAndCountQuoteRequests(
    {},
    { order: { created_at: "DESC" } }
  )
  return res.json({ items, count })
}
