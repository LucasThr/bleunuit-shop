// Cache-Control des pages SSR publiques. `s-maxage` cible le CDN/proxy devant
// le conteneur Node ; les navigateurs restent à 0 (le HTML change avec le
// catalogue). stale-while-revalidate évite les misses bloquants.
const PAGE_CACHE_CONTROL = 'public, max-age=0, s-maxage=300, stale-while-revalidate=3600';

// Accepts Astro.response (a ResponseInit with a mutable Headers) as well as a
// real Response — both expose a `headers: Headers`.
export function setPageCacheHeader(response: { headers: Headers }): void {
  response.headers.set('Cache-Control', PAGE_CACHE_CONTROL);
}
