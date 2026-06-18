// Medusa Store API client for the storefront, built on the official
// @medusajs/js-sdk. The same `sdk` instance is used by SSR pages (catalog
// reads) and by the React cart/checkout islands in the browser — the
// publishable key is public, so it is safe on the client.
import Medusa from "@medusajs/js-sdk";

export const MEDUSA_URL =
  import.meta.env.PUBLIC_MEDUSA_URL || "http://localhost:9000";
export const MEDUSA_PK = import.meta.env.PUBLIC_MEDUSA_PUBLISHABLE_KEY || "";
export const MEDUSA_REGION_ID = import.meta.env.PUBLIC_MEDUSA_REGION_ID || "";

// Stripe publishable key (pk_test_… / pk_live_…). When empty, checkout uses
// the manual payment provider. Distinct from the Medusa publishable key above.
export const STRIPE_PK = import.meta.env.PUBLIC_STRIPE_PUBLISHABLE_KEY || "";

// Medusa payment provider ids.
export const PROVIDER_MANUAL = "pp_system_default";
export const PROVIDER_STRIPE = "pp_stripe_stripe";

export const sdk = new Medusa({
  baseUrl: MEDUSA_URL,
  publishableKey: MEDUSA_PK,
});

// ---- Light types (only the fields the storefront actually reads) ----------

export type ShippingClass = "parcel" | "bulky" | "pickup_only";

export type MedusaVariant = {
  id: string;
  title: string;
  calculated_price?: { calculated_amount: number };
};

export type MedusaProduct = {
  id: string;
  title: string;
  handle: string;
  description?: string;
  thumbnail?: string;
  metadata?: { shipping_class?: ShippingClass } | null;
  variants: MedusaVariant[];
};

export type MedusaLineItem = {
  id: string;
  title: string;
  product_title?: string;
  variant_title?: string;
  thumbnail?: string;
  quantity: number;
  unit_price: number;
  total: number;
};

export type MedusaCart = {
  id: string;
  email?: string;
  currency_code: string;
  region_id: string;
  items: MedusaLineItem[];
  item_total: number;
  shipping_total: number;
  tax_total: number;
  total: number;
};

export type ShippingOption = {
  id: string;
  name: string;
  amount: number;
  data?: {
    shipping_class?: ShippingClass;
    pickup?: boolean;
    quote_on_request?: boolean;
  } | null;
};

// Fields requested for any cart read so the UI has line items + totals.
export const CART_FIELDS =
  "*items,*items.variant,*items.product,+items.thumbnail," +
  "*region,*shipping_methods,+total,+item_total,+shipping_total,+tax_total";

// ---- Catalog --------------------------------------------------------------

export async function getProducts(): Promise<MedusaProduct[]> {
  const { products } = await sdk.store.product.list({
    region_id: MEDUSA_REGION_ID,
    fields:
      "title,handle,description,thumbnail,metadata,*variants,*variants.calculated_price",
  });
  return products as unknown as MedusaProduct[];
}

// ---- Formatting -----------------------------------------------------------

export const euro = (n: number) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(n);
