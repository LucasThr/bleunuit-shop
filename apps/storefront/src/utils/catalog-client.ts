// Storefront catalog reads from native Medusa (products + product categories)
// and the cms module (brands). Each function returns the same shape the
// storefront previously got from Directus, so the Astro templates are
// unchanged. Per-product attributes Medusa has no native field for (brand,
// promo price, featured, stock, subcategory) live in product metadata.
import { sdk, MEDUSA_REGION_ID } from "./medusa";

// ---- Directus-compatible shapes the storefront expects --------------------

export type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  image?: string;
  order?: number;
  show_in_menu: boolean;
};

export type Subcategory = {
  id: string;
  name: string;
  slug: string;
  category: string | null; // parent category id
  description?: string;
  order?: number;
};

export type ProductCategoryRef = { id: string; name: string; slug: string };

// A product is sold online (cart + Stripe), in-store only (devis), or both.
export type SaleChannel = "online" | "in_store" | "both";

export type Product = {
  id: string;
  name: string;
  slug: string;
  brand: string;
  category: ProductCategoryRef | null;
  subcategory: ProductCategoryRef | null;
  price: string;
  promo_price?: string;
  featured_image: string | null;
  gallery: string[];
  description: string;
  featured: boolean;
  in_stock: boolean;
  // Which channel(s) sell this product. The storefront derives cart vs. devis
  // CTAs from this via saleMode() (src/utils/sale-mode.ts).
  sale_channel: SaleChannel;
  // First variant id, needed to add the product to the cart for online sale.
  variantId: string | null;
};

export type Brand = {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  website?: string | null;
  description?: string | null;
  order: number;
};

// ---- Raw Medusa shapes ----------------------------------------------------

type MedusaCategory = {
  id: string;
  name: string;
  handle: string;
  description?: string | null;
  rank?: number | null;
  parent_category_id?: string | null;
  metadata?: {
    icon?: string | null;
    image?: string | null;
    show_in_menu?: boolean;
  } | null;
};

type MedusaProduct = {
  id: string;
  title: string;
  handle: string;
  description?: string | null;
  thumbnail?: string | null;
  metadata?: {
    brand?: string | null;
    promo_price?: number | null;
    featured?: boolean;
    in_stock?: boolean;
    featured_image?: string | null;
    sale_channel?: SaleChannel;
  } | null;
  categories?: MedusaCategory[];
  variants?: { id: string; calculated_price?: { calculated_amount?: number } }[];
};

const PRODUCT_FIELDS =
  "id,title,handle,description,thumbnail,metadata," +
  "categories.id,categories.name,categories.handle,categories.parent_category_id," +
  "variants.id,*variants.calculated_price";

const CATEGORY_FIELDS =
  "id,name,handle,description,rank,parent_category_id,metadata";

// ---- Mappers --------------------------------------------------------------

function toCategory(c: MedusaCategory): Category {
  return {
    id: c.id,
    name: c.name,
    slug: c.handle,
    description: c.description ?? "",
    icon: c.metadata?.icon ?? "",
    image: c.metadata?.image ?? "",
    order: c.rank ?? 0,
    show_in_menu: c.metadata?.show_in_menu === true,
  };
}

function toSubcategory(c: MedusaCategory): Subcategory {
  return {
    id: c.id,
    name: c.name,
    slug: c.handle,
    category: c.parent_category_id ?? null,
    description: c.description ?? "",
    order: c.rank ?? 0,
  };
}

function toProduct(p: MedusaProduct): Product {
  const cats = p.categories ?? [];
  const parent = cats.find((c) => !c.parent_category_id) ?? null;
  const sub = cats.find((c) => c.parent_category_id) ?? null;
  const price = p.variants?.[0]?.calculated_price?.calculated_amount;
  const promo = p.metadata?.promo_price;
  return {
    id: p.id,
    name: p.title,
    slug: p.handle,
    brand: p.metadata?.brand ?? "",
    category: parent
      ? { id: parent.id, name: parent.name, slug: parent.handle }
      : null,
    subcategory: sub
      ? { id: sub.id, name: sub.name, slug: sub.handle }
      : null,
    price: price != null ? String(price) : "",
    promo_price: promo != null ? String(promo) : undefined,
    featured_image: p.metadata?.featured_image ?? p.thumbnail ?? null,
    gallery: [],
    description: p.description ?? "",
    featured: p.metadata?.featured === true,
    in_stock: p.metadata?.in_stock !== false,
    sale_channel: p.metadata?.sale_channel ?? "in_store",
    variantId: p.variants?.[0]?.id ?? null,
  };
}

// ---- Fetch helpers --------------------------------------------------------

async function fetchAllCategories(): Promise<MedusaCategory[]> {
  const { product_categories } = await sdk.store.category.list({
    limit: 200,
    fields: CATEGORY_FIELDS,
  });
  return (product_categories as unknown as MedusaCategory[]) ?? [];
}

async function fetchProducts(
  query: Record<string, unknown> = {}
): Promise<MedusaProduct[]> {
  const { products } = await sdk.store.product.list({
    region_id: MEDUSA_REGION_ID,
    limit: 200,
    fields: PRODUCT_FIELDS,
    ...query,
  });
  return (products as unknown as MedusaProduct[]) ?? [];
}

const byRank = (a: { rank?: number | null }, b: { rank?: number | null }) =>
  (a.rank ?? 0) - (b.rank ?? 0);

// ---- Categories -----------------------------------------------------------

export async function getAllCategories(): Promise<Category[]> {
  const cats = await fetchAllCategories();
  return cats
    .filter((c) => !c.parent_category_id && c.metadata?.show_in_menu === true)
    .sort(byRank)
    .map(toCategory);
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const cats = await fetchAllCategories();
  const c = cats.find(
    (c) => !c.parent_category_id && (c.handle === slug || c.name === slug)
  );
  return c ? toCategory(c) : null;
}

export async function getAllSubcategories(): Promise<Subcategory[]> {
  const cats = await fetchAllCategories();
  return cats
    .filter((c) => c.parent_category_id)
    .sort(byRank)
    .map(toSubcategory);
}

export async function getSubcategoriesByCategory(
  categoryId: string
): Promise<Subcategory[]> {
  const cats = await fetchAllCategories();
  return cats
    .filter((c) => c.parent_category_id === categoryId)
    .sort(byRank)
    .map(toSubcategory);
}

export async function getSubcategoryBySlug(
  slug: string
): Promise<Subcategory | null> {
  const cats = await fetchAllCategories();
  const c = cats.find(
    (c) => c.parent_category_id && (c.handle === slug || c.name === slug)
  );
  return c ? toSubcategory(c) : null;
}

// ---- Products -------------------------------------------------------------

export async function getAllProducts(): Promise<Product[]> {
  const products = await fetchProducts();
  return products.map(toProduct);
}

export async function getFeaturedProducts(limit = 3): Promise<Product[]> {
  const products = await fetchProducts();
  return products
    .map(toProduct)
    .filter((p) => p.featured && p.in_stock)
    .slice(0, limit);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const products = await fetchProducts({ handle: slug, limit: 1 });
  return products[0] ? toProduct(products[0]) : null;
}

export async function getProductsByCategory(
  categoryId: string
): Promise<Product[]> {
  const products = await fetchProducts({ category_id: [categoryId] });
  return products.map(toProduct);
}

export async function getProductsBySubcategory(
  subcategoryId: string
): Promise<Product[]> {
  const products = await fetchProducts({ category_id: [subcategoryId] });
  return products.map(toProduct);
}

// ---- Brands (cms module) --------------------------------------------------

export async function getAllBrands(): Promise<Brand[]> {
  const { brands } = await sdk.client.fetch<{ brands: any[] }>(
    "/store/cms/brands"
  );
  return (brands ?? []).map((b) => ({
    id: b.id,
    name: b.name,
    slug: b.slug,
    logo: b.logo,
    website: b.website,
    description: b.description,
    order: b.rank ?? 0,
  }));
}
