import { useEffect, useState } from "react";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import {
  sdk,
  STRIPE_PK,
  MEDUSA_REGION_ID,
  PROVIDER_MANUAL,
  PROVIDER_STRIPE,
} from "../../utils/medusa";
import { useCheckout } from "./useCheckout";
import CheckoutShell from "./CheckoutShell";

// One Stripe.js instance for the page (only loaded when a key is configured).
const stripePromise: Promise<Stripe | null> | null = STRIPE_PK
  ? loadStripe(STRIPE_PK)
  : null;

type Mode = "loading" | "manual" | "stripe";

/**
 * Checkout entry point. Detects which payment providers the region offers and
 * renders the matching path: Stripe card form when Stripe is enabled on the
 * backend AND a publishable key is configured, otherwise the manual provider.
 */
export default function CheckoutForm() {
  const [mode, setMode] = useState<Mode>("loading");

  useEffect(() => {
    (async () => {
      try {
        const { payment_providers } = await sdk.store.payment.listPaymentProviders(
          { region_id: MEDUSA_REGION_ID }
        );
        const hasStripe = (payment_providers ?? []).some((p: any) =>
          p.id?.startsWith("pp_stripe")
        );
        setMode(hasStripe && stripePromise ? "stripe" : "manual");
      } catch {
        setMode("manual");
      }
    })();
  }, []);

  if (mode === "loading") {
    return (
      <p className="text-center text-sm text-slate-400">Chargement du paiement…</p>
    );
  }

  if (mode === "stripe" && stripePromise) {
    return (
      <Elements stripe={stripePromise}>
        <StripeCheckout />
      </Elements>
    );
  }

  return <ManualCheckout />;
}

// ---- Manual provider ------------------------------------------------------

function ManualCheckout() {
  const state = useCheckout();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!state.cart || !state.optionId) return;
    state.setSubmitting(true);
    state.setError(null);
    try {
      const prepared = await state.prepareCart();
      await sdk.store.payment.initiatePaymentSession(prepared as any, {
        provider_id: PROVIDER_MANUAL,
      });
      await state.finalizeOrder();
    } catch (err: any) {
      state.setError(err?.message ?? "Erreur lors de la commande");
    } finally {
      state.setSubmitting(false);
    }
  }

  return (
    <CheckoutShell
      state={state}
      onSubmit={onSubmit}
      paymentSection={
        <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Paiement à la commande (validation manuelle). Le paiement par carte
          sera disponible une fois Stripe activé.
        </p>
      }
    />
  );
}

// ---- Stripe card path -----------------------------------------------------

const CARD_OPTIONS = {
  style: {
    base: {
      fontSize: "15px",
      color: "#0f2747",
      "::placeholder": { color: "#94a3b8" },
    },
  },
};

function StripeCheckout() {
  const state = useCheckout();
  const stripe = useStripe();
  const elements = useElements();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!state.cart || !state.optionId || !stripe || !elements) return;
    state.setSubmitting(true);
    state.setError(null);
    try {
      const prepared = await state.prepareCart();

      // Create / initialise the Stripe payment session and grab its
      // PaymentIntent client secret.
      const { payment_collection } =
        await sdk.store.payment.initiatePaymentSession(prepared as any, {
          provider_id: PROVIDER_STRIPE,
        });
      const session = (payment_collection.payment_sessions ?? []).find(
        (s: any) => s.provider_id === PROVIDER_STRIPE
      );
      const clientSecret = (session?.data as any)?.client_secret as
        | string
        | undefined;
      if (!clientSecret) throw new Error("Session de paiement Stripe indisponible");

      // Confirm the card payment client-side, then complete the order.
      const card = elements.getElement(CardElement);
      if (!card) throw new Error("Champ carte introuvable");
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card },
      });
      if (result.error) throw new Error(result.error.message);

      await state.finalizeOrder();
    } catch (err: any) {
      state.setError(err?.message ?? "Erreur lors du paiement");
    } finally {
      state.setSubmitting(false);
    }
  }

  return (
    <CheckoutShell
      state={state}
      onSubmit={onSubmit}
      submitLabel="Payer et commander"
      paymentSection={
        <div className="rounded-xl border border-slate-300 px-4 py-3">
          <CardElement options={CARD_OPTIONS} />
        </div>
      }
    />
  );
}
