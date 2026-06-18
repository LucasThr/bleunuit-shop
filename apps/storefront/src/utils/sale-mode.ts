import type { Product, SaleChannel } from "./catalog-client";

// The single owner of the online-vs-in-store decision. Every CTA and badge
// reads this verdict instead of inspecting sale_channel / stock / variant
// itself, so the rule lives in one place.
//
//   online      — the product is sold through the online channel
//   inStore     — the product is sold in-store (offer a "devis")
//   canCheckout — online AND actually buyable right now (has a variant, in stock)
//
// channel and availability are separate axes: an online product that is out of
// stock is still `online` (so we show a disabled cart, not a devis fallback),
// it just isn't `canCheckout`.
export type SaleMode = {
  online: boolean;
  inStore: boolean;
  canCheckout: boolean;
};

export function saleMode(
  product: Pick<Product, "sale_channel" | "in_stock" | "variantId">
): SaleMode {
  const channel: SaleChannel = product.sale_channel;
  const online = channel === "online" || channel === "both";
  const inStore = channel === "in_store" || channel === "both";
  const canCheckout = online && !!product.variantId && product.in_stock;
  return { online, inStore, canCheckout };
}
