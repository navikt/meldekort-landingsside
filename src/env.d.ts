/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

// Environment variabler for dev mode (Vite leser .env og gjør dem tilgjengelige via import.meta.env)
// I prod (NAIS) brukes process.env direkte
interface ImportMetaEnv {
  readonly ENFORCE_LOGIN?: string;
  readonly PUBLIC_FARO_URL?: string;
  readonly PUBLIC_GITHUB_SHA?: string;
  readonly AAP_API_URL?: string;
  readonly AAP_API_AUDIENCE?: string;
  readonly TP_API_URL?: string;
  readonly TP_API_AUDIENCE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
