import type { AlleMeldekortData, MeldekortData } from '../types/meldekort';

const DP_REDIRECT_URL = 'https://arbeid.intern.dev.nav.no/arbeid/dagpenger/meldekort';

/**
 * Sjekker om brukeren kun har én ytelse.
 * Hvis ja, returner redirect-URL. Hvis nei, returner undefined.
 *
 * Spesialhåndtering for Arena:
 * - Hvis bruker har Arena-meldekort med meldegruppe DAGP/ARBS (men ikke migrert til ny DP-løsning),
 *   redirect til dp-rapportering-frontend
 * - Hvis bruker BARE har Arena-meldekort (ingen andre ytelser og ikke DAGP/ARBS),
 *   redirect til felles-meldekort
 *
 * @param data - Alle meldekortdata
 * @returns Redirect-URL hvis kun én ytelse, ellers undefined
 */
export function getRedirectUrlIfSingleYtelse(data: AlleMeldekortData): string | undefined {
  const ytelser = [data.dp, data.aap, data.ttl].filter(
    (ytelse): ytelse is MeldekortData => ytelse !== undefined,
  );

  // Hvis DP finnes, bruk DP sin URL
  if (data.dp) {
    return data.dp.redirectUrl;
  }

  // Hvis DP ikke finnes, men Arena har meldegruppe DAGP eller ARBS, behandle som DP
  if (!data.dp && data.arena) {
    const meldegruppe = data.arena.meldegruppe.toUpperCase();
    if (meldegruppe === 'DAGP' || meldegruppe === 'ARBS') {
      return DP_REDIRECT_URL;
    }
  }

  // Hvis bruker kun har Arena-meldekort (ingen andre ytelser), redirect til felles-meldekort
  if (ytelser.length === 0 && data.arena) {
    return data.arena.redirectUrl;
  }

  // Hvis bruker har nøyaktig én ytelse (ikke Arena eller DP), redirect til den
  if (ytelser.length === 1 && ytelser[0]) {
    return ytelser[0].redirectUrl;
  }

  return undefined;
}
