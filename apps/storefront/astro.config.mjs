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
