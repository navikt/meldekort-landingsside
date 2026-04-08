import { requestTokenxOboToken } from '@navikt/oasis';
import { shouldUseMockData, fetchWithTimeout } from '../helpers';
import { logger } from '../../logger';

/** Sjekker om bruker har DP-meldekort i Arena. */
export async function hentHarDP(oboToken: string): Promise<boolean> {
  if (shouldUseMockData()) {
    logger.info('[harDP] Using mock data: false');
    return false;
  }

  const apiUrl = process.env.MELDEKORT_API_URL;
  const audience = process.env.MELDEKORT_API_AUDIENCE;

  if (!apiUrl || !audience) {
    logger.error('Missing MELDEKORT_API_URL or MELDEKORT_API_AUDIENCE');
    return false;
  }

  try {
    if (import.meta.env.DEV) {
      logger.warn('Dev mode: using provided oboToken for harDP token exchange');
    }

    const tokenResult = await requestTokenxOboToken(oboToken, audience);

    if (!tokenResult.ok) {
      logger.error('Token exchange failed:', tokenResult.error.message);
      return false;
    }

    const response = await fetchWithTimeout(`${apiUrl}/harDP`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${tokenResult.token}`,
      },
    });

    if (!response.ok) {
      logger.error(`harDP API returned ${response.status}`);
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Error checking harDP:', error);
    return false;
  }
}
