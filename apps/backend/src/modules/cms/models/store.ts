import { model } from "@medusajs/framework/utils"

// A physical store. Fields mirror what the storefront renders in
// apps/storefront/src/pages/magasins.astro and the homepage stores section,
// replacing the old Directus `stores` collection.
// Entity name is `cms_store` (not `store`) to avoid colliding with Medusa's
// core Store module alias in the query joiner.
const Store = model.define("cms_store", {
  id: model.id().primaryKey(),
  name: model.text(),
  slug: model.text(),
  address: model.text().nullable(),
  city: model.text().nullable(),
  postal_code: model.text().nullable(),
  phone: model.text().nullable(),
  email: model.text().nullable(),
  hours: model.json().nullable(), // { monday..sunday: string }
  map_url: model.text().nullable(),
  latitude: model.number().nullable(),
  longitude: model.number().nullable(),
  additional_info: model.text().nullable(),
  description: model.text().nullable(),
  image: model.text().nullable(), // full image URL
})

export default Store
