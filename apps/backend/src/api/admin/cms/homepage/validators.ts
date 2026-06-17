import { z } from "zod"

const Highlight = z.object({
  title: z.string(),
  description: z.string(),
})

const ValueProp = z.object({
  eyebrow: z.string(),
  title: z.string(),
  description: z.string(),
})

const MethodStep = z.object({
  title: z.string(),
  description: z.string(),
})

// All fields optional/nullable: the admin form saves the whole homepage at
// once, and any field may be left empty (the storefront has fallbacks).
export const UpdateHomepageSchema = z.object({
  hero_badge: z.string().nullish(),
  hero_location: z.string().nullish(),
  hero_title: z.string().nullish(),
  hero_subtitle: z.string().nullish(),
  hero_image: z.string().nullish(),
  hero_highlights: z.array(Highlight).nullish(),

  hero_promo_eyebrow: z.string().nullish(),
  hero_promo_value: z.string().nullish(),
  hero_promo_label: z.string().nullish(),
  hero_promo_note: z.string().nullish(),

  value_props: z.array(ValueProp).nullish(),

  method_title: z.string().nullish(),
  method_intro: z.string().nullish(),
  method_steps: z.array(MethodStep).nullish(),

  cta_title: z.string().nullish(),
  cta_text: z.string().nullish(),
})

export type UpdateHomepageSchema = z.infer<typeof UpdateHomepageSchema>
