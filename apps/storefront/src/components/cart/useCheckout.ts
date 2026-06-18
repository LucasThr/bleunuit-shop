// Shared checkout state + steps, reused by both the manual and Stripe payment
// paths. Holds contact/address/shipping selection and exposes the two backend
// steps every path needs: prepareCart() (email + addresses + shipping method)
// and finalizeOrder() (complete the cart into an order).
import { useEffect, useState } from "react";
import { useStore } from "@nanostores/react";
import { $cart, loadCart, clearCart } from "../../stores/cart";
import {
  sdk,
  CART_FIELDS,
  type ShippingOption,
  type MedusaCart,
} from "../../utils/medusa";

export type Address = {
  first_name: string;
  last_name: string;
  address_1: string;
  postal_code: string;
  city: string;
  phone: string;
};

export const EMPTY_ADDRESS: Address = {
  first_name: "",
  last_name: "",
  address_1: "",
  postal_code: "",
  city: "",
  phone: "",
};

export type OrderDone = { display_id: number; total: number; quote: boolean };

export function useCheckout() {
  const cart = useStore($cart);
  const [email, setEmail] = useState("");
  const [addr, setAddr] = useState<Address>(EMPTY_ADDRESS);
  const [options, setOptions] = useState<ShippingOption[]>([]);
  const [optionId, setOptionId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<OrderDone | null>(null);

  // Hydrate the cart (supports direct navigation) and load shipping options.
  useEffect(() => {
    (async () => {
      const c = (await loadCart()) ?? $cart.get();
      if (!c) return;
      try {
        const { shipping_options } = await sdk.store.fulfillment.listCartOptions(
          { cart_id: c.id }
        );
        const opts = shipping_options as unknown as ShippingOption[];
        setOptions(opts);
        if (opts[0]) setOptionId(opts[0].id);
      } catch (e: any) {
        setError(e?.message ?? "Impossible de charger les options de livraison");
      }
    })();
  }, []);

  const selected = options.find((o) => o.id === optionId);

  /** Save contact + addresses and attach the chosen shipping method. */
  async function prepareCart(): Promise<MedusaCart> {
    const address = { ...addr, country_code: "fr" };
    await sdk.store.cart.update(cart!.id, {
      email,
      shipping_address: address,
      billing_address: address,
    });
    const { cart: withShipping } = await sdk.store.cart.addShippingMethod(
      cart!.id,
      { option_id: optionId },
      { fields: CART_FIELDS }
    );
    return withShipping as unknown as MedusaCart;
  }

  /** Complete the cart into an order and clear local cart state. */
  async function finalizeOrder(): Promise<void> {
    const res = await sdk.store.cart.complete(cart!.id);
    if (res.type !== "order") {
      throw new Error(
        (res as any).error?.message ?? "La commande n'a pas pu être finalisée"
      );
    }
    const order = res.order as any;
    clearCart();
    setDone({
      display_id: order.display_id,
      total: order.total,
      quote: !!selected?.data?.quote_on_request,
    });
  }

  return {
    cart,
    email,
    setEmail,
    addr,
    setAddr,
    options,
    optionId,
    setOptionId,
    selected,
    submitting,
    setSubmitting,
    error,
    setError,
    done,
    prepareCart,
    finalizeOrder,
  };
}

export type CheckoutState = ReturnType<typeof useCheckout>;
