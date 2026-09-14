import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site, url }) => {
  const canonicalOrigin = site ?? new URL(url.origin);
  // A non-canonical host (the Railway preview URL) serves `noindex` pages: keep
  // them crawlable so the directive is read, but don't advertise a sitemap that
  // points at the production domain.
  const body =
    url.host === canonicalOrigin.host
      ? `User-agent: *\nAllow: /\n\nSitemap: ${new URL('/sitemap.xml', canonicalOrigin).href}\n`
      : 'User-agent: *\nAllow: /\n';

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
