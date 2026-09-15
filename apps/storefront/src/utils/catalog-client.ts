// Storefront catalog reads from native Medusa (products + product categories)
// and the cms module (brands). Each function returns the same shape the
// storefront previously got from Directus, so the Astro templates are
// unchanged. Per-product attributes Medusa has no native field for (brand,
// promo price, featured, stock, subcategory) live in product metadata.
import { sdk, MEDUSA_REGION_ID } from "./medusa";
import { memoizeTtl } from "./ttl-cache";

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

// One buyable size of a product. `title` is the variant label Medusa builds
// from its option values ("140×190"); `options` keeps them addressable by
// option name so the picker can label the control ("Dimensions").
export type ProductVariant = {
  id: string;
  title: string;
  options: Record<string, string>;
  // Price to charge. When the variant is on sale (a `sale` price list is
  // active), `originalPrice` holds the pre-sale price to strike through.
  price: number;
  originalPrice: number | null;
};

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
  // Cheapest variant id — the default selection, and the one whose price the
  // card and the product page show before the buyer picks a size.
  variantId: string | null;
  // Every buyable size. Card lists don't request option values, so there it
  // carries prices only (used for the "à partir de" floor).
  variants: ProductVariant[];
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
  parent_category?: { id: string; name: string; handle: string } | null;
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
  variants?: MedusaVariant[];
};

type MedusaVariant = {
  id: string;
  title?: string | null;
  options?: { value: string; option?: { title?: string | null } | null }[];
  calculated_price?: {
    calculated_amount?: number;
    original_amount?: number;
    // Nested twice: the outer key is the calculated price *set*, the inner one
    // the price that won. `price_list_type === "sale"` is what marks a sale.
    calculated_price?: { price_list_type?: string | null } | null;
  };
};

// Fields common to product lists and the product detail page. Card lists never
// read `description` (full HTML), so it is added only in PRODUCT_FIELDS below.
const PRODUCT_LIST_FIELDS =
  "id,title,handle,thumbnail,metadata," +
  "categories.id,categories.name,categories.handle,categories.parent_category_id," +
  "categories.parent_category.id,categories.parent_category.name,categories.parent_category.handle," +
  "variants.id,*variants.calculated_price";

// The product page additionally needs each variant's label and option values
// to render the size picker. Lists never show a picker, so they skip this.
const PRODUCT_FIELDS =
  `${PRODUCT_LIST_FIELDS},description,` +
  "variants.title,variants.options.value,variants.options.option.title";

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

function toVariant(v: MedusaVariant): ProductVariant {
  const calc = v.calculated_price;
  const price = calc?.calculated_amount ?? 0;
  // Medusa only treats a `sale` price list as a discount; an `override` list
  // reports the same amount twice, which must not render as a struck price.
  const onSale = calc?.calculated_price?.price_list_type === "sale";
  const original = calc?.original_amount;
  return {
    id: v.id,
    title: v.title ?? "",
    options: Object.fromEntries(
      (v.options ?? [])
        .filter((o) => o.option?.title)
        .map((o) => [o.option!.title!, o.value])
    ),
    price,
    originalPrice: onSale && original != null && original > price ? original : null,
  };
}

// Exported for tests: this is where sale detection and the cheapest-variant
// rule live, and both are easy to get subtly wrong.
export function toProduct(p: MedusaProduct): Product {
  const cats = p.categories ?? [];
  const parent = cats.find((c) => !c.parent_category_id) ?? null;
  const sub = cats.find((c) => c.parent_category_id) ?? null;
  // A product assigned only to a subcategory has no parent in `cats`; recover it
  // from the subcategory's own parent_category so the canonical URL is correct.
  const parentFromSub = sub?.parent_category ?? null;
  const effectiveParent = parent ?? parentFromSub;
  // Sorted cheapest-first: the picker shows sizes in ascending price (which for
  // bedding is also ascending size), and variants[0] is the default selection —
  // the one whose price the card advertises as "à partir de".
  const variants = (p.variants ?? [])
    .map(toVariant)
    .sort((a, b) => a.price - b.price);
  const cheapest = variants[0] ?? null;
  // A sale price list already gives us both numbers. `metadata.promo_price` is
  // the pre-price-list way of doing this; it stays as a fallback until the last
  // product using it is migrated.
  const legacyPromo = p.metadata?.promo_price;
  const price = cheapest?.originalPrice ?? cheapest?.price;
  const promo =
    cheapest?.originalPrice != null ? cheapest.price : legacyPromo ?? null;
  return {
    id: p.id,
    name: p.title,
    slug: p.handle,
    brand: p.metadata?.brand ?? "",
    category: effectiveParent
      ? { id: effectiveParent.id, name: effectiveParent.name, slug: effectiveParent.handle }
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
    variantId: cheapest?.id ?? null,
    variants,
  };
}

// ---- Fetch helpers --------------------------------------------------------

async function fetchAllCategoriesRaw(): Promise<MedusaCategory[]> {
  const { product_categories } = await sdk.store.category.list({
    limit: 200,
    fields: CATEGORY_FIELDS,
  });
  return (product_categories as unknown as MedusaCategory[]) ?? [];
}

// The category list feeds the nav on every SSR page; memoize it with a short
// TTL so a page render triggers at most one category.list per window.
const CATEGORY_TTL_MS = 60_000;
const fetchAllCategories = memoizeTtl(fetchAllCategoriesRaw, CATEGORY_TTL_MS);

async function fetchProducts(
  query: Record<string, unknown> = {},
  fields: string = PRODUCT_LIST_FIELDS
): Promise<MedusaProduct[]> {
  const { products } = await sdk.store.product.list({
    region_id: MEDUSA_REGION_ID,
    limit: 200,
    fields,
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
  const products = await fetchProducts({ handle: slug, limit: 1 }, PRODUCT_FIELDS);
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

// Related products for the product page: fetch only what's needed (limit + 1 to
// absorb excluding the current product) instead of the whole category.
export async function getRelatedProducts(
  categoryId: string,
  excludeSlug: string,
  limit = 3
): Promise<Product[]> {
  const products = await fetchProducts({ category_id: [categoryId], limit: limit + 1 });
  return products
    .map(toProduct)
    .filter((p) => p.slug !== excludeSlug)
    .slice(0, limit);
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
