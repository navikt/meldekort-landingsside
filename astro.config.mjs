import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  base: '/meldekort',
  redirects: {
    '/send-meldekort': '/meldekort?cache-buster',
  },
  integrations: [react()],
  output: 'server',
  adapter: node({
    mode: 'standalone',
  }),
  build: {
    inlineStylesheets: 'auto',
  },
  vite: {
    ssr: {
      noExternal: ['@navikt/ds-react', '@navikt/ds-css'],
    },
  },
});
