import type { MeldekortData } from '../types/meldekort';

/**
 * Sjekker om mock data skal brukes basert på ENFORCE_LOGIN env var.
 */
export function shouldUseMockData(): boolean {
  return import.meta.env.ENFORCE_LOGIN === 'false';
}

/**
 * Sjekker om en ytelse har aktive meldekort.
 * En ytelse regnes som aktiv hvis den enten har innsendte meldekort
 * eller har meldekort til utfylling.
 */
export function harAktiveMeldekort(data: MeldekortData | undefined): boolean {
  if (!data) return false;
  return data.innsendteMeldekort || data.meldekortTilUtfylling.length > 0;
}

/**
 * Validerer at data matcher MeldekortData typen.
 */
export function validerMeldekortData(data: unknown): data is MeldekortData {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const obj = data as Record<string, unknown>;

  return (
    typeof obj.innsendteMeldekort === 'boolean' &&
    Array.isArray(obj.meldekortTilUtfylling) &&
    typeof obj.url === 'string'
  );
}

/**
 * Fetch med timeout. Kaster error hvis requesten tar lenger enn timeout.
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = 10000,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  }
}
