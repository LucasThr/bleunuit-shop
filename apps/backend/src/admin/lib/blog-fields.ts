import type { FieldDef } from "../components/crud-resource"

// Mirrors `categoryNames` in apps/storefront/src/pages/blog/index.astro and
// blog/[slug].astro, and BLOG_CATEGORIES in the API validators. Duplicated on
// purpose: the two apps share no code.
export const BLOG_CATEGORY_OPTIONS = [
  { value: "sleep-tips", label: "Conseils sommeil" },
  { value: "product-guides", label: "Guides produits" },
  { value: "company-news", label: "Actualités" },
]

export const todayIso = () => {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${now.getFullYear()}-${month}-${day}`
}

// The article fields, split the way the dedicated article page lays them out:
// the body on the left, everything else in side panels. The list page feeds the
// flat list to CrudResource, which only uses it to know the required fields.
export const BODY_FIELDS: FieldDef[] = [
  { key: "title", label: "Titre", required: true },
  { key: "excerpt", label: "Extrait", type: "textarea" },
  { key: "content", label: "Contenu", type: "richtext" },
]

export const PUBLICATION_FIELDS: FieldDef[] = [
  { key: "published", label: "Publié", type: "boolean" },
  { key: "publish_date", label: "Date de publication", type: "date" },
]

export const CLASSIFICATION_FIELDS: FieldDef[] = [
  {
    key: "category",
    label: "Catégorie",
    type: "select",
    options: BLOG_CATEGORY_OPTIONS,
  },
  { key: "author", label: "Auteur" },
]

export const ADDRESS_FIELDS: FieldDef[] = [
  {
    key: "slug",
    label: "Adresse de la page",
    required: true,
    placeholder: "comment-choisir-son-matelas",
    slugFrom: "title",
    hint: "Adresse de la page : /blog/<slug>",
  },
]

export const IMAGE_FIELDS: FieldDef[] = [
  { key: "featured_image", label: "Image à la une", type: "image" },
]

export const BLOG_FIELDS: FieldDef[] = [
  ...BODY_FIELDS,
  ...PUBLICATION_FIELDS,
  ...CLASSIFICATION_FIELDS,
  ...ADDRESS_FIELDS,
  ...IMAGE_FIELDS,
]

// Blank values for every editable field. Also acts as the allowlist that keeps
// id/created_at/… out of the update payload.
export const emptyBlogPost = () => ({
  title: "",
  slug: "",
  category: "",
  author: "",
  publish_date: todayIso(),
  excerpt: "",
  featured_image: "",
  content: "",
  published: true,
})
