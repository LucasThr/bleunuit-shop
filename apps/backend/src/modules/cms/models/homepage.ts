import { model } from "@medusajs/framework/utils"

// Single-row marketing content for the storefront homepage.
// Fields mirror exactly what `apps/storefront/src/pages/index.astro` renders, so the
// storefront can read this in place of the old Directus `homepage` singleton.
const Homepage = model.define("homepage", {
  id: model.id().primaryKey(),

  // Hero
  hero_badge: model.text().nullable(),
  hero_location: model.text().nullable(),
  hero_title: model.text().nullable(),
  hero_subtitle: model.text().nullable(),
  hero_image: model.text().nullable(), // full image URL
  hero_highlights: model.json().nullable(), // { title, description }[]

  // Hero promo voucher
  hero_promo_eyebrow: model.text().nullable(),
  hero_promo_value: model.text().nullable(),
  hero_promo_label: model.text().nullable(),
  hero_promo_note: model.text().nullable(),

  // Value props
  value_props: model.json().nullable(), // { eyebrow, title, description }[]

  // Method
  method_title: model.text().nullable(),
  method_intro: model.text().nullable(),
  method_steps: model.json().nullable(), // { title, description }[]

  // Final CTA
  cta_title: model.text().nullable(),
  cta_text: model.text().nullable(),
})

export default Homepage
