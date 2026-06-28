import { model } from "@medusajs/framework/utils"

// Single-row contact details for the storefront /contact page. Fields mirror
// what `apps/storefront/src/pages/contact.astro` renders for the coordinates
// card and opening-hours table, so the storefront can read this in place of
// its hardcoded values.
const Contact = model.define("contact", {
  id: model.id().primaryKey(),

  store_name: model.text().nullable(),
  address: model.text().nullable(), // multi-line, one line per row
  phone: model.text().nullable(),
  email: model.text().nullable(),
  hours: model.json().nullable(), // { label, value }[]
})

export default Contact
