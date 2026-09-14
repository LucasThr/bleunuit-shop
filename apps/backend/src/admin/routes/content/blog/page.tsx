import { defineRouteConfig } from "@medusajs/admin-sdk"
import { CrudResource } from "../../../components/crud-resource"

// Mirrors `categoryNames` in apps/storefront/src/pages/blog/index.astro and
// blog/[slug].astro, and BLOG_CATEGORIES in the API validators. Duplicated on
// purpose: the two apps share no code.
const BLOG_CATEGORY_OPTIONS = [
  { value: "sleep-tips", label: "Conseils sommeil" },
  { value: "product-guides", label: "Guides produits" },
  { value: "company-news", label: "Actualités" },
]

const todayIso = () => {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${now.getFullYear()}-${month}-${day}`
}

type BlogPost = {
  id: string
  title: string
  slug: string
  category?: string | null
  publish_date?: string | null
  published?: boolean
}

const BlogPage = () => (
  <CrudResource<BlogPost>
    endpoint="/admin/cms/blog-posts"
    queryKey={["cms-blog-posts"]}
    title="Blog"
    subtitle="Articles affichés sur la page /blog du site."
    singular="article"
    columns={[
      { key: "title", header: "Titre" },
      { key: "category", header: "Catégorie" },
      { key: "publish_date", header: "Date" },
      {
        key: "published",
        header: "Publié",
        render: (i) => (i.published ? "Oui" : "Non"),
      },
    ]}
    fields={[
      { key: "title", label: "Titre", required: true },
      {
        key: "slug",
        label: "Adresse de la page",
        required: true,
        placeholder: "comment-choisir-son-matelas",
        slugFrom: "title",
        hint: "Adresse de la page : /blog/<slug>",
      },
      {
        key: "category",
        label: "Catégorie",
        type: "select",
        options: BLOG_CATEGORY_OPTIONS,
      },
      { key: "author", label: "Auteur" },
      {
        key: "publish_date",
        label: "Date de publication",
        type: "date",
      },
      { key: "excerpt", label: "Extrait", type: "textarea" },
      { key: "featured_image", label: "Image à la une", type: "image" },
      { key: "content", label: "Contenu (HTML)", type: "textarea" },
      { key: "published", label: "Publié", type: "boolean" },
    ]}
    emptyItem={{
      title: "",
      slug: "",
      category: "",
      author: "",
      publish_date: todayIso(),
      excerpt: "",
      featured_image: "",
      content: "",
      published: true,
    }}
  />
)

export const config = defineRouteConfig({
  label: "Blog",
})

export default BlogPage
