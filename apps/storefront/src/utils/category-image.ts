// Category tiles and page headers are photo-first. Resolution priority:
// a real photo set in Medusa (category.metadata.image) → a curated lifestyle
// photo matched by slug/name → "" (the caller decides the fallback: a
// branded gradient on the homepage tiles, a showroom photo on page heroes).
const categoryImageMap: Record<string, string> = {
  matelas: "/images/categories/matelas.jpg",
  sommiers: "/images/categories/sommiers.png",
  sommier: "/images/categories/sommiers.png",
  "tetes-de-lit": "/images/categories/tetes-de-lit.jpg",
  "tete-de-lit": "/images/categories/tetes-de-lit.jpg",
  accessoires: "/images/categories/accessoires.jpg",
  "oreillers-couettes": "/images/categories/accessoires.jpg",
  oreillers: "/images/categories/accessoires.jpg",
  couettes: "/images/categories/accessoires.jpg",
};

const normalizeKey = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .replace(/\s+/g, "-");

export function resolveCategoryImage(category: {
  image?: string;
  slug?: string;
  name?: string;
}): string {
  return (
    category.image ||
    (category.slug && categoryImageMap[category.slug]) ||
    (category.name && categoryImageMap[normalizeKey(category.name)]) ||
    ""
  );
}
