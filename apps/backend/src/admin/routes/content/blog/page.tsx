import { defineRouteConfig } from "@medusajs/admin-sdk"
import { CrudResource } from "../../../components/crud-resource"

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
        label: "Slug (URL)",
        required: true,
        placeholder: "comment-choisir-son-matelas",
      },
      { key: "category", label: "Catégorie", placeholder: "conseils" },
      { key: "author", label: "Auteur" },
      {
        key: "publish_date",
        label: "Date de publication",
        placeholder: "2024-10-02",
      },
      { key: "excerpt", label: "Extrait", type: "textarea" },
      { key: "featured_image", label: "Image à la une (URL)" },
      { key: "content", label: "Contenu (HTML)", type: "textarea" },
      { key: "published", label: "Publié", type: "boolean" },
    ]}
    emptyItem={{
      title: "",
      slug: "",
      category: "",
      author: "",
      publish_date: "",
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
