import { useState } from "react";
import type { ProductVariant } from "../utils/catalog-client";
import AddToCartButton from "./cart/AddToCartButton";

type Props = {
  variants: ProductVariant[];
  // saleMode().canCheckout — the product is sold online and buyable right now.
  canCheckout: boolean;
};

/**
 * Price + size picker + cart button for the product page.
 *
 * These three belong to one island because they all answer to the same state:
 * picking a size changes the price shown and the variant added to the cart.
 * A single-variant product renders no picker, just its price.
 */
export default function ProductBuyBox({ variants, canCheckout }: Props) {
  // variants arrive cheapest-first (catalog-client), so the default selection
  // matches the "à partir de" price the buyer clicked through from.
  const [selectedId, setSelectedId] = useState(variants[0]?.id ?? "");
  const selected = variants.find((v) => v.id === selectedId) ?? variants[0];

  if (!selected) return null;

  // Products carry a single option axis (Dimensions, or Format), so the first
  // option name labels the picker.
  const optionName = Object.keys(selected.options)[0] ?? "Taille";
  const original = selected.originalPrice;
  const discount = original
    ? Math.round(((original - selected.price) / original) * 100)
    : 0;

  return (
    <div>
      {original && (
        <div className="mb-4 inline-block rounded-full bg-promo px-4 py-1 text-sm font-bold text-white">
          -{discount}% de réduction
        </div>
      )}

      {selected.price > 0 && (
        <div className="mb-8">
          {original ? (
            <div>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-promo">
                  {selected.price.toLocaleString("fr-FR")}€
                </span>
                <span className="text-xl text-gray-500 line-through">
                  {original.toLocaleString("fr-FR")}€
                </span>
              </div>
              <p className="mt-2 text-sm font-medium text-promo">
                Économisez {(original - selected.price).toLocaleString("fr-FR")}€
              </p>
            </div>
          ) : (
            <span className="text-4xl font-bold text-gray-900">
              {selected.price.toLocaleString("fr-FR")}€
            </span>
          )}
        </div>
      )}

      {variants.length > 1 && (
        <fieldset className="mb-8">
          <legend className="mb-3 text-sm font-semibold text-marine">
            {optionName}
          </legend>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => (
              <label
                key={v.id}
                className={`cursor-pointer rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                  v.id === selected.id
                    ? "border-marine bg-marine text-white"
                    : "border-gray-300 text-gray-700 hover:border-marine"
                }`}
              >
                <input
                  type="radio"
                  name="variant"
                  value={v.id}
                  checked={v.id === selected.id}
                  onChange={() => setSelectedId(v.id)}
                  className="sr-only"
                />
                {v.title}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {canCheckout && (
        <div className="mb-3">
          <AddToCartButton variantId={selected.id} size="block" />
        </div>
      )}
    </div>
  );
}
