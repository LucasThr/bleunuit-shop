// Shared helpers for the public contact + newsletter forms, which post to the
// /api/* routes and send mail through Resend.
import { Resend } from 'resend';

// Read at module load. `process.env` is the source of truth on the Node
// standalone server (secrets injected at deploy time); `import.meta.env` is the
// fallback so values from .env work under `astro dev`. Never prefix these
// PUBLIC_ — they must stay server-side.
const env = import.meta.env as unknown as Record<string, string | undefined>;
const RESEND_API_KEY = process.env.RESEND_API_KEY ?? env.RESEND_API_KEY;

export const mailConfig = {
  to: process.env.CONTACT_TO_EMAIL ?? env.CONTACT_TO_EMAIL ?? 'contact@bleunuit.fr',
  from:
    process.env.CONTACT_FROM_EMAIL ??
    env.CONTACT_FROM_EMAIL ??
    'Literie Bleunuit <noreply@bleunuit.fr>',
  audienceId: process.env.RESEND_AUDIENCE_ID ?? env.RESEND_AUDIENCE_ID ?? null,
};

// Null when no API key is configured, so routes can fail cleanly with a 503
// instead of throwing.
export function getResend(): Resend | null {
  return RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;
}

export function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Accepts both fetch JSON bodies and native (form-encoded) submissions.
export async function readBody(request: Request): Promise<Record<string, string>> {
  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return (await request.json()) as Record<string, string>;
  }
  const form = await request.formData();
  return Object.fromEntries([...form.entries()].map(([key, value]) => [key, String(value)]));
}

export function isValidEmail(email: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}
