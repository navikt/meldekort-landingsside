import type { AlleMeldekortData, MeldekortData } from '../types/meldekort';

/**
 * Sjekker om brukeren kun har én ytelse.
 * Hvis ja, returner redirect-URL. Hvis nei, returner undefined.
 *
 * @param data - Alle meldekortdata
 * @returns Redirect-URL hvis kun én ytelse, ellers undefined
 */
export function getRedirectUrlIfSingleYtelse(data: AlleMeldekortData): string | undefined {
  const ytelser = [data.dagpenger, data.aap, data.tiltakspenger].filter(
    (ytelse): ytelse is MeldekortData => ytelse !== undefined,
  );

  if (ytelser.length === 1 && ytelser[0]) {
    return ytelser[0].url;
  }

  return undefined;
}
