// @ts-check
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';

import tailwindcss from '@tailwindcss/vite';

import react from '@astrojs/react';

import node from '@astrojs/node';

const { PUBLIC_SITE_URL } = loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), '');

// https://astro.build/config
export default defineConfig({
  // Canonical URLs, sitemap.xml and robots.txt are built from this value:
  // set PUBLIC_SITE_URL to the production domain when deploying.
  site: PUBLIC_SITE_URL || 'https://www.bleunuit.fr',
  // Permanent redirects from the old Simplébo site, so inbound links and
  // indexed URLs keep their destination after the domain switches over.
  // Paths whose content has no equivalent yet are deliberately left to 404
  // rather than pointed at an unrelated page.
  redirects: {
    // Ranges and brands: no per-brand page yet, the mattress category is the
    // closest match. Revisit when brand pages exist.
    '/produits-simmons': '/produits/matelas',
    '/produits-primo': '/produits/matelas',
    '/produits-hybrid': '/produits/matelas',
    '/produits-rendez-vous': '/produits/matelas',
    '/produits-club-line': '/produits/matelas',
    '/produits-renaissance': '/produits/matelas',
    '/produits-aerial': '/produits/matelas',
    '/produits-beauty-sensory': '/produits/matelas',
    '/produits-mille-une-nuit': '/produits/matelas',
    '/produits-petit-prix': '/produits/matelas',
    // Direct equivalents in the new catalog.
    '/produits-latex': '/produits/matelas/matelas-latex',
    '/cadres-lattes': '/produits/sommiers/sommiers-a-lattes',
    '/cadres-lattes6': '/produits/sommiers/sommiers-a-lattes',
    '/tapissiers': '/produits/sommiers/sommiers-tapissiers',
    '/sommier-a-bruay-la-buissiere-62700': '/produits/sommiers',
    '/tissus': '/produits/tetes-de-lit',
    '/bois': '/produits/tetes-de-lit',
    '/oreillers-synthetiques': '/produits/oreillers-couettes',
    '/oreillers-naturels': '/produits/oreillers-couettes',
    '/couettes-synthetiques': '/produits/oreillers-couettes',
    '/couettes-naturelles': '/produits/oreillers-couettes',
  },
  output: 'server',
    adapter: node({
    mode: 'standalone'
  }),
  vite: {
    plugins: [tailwindcss()],
    // @medusajs/js-sdk ships an ESM build with extensionless imports that
    // Node's native resolver rejects during SSR. Bundling it through Vite
    // resolves those imports correctly.
    ssr: {
      noExternal: ['@medusajs/js-sdk']
    }
  },

  integrations: [react()]
});
