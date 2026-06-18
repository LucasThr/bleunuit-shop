import { model } from "@medusajs/framework/utils"

// A partner brand shown on the homepage and /produits brand sections,
// replacing the old Directus `brands` collection. Products reference their
// brand by name via product metadata (see seed-catalog.ts); this collection
// drives the brand logos/list UI and is editable from the admin.
const Brand = model.define("cms_brand", {
  id: model.id().primaryKey(),
  name: model.text(),
  slug: model.text(),
  logo: model.text().nullable(), // full image URL
  website: model.text().nullable(),
  description: model.text().nullable(),
  rank: model.number().nullable(),
})

export default Brand
