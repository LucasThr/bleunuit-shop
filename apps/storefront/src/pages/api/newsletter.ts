import type { APIRoute } from 'astro';
import { getResend, mailConfig, jsonResponse, readBody, isValidEmail } from '../../utils/forms';

export const POST: APIRoute = async ({ request }) => {
  let data: Record<string, string>;
  try {
    data = await readBody(request);
  } catch {
    return jsonResponse({ error: 'Requête invalide.' }, 400);
  }

  // Honeypot — see contact.ts.
  if (data.company) return jsonResponse({ ok: true }, 200);

  const email = (data.email ?? '').trim();
  if (!isValidEmail(email)) {
    return jsonResponse({ error: 'Adresse email invalide.' }, 400);
  }

  const resend = getResend();
  if (!resend) {
    console.error('Newsletter: RESEND_API_KEY is not set');
    return jsonResponse({ error: 'Inscription momentanément indisponible.' }, 503);
  }

  try {
    if (mailConfig.audienceId) {
      // Preferred path: add the subscriber to a Resend audience.
      const { error } = await resend.contacts.create({
        email,
        audienceId: mailConfig.audienceId,
        unsubscribed: false,
      });
      if (error) {
        console.error('Newsletter: Resend contacts error', error);
        return jsonResponse({ error: "L'inscription a échoué. Réessayez plus tard." }, 502);
      }
    } else {
      // No audience configured: email the shop so no signup is lost.
      const { error } = await resend.emails.send({
        from: mailConfig.from,
        to: mailConfig.to,
        replyTo: email,
        subject: 'Nouvelle inscription newsletter',
        text: `Nouvelle inscription à la newsletter : ${email}`,
      });
      if (error) {
        console.error('Newsletter: Resend email error', error);
        return jsonResponse({ error: "L'inscription a échoué. Réessayez plus tard." }, 502);
      }
    }
  } catch (err) {
    console.error('Newsletter: send threw', err);
    return jsonResponse({ error: "L'inscription a échoué. Réessayez plus tard." }, 502);
  }

  return jsonResponse({ ok: true }, 200);
};
