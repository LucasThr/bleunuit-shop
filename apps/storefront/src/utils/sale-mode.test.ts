import { describe, it, expect } from "vitest";
import { saleMode } from "./sale-mode";

describe("saleMode", () => {
  it("online + in stock + variant → cart, can check out", () => {
    expect(
      saleMode({ sale_channel: "online", in_stock: true, variantId: "var_1" })
    ).toEqual({ online: true, inStore: false, canCheckout: true });
  });

  it("online + out of stock → still online, but no checkout and no devis", () => {
    expect(
      saleMode({ sale_channel: "online", in_stock: false, variantId: "var_1" })
    ).toEqual({ online: true, inStore: false, canCheckout: false });
  });

  it("online + no variant → cannot check out", () => {
    expect(
      saleMode({ sale_channel: "online", in_stock: true, variantId: null })
    ).toEqual({ online: true, inStore: false, canCheckout: false });
  });

  it("in_store → devis only", () => {
    expect(
      saleMode({ sale_channel: "in_store", in_stock: true, variantId: "var_1" })
    ).toEqual({ online: false, inStore: true, canCheckout: false });
  });

  it("both + in stock → cart and devis", () => {
    expect(
      saleMode({ sale_channel: "both", in_stock: true, variantId: "var_1" })
    ).toEqual({ online: true, inStore: true, canCheckout: true });
  });

  it("both + out of stock → devis stays, cart disabled", () => {
    expect(
      saleMode({ sale_channel: "both", in_stock: false, variantId: "var_1" })
    ).toEqual({ online: true, inStore: true, canCheckout: false });
  });
});
