import type { APIRoute } from 'astro';
import { getResend, mailConfig, jsonResponse, readBody, isValidEmail } from '../../utils/forms';

export const POST: APIRoute = async ({ request }) => {
  let data: Record<string, string>;
  try {
    data = await readBody(request);
  } catch {
    return jsonResponse({ error: 'Requête invalide.' }, 400);
  }

  // Honeypot: real users never fill this hidden field. Silently accept so bots
  // get no signal.
  if (data.company) return jsonResponse({ ok: true }, 200);

  const firstName = (data.firstName ?? '').trim();
  const lastName = (data.lastName ?? '').trim();
  const email = (data.email ?? '').trim();
  const subject = (data.subject ?? '').trim();
  const message = (data.message ?? '').trim();
  const phone = (data.phone ?? '').trim();
  const store = (data.store ?? '').trim();

  if (!firstName || !lastName || !email || !subject || !message) {
    return jsonResponse({ error: 'Merci de remplir tous les champs obligatoires.' }, 400);
  }
  if (!isValidEmail(email)) {
    return jsonResponse({ error: 'Adresse email invalide.' }, 400);
  }

  const resend = getResend();
  if (!resend) {
    console.error('Contact: RESEND_API_KEY is not set');
    return jsonResponse({ error: 'Le formulaire est momentanément indisponible.' }, 503);
  }

  try {
    const { error } = await resend.emails.send({
      from: mailConfig.from,
      to: mailConfig.to,
      replyTo: email,
      subject: `Contact site — ${subject}`,
      text: [
        `Nom : ${firstName} ${lastName}`,
        `Email : ${email}`,
        phone && `Téléphone : ${phone}`,
        store && `Magasin concerné : ${store}`,
        '',
        message,
      ]
        .filter(Boolean)
        .join('\n'),
    });
    if (error) {
      console.error('Contact: Resend error', error);
      return jsonResponse({ error: "L'envoi a échoué. Réessayez plus tard." }, 502);
    }
  } catch (err) {
    console.error('Contact: send threw', err);
    return jsonResponse({ error: "L'envoi a échoué. Réessayez plus tard." }, 502);
  }

  return jsonResponse({ ok: true }, 200);
};
