import { model } from "@medusajs/framework/utils"

// A customer testimonial shown on the homepage, replacing the old Directus
// `testimonials` collection. `rank` controls display order (was `order` in
// Directus, renamed to avoid the SQL reserved word).
const Testimonial = model.define("testimonial", {
  id: model.id().primaryKey(),
  quote: model.text(),
  name: model.text(),
  city: model.text().nullable(),
  rank: model.number().nullable(),
  published: model.boolean().default(true),
})

export default Testimonial
