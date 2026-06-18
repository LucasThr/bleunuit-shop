import { useState } from "react";
import { addItem } from "../../stores/cart";

type Props = {
  variantId?: string;
  label?: string;
  className?: string;
};

/**
 * Adds one unit of a variant to the shared cart and opens the drawer.
 * Rendered as an island on Astro product cards.
 */
export default function AddToCartButton({
  variantId,
  label = "Ajouter au panier",
  className = "",
}: Props) {
  const [pending, setPending] = useState(false);
  const disabled = !variantId || pending;

  async function onClick() {
    if (!variantId) return;
    setPending(true);
    try {
      await addItem(variantId, 1);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={
        "inline-flex items-center justify-center gap-2 rounded-full bg-[#0f2747] " +
        "px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#16386a] " +
        "disabled:cursor-not-allowed disabled:opacity-50 " +
        className
      }
    >
      {pending ? "Ajout…" : label}
    </button>
  );
}
