import { useEffect } from "react";
import { useStore } from "@nanostores/react";
import {
  $cart,
  $cartOpen,
  $busy,
  $error,
  closeCart,
  setQuantity,
  removeItem,
} from "../../stores/cart";
import { euro } from "../../utils/medusa";

/**
 * Slide-over cart drawer. Lives in the root layout so it's available on every
 * page; opens whenever the shared store's $cartOpen flips true.
 */
export default function CartDrawer() {
  const cart = useStore($cart);
  const open = useStore($cartOpen);
  const busy = useStore($busy);
  const error = useStore($error);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeCart();
    }
    if (open) {
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const items = cart?.items ?? [];
  const isEmpty = items.length === 0;

  return (
    <div
      aria-hidden={!open}
      className={`fixed inset-0 z-[100] ${open ? "" : "pointer-events-none"}`}
    >
      {/* Backdrop */}
      <div
        onClick={closeCart}
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-label="Panier"
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2
            className="text-lg font-semibold text-marine"
          >
            Votre panier
          </h2>
          <button
            type="button"
            onClick={closeCart}
            aria-label="Fermer"
            className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        {error && (
          <p className="mx-5 mt-4 rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {isEmpty ? (
            <p className="mt-10 text-center text-sm text-gray-500">
              Votre panier est vide.
            </p>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li key={item.id} className="flex gap-3">
                  <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100">
                    {item.thumbnail && (
                      <img
                        src={item.thumbnail}
                        alt={item.product_title ?? item.title}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col">
                    <div className="flex justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900">
                        {item.product_title ?? item.title}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        aria-label="Retirer"
                        className="text-gray-400 transition hover:text-danger"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                      </button>
                    </div>
                    {item.variant_title && (
                      <p className="text-xs text-gray-500">{item.variant_title}</p>
                    )}
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="inline-flex items-center rounded-full border border-gray-200">
                        <button
                          type="button"
                          onClick={() => setQuantity(item.id, item.quantity - 1)}
                          disabled={busy}
                          aria-label="Diminuer"
                          className="px-3 py-1 text-gray-700 transition hover:text-marine disabled:opacity-40"
                        >
                          −
                        </button>
                        <span className="min-w-[2ch] text-center text-sm font-medium">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQuantity(item.id, item.quantity + 1)}
                          disabled={busy}
                          aria-label="Augmenter"
                          className="px-3 py-1 text-gray-700 transition hover:text-marine disabled:opacity-40"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-sm font-semibold text-marine">
                        {euro(item.total)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {!isEmpty && (
          <footer className="border-t border-gray-200 px-5 py-4">
            <div className="flex items-center justify-between text-sm text-gray-700">
              <span>Sous-total</span>
              <span className="text-base font-semibold text-marine">
                {euro(cart!.item_total)}
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-400">
              Livraison calculée à l'étape suivante.
            </p>
            <a
              href="/commande"
              className="btn-primary mt-4 flex w-full items-center justify-center rounded-full px-6 py-3 text-sm font-semibold"
            >
              Passer la commande
            </a>
          </footer>
        )}
      </aside>
    </div>
  );
}
