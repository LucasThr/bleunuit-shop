import type { APIRoute } from 'astro';
import {
  getAllCategories,
  getAllProducts,
  getAllSubcategories,
} from '../utils/catalog-client';
import { getAllBlogPosts } from '../utils/cms-client';
import { slugFor } from '../utils/slugs';

export const GET: APIRoute = async ({ site, url }) => {
  const base = (site ?? new URL(url.origin)).href.replace(/\/$/, '');
  const paths = ['/', '/produits', '/magasins', '/blog', '/contact'];

  try {
    const [categories, subcategories, products, posts] = await Promise.all([
      getAllCategories(),
      getAllSubcategories(),
      getAllProducts(),
      getAllBlogPosts(),
    ]);

    const categoriesById = new Map(categories.map((c) => [c.id, c]));

    for (const category of categories) {
      paths.push(`/produits/${slugFor(category)}`);
    }

    for (const sub of subcategories) {
      const categoryId = typeof sub.category === 'object' ? sub.category.id : sub.category;
      const category = categoriesById.get(categoryId);
      if (category) {
        paths.push(`/produits/${slugFor(category)}/${slugFor(sub)}`);
      }
    }

    for (const product of products) {
      if (!product.slug || typeof product.category !== 'object') continue;
      paths.push(`/produits/${slugFor(product.category)}/p/${product.slug}`);
    }

    for (const post of posts) {
      if (post.slug) paths.push(`/blog/${post.slug}`);
    }
  } catch {
    // Directus unreachable: still serve the static routes.
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map((path) => `  <url><loc>${base}${path}</loc></url>`).join('\n')}
</urlset>
`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
