// URL slug helpers. Categories/subcategories may not have a `slug` field
// populated in Directus yet, so we fall back to a slugified `name`.

export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function slugFor(item: { slug?: string | null; name: string }): string {
  return item.slug || slugify(item.name);
}
