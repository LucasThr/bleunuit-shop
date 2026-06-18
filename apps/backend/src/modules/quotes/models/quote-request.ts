import { model } from "@medusajs/framework/utils"

// A customer "devis" (quote) request submitted from the storefront for a
// product that is sold in-store only (not purchasable online). Captured here
// so the team can follow up; managed from the admin "Devis" page. This is a
// lead, not a Medusa order.
const QuoteRequest = model.define("quote_request", {
  id: model.id().primaryKey(),
  name: model.text(),
  email: model.text(),
  phone: model.text().nullable(),
  message: model.text().nullable(),
  product_id: model.text().nullable(),
  product_title: model.text().nullable(),
  status: model.enum(["pending", "handled"]).default("pending"),
})

export default QuoteRequest
