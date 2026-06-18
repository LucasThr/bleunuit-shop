// Shared cart state for the storefront. nanostores is a tiny framework-agnostic
// store; because it's a module singleton, every React island (cart button,
// drawer, add-to-cart, checkout) reads and writes the *same* cart, and the
// cart id survives full page navigations via localStorage.
import { atom } from "nanostores";
import { persistentAtom } from "@nanostores/persistent";
import {
  sdk,
  MEDUSA_REGION_ID,
  CART_FIELDS,
  type MedusaCart,
} from "../utils/medusa";

// Only the id is persisted — the cart itself is always re-fetched from Medusa
// so totals/stock are never stale.
export const $cartId = persistentAtom<string>("bleunuit:cart_id", "");

export const $cart = atom<MedusaCart | null>(null);
export const $cartOpen = atom<boolean>(false);
export const $busy = atom<boolean>(false);
export const $error = atom<string | null>(null);

export const $itemCount = atom<number>(0);
function recomputeCount(cart: MedusaCart | null) {
  $itemCount.set(cart ? cart.items.reduce((n, i) => n + i.quantity, 0) : 0);
}
$cart.subscribe(recomputeCount);

function setCart(cart: MedusaCart | null) {
  $cart.set(cart);
}

/** Retrieve the current cart from Medusa, clearing a stale/invalid id. */
export async function loadCart(): Promise<MedusaCart | null> {
  const id = $cartId.get();
  if (!id) return null;
  try {
    const { cart } = await sdk.store.cart.retrieve(id, { fields: CART_FIELDS });
    // A completed cart is no longer usable — start fresh next time.
    if ((cart as any).completed_at) {
      clearCart();
      return null;
    }
    setCart(cart as unknown as MedusaCart);
    return $cart.get();
  } catch {
    // Stale id (e.g. backend DB reset) — drop it silently.
    clearCart();
    return null;
  }
}

/** Return the active cart id, creating an empty cart if needed. */
async function ensureCart(): Promise<string> {
  const id = $cartId.get();
  if (id) return id;
  const { cart } = await sdk.store.cart.create(
    { region_id: MEDUSA_REGION_ID },
    { fields: CART_FIELDS }
  );
  $cartId.set(cart.id);
  setCart(cart as unknown as MedusaCart);
  return cart.id;
}

async function run<T>(fn: () => Promise<T>): Promise<T | undefined> {
  $busy.set(true);
  $error.set(null);
  try {
    return await fn();
  } catch (e: any) {
    $error.set(e?.message ?? "Erreur Medusa");
    return undefined;
  } finally {
    $busy.set(false);
  }
}

export function openCart() {
  $cartOpen.set(true);
}
export function closeCart() {
  $cartOpen.set(false);
}

export async function addItem(variantId: string, quantity = 1) {
  await run(async () => {
    const id = await ensureCart();
    const { cart } = await sdk.store.cart.createLineItem(
      id,
      { variant_id: variantId, quantity },
      { fields: CART_FIELDS }
    );
    setCart(cart as unknown as MedusaCart);
    openCart();
  });
}

export async function setQuantity(lineItemId: string, quantity: number) {
  if (quantity < 1) return removeItem(lineItemId);
  await run(async () => {
    const id = $cartId.get();
    if (!id) return;
    const { cart } = await sdk.store.cart.updateLineItem(
      id,
      lineItemId,
      { quantity },
      { fields: CART_FIELDS }
    );
    setCart(cart as unknown as MedusaCart);
  });
}

export async function removeItem(lineItemId: string) {
  await run(async () => {
    const id = $cartId.get();
    if (!id) return;
    await sdk.store.cart.deleteLineItem(id, lineItemId);
    await loadCart();
  });
}

/** Forget the current cart (after an order completes). */
export function clearCart() {
  $cartId.set("");
  setCart(null);
}
