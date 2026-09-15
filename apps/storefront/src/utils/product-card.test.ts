import { describe, it, expect } from "vitest";
import { mapProductToCard } from "./product-card";
import type { Product } from "./catalog-client";

// Minimal valid Product; each test overrides only what it exercises.
function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "prod_1",
    name: "Matelas Confort",
    slug: "matelas-confort",
    brand: "Bleunuit",
    category: { id: "cat_1", name: "Matelas", slug: "matelas" },
    subcategory: null,
    price: "499",
    featured_image: "https://cdn.example.com/matelas.jpg",
    gallery: [],
    description: "",
    featured: false,
    in_stock: true,
    sale_channel: "in_store",
    variantId: null,
    variants: [],
    ...overrides,
  };
}

describe("mapProductToCard", () => {
  it("uses the parent category slug when a category is set", () => {
    const card = mapProductToCard(makeProduct());
    expect(card.categorySlug).toBe("matelas");
    expect(card.categoryName).toBe("Matelas");
  });

  it("falls back to 'produits' (never '') when the product has no category", () => {
    const card = mapProductToCard(makeProduct({ category: null }));
    expect(card.categorySlug).toBe("produits");
    expect(card.categoryName).toBe("Produits");
  });

  it("returns a placeholder image when the product has no featured_image", () => {
    const card = mapProductToCard(makeProduct({ featured_image: null }));
    expect(card.image).toBe("/images/placeholder-product.svg");
  });

  it("maps an empty brand to an empty string", () => {
    const card = mapProductToCard(makeProduct({ brand: "" }));
    expect(card.brand).toBe("");
  });
});
