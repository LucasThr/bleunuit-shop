# Context

Domain glossary for the bleunuit storefront + Medusa backend. (Architecture
vocabulary — module, interface, seam, deep/shallow, leverage, locality — lives
in the architecture-review skill; this file names the *domain*.)

## Sale channel

How a product is sold. An enum stored on product `metadata.sale_channel`:

- `online` — sold online: cart + Stripe checkout.
- `in_store` — sold in-store only: the storefront offers a *devis* (quote).
- `both` — sold both ways: cart, with the devis as a secondary option.

Set per product by the admin "Mode de vente" widget
(`apps/backend/src/admin/widgets/product-online-sale.tsx`). Defaults to
`in_store`. Replaces the retired boolean `metadata.purchasable` (`true` migrated
to `both`).

## Sale mode

The storefront's *verdict* for a product, derived from its sale channel,
availability, and variant by the single owner `saleMode()`
(`apps/storefront/src/utils/sale-mode.ts`). Every CTA reads this instead of
inspecting metadata itself:

- `online` — the online channel sells it.
- `inStore` — the in-store channel sells it (show a devis).
- `canCheckout` — `online` **and** actually buyable now (has a variant, in stock).

Channel and availability are separate axes: an online product that is out of
stock is still `online` (the storefront shows a disabled "Rupture de stock"
cart, not a devis), it just isn't `canCheckout`.

## Devis

An in-store quote request. A shopper submits the QuoteRequestForm; it posts to
`POST /store/quotes` and is stored by the quotes module as a lead the team
manages from the admin "Devis" page.
