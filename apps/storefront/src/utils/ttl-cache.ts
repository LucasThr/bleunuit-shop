// Mémoïse une fonction async sans argument pendant `ttlMs`. Déduplique aussi
// les appels concurrents (un seul fetch en vol). Utilisé pour les listes
// catalogue : le processus SSR est long-vivant, un TTL court borne la
// staleness après une édition dans l'admin Medusa.
export function memoizeTtl<T>(fn: () => Promise<T>, ttlMs: number): () => Promise<T> {
  let value: Promise<T> | null = null;
  let expiresAt = 0;
  return () => {
    const now = Date.now();
    if (!value || now >= expiresAt) {
      expiresAt = now + ttlMs;
      value = fn().catch((err) => {
        value = null; // ne jamais mettre en cache un échec
        throw err;
      });
    }
    return value;
  };
}
