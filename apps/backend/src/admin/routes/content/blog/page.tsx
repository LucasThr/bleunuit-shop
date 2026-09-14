import { defineRouteConfig } from "@medusajs/admin-sdk"
import { toast } from "@medusajs/ui"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { CrudResource } from "../../../components/crud-resource"
import { BLOG_FIELDS, emptyBlogPost } from "../../../lib/blog-fields"
import { sdk } from "../../../lib/sdk"

type BlogPost = {
  id: string
  title: string
  slug: string
  category?: string | null
  publish_date?: string | null
  published?: boolean
}

const BlogPage = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // "Créer" saves an unpublished draft right away, then opens its page. The
  // article page needs an id (image uploads, link to the public page), and this
  // keeps a single edit form to maintain. An abandoned draft stays unpublished,
  // so it never reaches the storefront; it is deleted from this list.
  const createDraft = useMutation({
    mutationFn: () =>
      sdk.client.fetch<{ item: BlogPost }>("/admin/cms/blog-posts", {
        method: "POST",
        body: {
          ...emptyBlogPost(),
          title: "Nouvel article",
          slug: `nouvel-article-${Date.now()}`,
          published: false,
        },
      }),
    onSuccess: ({ item }) => {
      queryClient.invalidateQueries({ queryKey: ["cms-blog-posts"] })
      navigate(`/content/blog/${item.id}`)
    },
    onError: (e: any) => toast.error(e?.message || "Échec de la création"),
  })

  return (
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
      fields={BLOG_FIELDS}
      emptyItem={emptyBlogPost()}
      editHref={(item) => `/content/blog/${item.id}`}
      onCreate={() => createDraft.mutate()}
      createPending={createDraft.isPending}
    />
  )
}

export const config = defineRouteConfig({
  label: "Blog",
})

export default BlogPage
