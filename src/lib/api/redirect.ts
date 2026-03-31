import type { AlleMeldekortData, MeldekortData } from '../types/meldekort';

/**
 * Sjekker om brukeren kun har én ytelse.
 * Hvis ja, returner redirect-URL. Hvis nei, returner undefined.
 *
 * Spesialhåndtering for Arena:
 * - Hvis bruker BARE har Arena-meldekort (ikke AAP, TTL eller DP),
 *   redirect til felles-meldekort
 *
 * @param data - Alle meldekortdata
 * @returns Redirect-URL hvis kun én ytelse, ellers undefined
 */
export function getRedirectUrlIfSingleYtelse(data: AlleMeldekortData): string | undefined {
  const ytelser = [data.dp, data.aap, data.ttl].filter(
    (ytelse): ytelse is MeldekortData => ytelse !== undefined,
  );

  // Hvis bruker kun har Arena-meldekort (ingen andre ytelser), redirect til felles-meldekort
  if (ytelser.length === 0 && data.arena) {
    return data.arena.redirectUrl;
  }

  // Hvis bruker har nøyaktig én ytelse (ikke Arena), redirect til den
  if (ytelser.length === 1 && ytelser[0]) {
    return ytelser[0].redirectUrl;
  }

  return undefined;
}
