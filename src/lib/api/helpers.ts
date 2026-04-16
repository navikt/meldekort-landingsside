import type { MeldekortData, AlleMeldekortData } from '../types/meldekort';
import { logger } from '../utils/logger';

/**
 * Resultat fra API-kall som kan enten lykkes eller feile.
 */
export interface ApiResult<T> {
  success: boolean;
  data?: T | undefined;
  error?: string;
}

interface YtelseData {
  dagpenger?: MeldekortData | undefined;
  aap?: MeldekortData | undefined;
  tiltakspenger?: MeldekortData | undefined;
  redirectUrl?: string;
}

/**
 * Sjekker om mock data skal brukes basert på ENFORCE_LOGIN env var.
 * Bruker import.meta.env i dev (Vite leser .env) og process.env i prod (NAIS).
 */
export function shouldUseMockData(): boolean {
  const enforceLogin = import.meta.env.ENFORCE_LOGIN ?? process.env.ENFORCE_LOGIN;
  return enforceLogin === 'false';
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

/**
 * Håndterer redirect/response logikk basert på antall aktive ytelser.
 * - Hvis 0 ytelser har aktive meldekort OG redirectUrl er satt → HTTP 307 redirect til redirectUrl
 * - Hvis kun 1 ytelse har aktive meldekort → HTTP 307 redirect til den ytelsens URL
 * - Ellers → returner JSON med meldekortdata for alle ytelser
 */
export function handleMeldekortResponse(ytelseData: YtelseData): Response {
  const { dagpenger, aap, tiltakspenger, redirectUrl } = ytelseData;

  // Tell antall ytelser med aktive meldekort
  const ytelserMedAktiveMeldekort = [
    {
      name: 'dagpenger',
      data: dagpenger,
      active: harAktiveMeldekort(dagpenger),
    },
    { name: 'aap', data: aap, active: harAktiveMeldekort(aap) },
    {
      name: 'tiltakspenger',
      data: tiltakspenger,
      active: harAktiveMeldekort(tiltakspenger),
    },
  ].filter((ytelse) => ytelse.active);

  // Hvis 0 ytelser har aktive meldekort OG redirectUrl finnes, redirect til den (arena/felles-meldekort)
  if (ytelserMedAktiveMeldekort.length === 0 && redirectUrl) {
    // Valider at redirectUrl er en sikker intern path
    // Må være relativ path som starter med / men ikke //
    // Avviser også backslash og whitespace for å forhindre open redirect
    if (
      !redirectUrl.startsWith('/') ||
      redirectUrl.startsWith('//') ||
      redirectUrl.includes('\\') ||
      /\s/.test(redirectUrl)
    ) {
      logger.error('Invalid redirect URL from arena - must be safe internal path', {
        redirectUrl,
      });
      throw new Error(`Redirect URL must be safe internal path (e.g. /path), got: ${redirectUrl}`);
    }

    // Returner 307 redirect med Location header
    return new Response(null, {
      status: 307,
      headers: {
        Location: redirectUrl,
      },
    });
  }

  // Hvis kun 1 ytelse har aktive meldekort, gjør HTTP redirect
  if (ytelserMedAktiveMeldekort.length === 1) {
    const ytelse = ytelserMedAktiveMeldekort[0];
    if (ytelse?.data) {
      const ytelseRedirectUrl = ytelse.data.url;
      // Response.redirect krever absolutt URL
      if (!ytelseRedirectUrl.startsWith('http://') && !ytelseRedirectUrl.startsWith('https://')) {
        logger.error('Invalid redirect URL in handleMeldekortResponse', {
          redirectUrl: ytelseRedirectUrl,
          ytelse: ytelse.name,
        });
        throw new Error(`Redirect URL must be absolute, got: ${ytelseRedirectUrl}`);
      }
      return Response.redirect(ytelseRedirectUrl, 307);
    }
  }

  // Ellers, returner JSON med meldekortdata:
  // - Når ingen ytelser har aktive meldekort og redirectUrl mangler (viser tom landingsside)
  // - Når flere ytelser har aktive meldekort (viser landingsside med kort)
  // redirectUrl inkluderes ikke her fordi den kun brukes for redirect når ingen ytelser er aktive og redirectUrl finnes
  const alleMeldekort: AlleMeldekortData = {
    ...(dagpenger && { dagpenger }),
    ...(aap && { aap }),
    ...(tiltakspenger && { tiltakspenger }),
  };

  return new Response(JSON.stringify(alleMeldekort), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
