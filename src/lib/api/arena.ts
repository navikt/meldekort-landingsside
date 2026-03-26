import type { MeldekortData } from '../types/meldekort';
import { exchangeToken } from '../auth/tokenx';

/**
 * Sjekker om bruker har meldekort i Arena
 *
 * Bruker /harDP endepunktet som returnerer:
 * - 200 OK hvis bruker har dagpenger i Arena
 *
 * @param oboToken - Token fra innlogget bruker
 * @returns MeldekortData eller undefined hvis bruker ikke har meldekort i Arena
 */
export async function hentMeldekortDataFraArena(
  oboToken: string,
): Promise<MeldekortData | undefined> {
  const apiUrl = process.env.MELDEKORT_API_URL;
  const audience = process.env.MELDEKORT_API_AUDIENCE;

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
    });

    // 200 betyr at bruker har dagpenger i Arena
    if (response.status === 200) {
      return {
        innsendteMeldekort: true,
        meldekortTilUtfylling: [],
        url: 'https://arbeid.intern.dev.nav.no/felles-meldekort',
      };
    }

    // Andre statuser betyr at bruker ikke har dagpenger i Arena
    return undefined;
  } catch (error) {
    console.error('Error checking Arena meldekort:', error);
    return undefined;
  }
}
