import { useState } from "react";
import { addItem } from "../../stores/cart";

type Props = {
  variantId?: string;
  label?: string;
  className?: string;
  // "pill" = compact rounded pill (cards). "block" = full-width primary CTA
  // (product page buy box).
  size?: "pill" | "block";
};

/**
 * Adds one unit of a variant to the shared cart and opens the drawer.
 * Rendered as an island on Astro product cards.
 */
export default function AddToCartButton({
  variantId,
  label = "Ajouter au panier",
  className = "",
  size = "pill",
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

  const geometry =
    size === "block"
      ? "w-full rounded-xl px-8 py-4 text-base"
      : "rounded-full px-6 py-3 text-sm";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`btn-primary flex items-center justify-center gap-2 font-semibold ${geometry} ${className}`}
    >
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.8}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6 7h12l-1 12.5a1 1 0 0 1-1 .9H8a1 1 0 0 1-1-.9L6 7Z M9 7V5.5a3 3 0 0 1 6 0V7"
        />
      </svg>
      {pending ? "Ajout…" : label}
    </button>
  );
}
