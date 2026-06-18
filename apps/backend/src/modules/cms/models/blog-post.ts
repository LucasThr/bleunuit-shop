import { model } from "@medusajs/framework/utils"

// A blog article. Fields mirror what the storefront blog pages render
// (directus/src/pages/blog/index.astro + [slug].astro), replacing the old
// Directus `blog_posts` collection.
const BlogPost = model.define("blog_post", {
  id: model.id().primaryKey(),
  title: model.text(),
  slug: model.text(),
  publish_date: model.text().nullable(), // ISO date string, e.g. "2024-10-02"
  author: model.text().nullable(),
  excerpt: model.text().nullable(),
  featured_image: model.text().nullable(), // full image URL
  category: model.text().nullable(),
  content: model.text().nullable(), // HTML
  published: model.boolean().default(true),
})

export default BlogPost
