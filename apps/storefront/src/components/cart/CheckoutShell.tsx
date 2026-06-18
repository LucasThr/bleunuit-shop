import type { ReactNode } from "react";
import { euro } from "../../utils/medusa";
import type { CheckoutState } from "./useCheckout";

const field =
  "w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-[#0f2747] focus:outline-none focus:ring-1 focus:ring-[#0f2747]";

/**
 * Presentational checkout layout shared by the manual and Stripe paths. The
 * payment-specific UI (a note, or Stripe's card field) is injected via
 * `paymentSection`; `onSubmit` is owned by the caller so it can run the
 * provider-specific confirmation before completing the order.
 */
export default function CheckoutShell({
  state,
  paymentSection,
  onSubmit,
  submitLabel = "Valider la commande",
}: {
  state: CheckoutState;
  paymentSection: ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  submitLabel?: string;
}) {
  const {
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
    error,
    done,
  } = state;

  if (done) {
    return (
      <div className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-lg">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#9bc7b5]/30 text-2xl">
          ✅
        </div>
        <h2 className="mt-4 text-2xl text-[#0f2747]" style={{ fontFamily: '"Sora", sans-serif' }}>
          {done.quote ? "Demande enregistrée" : "Commande confirmée"}
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Commande <strong>#{done.display_id}</strong> — total{" "}
          <strong>{euro(done.total)}</strong>.
          {done.quote
            ? " Notre équipe vous recontactera pour la livraison volumineuse."
            : " Un email de confirmation vous a été envoyé."}
        </p>
        <a
          href="/boutique-poc"
          className="mt-6 inline-flex rounded-full bg-[#0f2747] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#16386a]"
        >
          Retour à la boutique
        </a>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-lg">
        Votre panier est vide.{" "}
        <a href="/boutique-poc" className="font-medium text-[#0f2747] underline">
          Voir la boutique
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
      <div className="space-y-8">
        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Coordonnées
          </legend>
          <input
            type="email"
            required
            placeholder="Adresse e-mail"
            className={field}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Adresse de livraison
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <input required placeholder="Prénom" className={field}
              value={addr.first_name}
              onChange={(e) => setAddr({ ...addr, first_name: e.target.value })} />
            <input required placeholder="Nom" className={field}
              value={addr.last_name}
              onChange={(e) => setAddr({ ...addr, last_name: e.target.value })} />
          </div>
          <input required placeholder="Adresse" className={field}
            value={addr.address_1}
            onChange={(e) => setAddr({ ...addr, address_1: e.target.value })} />
          <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
            <input required placeholder="Code postal" className={field}
              value={addr.postal_code}
              onChange={(e) => setAddr({ ...addr, postal_code: e.target.value })} />
            <input required placeholder="Ville" className={field}
              value={addr.city}
              onChange={(e) => setAddr({ ...addr, city: e.target.value })} />
          </div>
          <input placeholder="Téléphone (optionnel)" className={field}
            value={addr.phone}
            onChange={(e) => setAddr({ ...addr, phone: e.target.value })} />
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Livraison
          </legend>
          {options.length === 0 && (
            <p className="text-sm text-slate-400">Chargement des options…</p>
          )}
          {options.map((o) => (
            <label
              key={o.id}
              className={`flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 text-sm transition ${
                optionId === o.id
                  ? "border-[#0f2747] bg-[#0f2747]/5"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <span className="flex items-center gap-3">
                <input
                  type="radio"
                  name="shipping"
                  checked={optionId === o.id}
                  onChange={() => setOptionId(o.id)}
                />
                {o.name}
              </span>
              <span className="font-medium text-[#0f2747]">
                {o.data?.quote_on_request ? "Sur devis" : euro(o.amount ?? 0)}
              </span>
            </label>
          ))}
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Paiement
          </legend>
          {paymentSection}
        </fieldset>
      </div>

      <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
        <h2 className="text-lg text-[#0f2747]" style={{ fontFamily: '"Sora", sans-serif' }}>
          Récapitulatif
        </h2>
        <ul className="mt-4 space-y-3">
          {cart.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-3 text-sm">
              <span className="text-slate-600">
                {item.quantity} × {item.product_title ?? item.title}
              </span>
              <span className="font-medium text-slate-900">{euro(item.total)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 space-y-1 border-t border-slate-200 pt-4 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>Sous-total</span>
            <span>{euro(cart.item_total)}</span>
          </div>
          {selected && !selected.data?.quote_on_request && (
            <div className="flex justify-between text-slate-600">
              <span>Livraison</span>
              <span>{euro(selected.amount ?? 0)}</span>
            </div>
          )}
          <div className="flex justify-between pt-2 text-base font-semibold text-[#0f2747]">
            <span>Total</span>
            <span>
              {euro(
                cart.item_total +
                  (selected?.data?.quote_on_request ? 0 : selected?.amount ?? 0)
              )}
            </span>
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || !optionId}
          className="mt-6 flex w-full items-center justify-center rounded-full bg-[#0f2747] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#16386a] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Traitement…" : submitLabel}
        </button>
      </aside>
    </form>
  );
}
