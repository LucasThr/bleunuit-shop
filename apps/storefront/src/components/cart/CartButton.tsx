import { useEffect } from "react";
import { useStore } from "@nanostores/react";
import { $itemCount, openCart, loadCart } from "../../stores/cart";

/**
 * Header cart icon with a live item-count badge. Mounted once per page; it
 * hydrates the cart from localStorage + Medusa on first load.
 */
export default function CartButton() {
  const count = useStore($itemCount);

  useEffect(() => {
    loadCart();
  }, []);

  return (
    <button
      type="button"
      onClick={openCart}
      aria-label={`Panier (${count} article${count > 1 ? "s" : ""})`}
      className="relative inline-flex h-11 w-11 items-center justify-center rounded-full text-gray-900 transition hover:bg-gray-100 hover:text-blue-600"
    >
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.8}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
        />
      </svg>
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[#f6b88f] px-1 text-[11px] font-bold text-[#0f2747]">
          {count}
        </span>
      )}
    </button>
  );
}
