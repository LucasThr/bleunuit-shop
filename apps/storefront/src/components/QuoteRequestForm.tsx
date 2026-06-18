import { useState } from "react";
import { sdk } from "../utils/medusa";

type Props = {
  productId?: string;
  productTitle: string;
  // "primary" = the main CTA (in-store-only products). "secondary" = a subdued
  // link shown under the cart for products sold both online and in-store.
  variant?: "primary" | "secondary";
};

const field =
  "w-full rounded-md border border-gray-200 px-4 py-3 text-sm focus:border-marine focus:outline-none focus:ring-1 focus:ring-marine";

/**
 * "Demander un devis" CTA for in-store-only products. Opens a modal with a
 * short form and posts it to the Medusa store API (POST /store/quotes), where
 * it is stored as a lead the team manages from the admin "Devis" page.
 */
export default function QuoteRequestForm({
  productId,
  productTitle,
  variant = "primary",
}: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState(
    `Bonjour, je souhaite recevoir un devis pour : ${productTitle}.`
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function close() {
    setOpen(false);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await sdk.client.fetch("/store/quotes", {
        method: "POST",
        body: {
          name,
          email,
          phone: phone || null,
          message: message || null,
          product_id: productId ?? null,
          product_title: productTitle,
        },
      });
      setDone(true);
    } catch (err: any) {
      setError(err?.message ?? "L'envoi a échoué. Réessayez.");
    } finally {
      setSubmitting(false);
    }
  }

  const isPrimary = variant !== "secondary";

  return (
    <>
      {isPrimary ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="btn-primary flex w-full items-center justify-center gap-2 rounded-xl px-8 py-4 text-base font-semibold"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 4h6l4 4v12H8V4Z M14 4v4h4 M10.5 13h5 M10.5 16h3.5" />
          </svg>
          Demander un devis
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-center justify-center gap-1.5 py-3 text-sm font-medium text-marine/80 underline-offset-4 transition hover:text-marine hover:underline"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 4h6l4 4v12H8V4Z M14 4v4h4" />
          </svg>
          Ou demander un devis
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            onClick={close}
            className="absolute inset-0 bg-black/50"
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-label="Demander un devis"
            className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Demander un devis
              </h2>
              <button
                type="button"
                onClick={close}
                aria-label="Fermer"
                className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {done ? (
              <div className="px-6 py-10 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success-bg text-2xl">
                  ✅
                </div>
                <h3 className="mt-4 text-xl font-semibold text-gray-900">
                  Demande envoyée
                </h3>
                <p className="mt-2 text-sm text-gray-700">
                  Merci ! Notre équipe vous recontactera rapidement avec un devis
                  pour <strong>{productTitle}</strong>.
                </p>
                <button
                  type="button"
                  onClick={close}
                  className="btn-primary mt-6 inline-flex rounded-xl px-6 py-3 text-sm font-semibold"
                >
                  Fermer
                </button>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4 px-6 py-6">
                <p className="text-sm text-gray-700">
                  Produit : <strong>{productTitle}</strong>
                </p>
                <input
                  required
                  placeholder="Nom complet"
                  className={field}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <input
                  required
                  type="email"
                  placeholder="Adresse e-mail"
                  className={field}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <input
                  type="tel"
                  placeholder="Téléphone (optionnel)"
                  className={field}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <textarea
                  rows={4}
                  placeholder="Votre message"
                  className={field}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />

                {error && (
                  <p className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary flex w-full items-center justify-center rounded-xl px-8 py-3 text-base font-semibold"
                >
                  {submitting ? "Envoi…" : "Envoyer la demande"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
