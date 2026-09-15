import { describe, it, expect } from "vitest";
import { toProduct } from "./catalog-client";

type RawProduct = Parameters<typeof toProduct>[0];

function makeRaw(overrides: Partial<RawProduct> = {}): RawProduct {
  return {
    id: "prod_1",
    title: "Matelas Confort",
    handle: "matelas-confort",
    ...overrides,
  };
}

// A variant as the Store API returns it, with the doubly-nested calculated
// price Medusa uses to report which price won.
function rawVariant(
  id: string,
  calculated: number,
  extra: { original?: number; priceListType?: string; size?: string } = {}
) {
  return {
    id,
    title: extra.size ?? "Standard",
    options: extra.size
      ? [{ value: extra.size, option: { title: "Dimensions" } }]
      : [],
    calculated_price: {
      calculated_amount: calculated,
      original_amount: extra.original ?? calculated,
      calculated_price: extra.priceListType
        ? { price_list_type: extra.priceListType }
        : null,
    },
  };
}

describe("toProduct", () => {
  it("reads the price off the only variant when nothing is on sale", () => {
    const p = toProduct(makeRaw({ variants: [rawVariant("var_1", 599)] }));
    expect(p.price).toBe("599");
    expect(p.promo_price).toBeUndefined();
    expect(p.variantId).toBe("var_1");
  });

  it("shows the pre-sale price struck through when a sale price list applies", () => {
    const p = toProduct(
      makeRaw({
        variants: [
          rawVariant("var_1", 899, { original: 1299, priceListType: "sale" }),
        ],
      })
    );
    // price is what gets struck through, promo_price is what the buyer pays —
    // the convention the card and the product page already used.
    expect(p.price).toBe("1299");
    expect(p.promo_price).toBe("899");
    expect(p.variants[0].originalPrice).toBe(1299);
  });

  it("does not strike a price for an override price list", () => {
    const p = toProduct(
      makeRaw({
        variants: [
          rawVariant("var_1", 899, { original: 899, priceListType: "override" }),
        ],
      })
    );
    expect(p.price).toBe("899");
    expect(p.promo_price).toBeUndefined();
    expect(p.variants[0].originalPrice).toBeNull();
  });

  it("sorts variants cheapest-first and advertises the cheapest price", () => {
    const p = toProduct(
      makeRaw({
        variants: [
          rawVariant("var_180", 1499, { size: "180×200" }),
          rawVariant("var_90", 599, { size: "90×190" }),
          rawVariant("var_140", 899, { size: "140×190" }),
        ],
      })
    );
    expect(p.variants.map((v) => v.title)).toEqual([
      "90×190",
      "140×190",
      "180×200",
    ]);
    expect(p.price).toBe("599");
    expect(p.variantId).toBe("var_90");
  });

  it("keys option values by option name so the picker can label itself", () => {
    const p = toProduct(
      makeRaw({ variants: [rawVariant("var_1", 599, { size: "140×190" })] })
    );
    expect(p.variants[0].options).toEqual({ Dimensions: "140×190" });
  });

  it("still honours a legacy metadata promo price", () => {
    const p = toProduct(
      makeRaw({
        metadata: { promo_price: 449 },
        variants: [rawVariant("var_1", 599)],
      })
    );
    expect(p.price).toBe("599");
    expect(p.promo_price).toBe("449");
  });

  it("survives a product with no variants", () => {
    const p = toProduct(makeRaw({ variants: [] }));
    expect(p.price).toBe("");
    expect(p.variantId).toBeNull();
    expect(p.variants).toEqual([]);
  });
});
