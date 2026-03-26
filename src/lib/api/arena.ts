import type { MeldekortData } from '../types/meldekort';
import { exchangeToken } from '../auth/tokenx';

/**
 * Sjekker om bruker har meldekort i Arena
 *
 * Bruker /harDP endepunktet som returnerer:
 * - 307 TEMPORARY_REDIRECT hvis bruker har dagpenger
 * - 200 OK hvis bruker ikke har dagpenger
 *
 * @param oboToken - Token fra innlogget bruker
 * @returns MeldekortData eller undefined hvis bruker ikke har meldekort i Arena
 */
export async function hentMeldekortDataFraArena(
  oboToken: string,
): Promise<MeldekortData | undefined> {
  const apiUrl = import.meta.env.MELDEKORT_API_URL;
  const audience = import.meta.env.MELDEKORT_API_AUDIENCE;

  if (!apiUrl || !audience) {
    console.warn('Missing MELDEKORT_API_URL or MELDEKORT_API_AUDIENCE');
    return undefined;
  }

  try {
    // Bytt token
    const accessToken = await exchangeToken(oboToken, audience);

    // Sjekk om bruker har dagpenger i Arena
    const response = await fetch(`${apiUrl}/harDP`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      redirect: 'manual', // Ikke følg redirect automatisk
    });

    // 307 betyr at bruker har dagpenger i Arena
    if (response.status === 307) {
      return {
        innsendteMeldekort: true,
        meldekortTilUtfylling: [],
        url: 'https://arbeid.intern.dev.nav.no/felles-meldekort',
      };
    }

    // 200 eller andre statuser betyr at bruker ikke har dagpenger
    return undefined;
  } catch (error) {
    console.error('Error checking Arena meldekort:', error);
    return undefined;
  }
}
