import { requestTokenxOboToken } from '@navikt/oasis';
import type { MeldekortData } from '../../types/meldekort';
import { aapMock } from '../mockData';
import { logger } from '../../utils/logger';
import {
  shouldUseMockData,
  validerMeldekortData,
  fetchWithTimeout,
  type ApiResult,
} from '../helpers';

/** Henter meldekortdata for arbeidsavklaringspenger. */
export async function hentMeldekortDataFraAAP(oboToken: string): Promise<ApiResult<MeldekortData>> {
  if (shouldUseMockData()) {
    return { success: true, data: aapMock };
  }

  const apiUrl = import.meta.env.AAP_API_URL;
  const audience = import.meta.env.AAP_API_AUDIENCE;

  if (!apiUrl || !audience) {
    const error = 'Missing AAP API configuration';
    logger.error(
      `${error}: hasAapApiUrl=${Boolean(apiUrl)}, hasAapApiAudience=${Boolean(audience)}`,
    );
    return { success: false, error };
  }

  try {
    const tokenResult = await requestTokenxOboToken(oboToken, audience);

    if (!tokenResult.ok) {
      const error = `AAP token exchange failed: ${tokenResult.error.message}`;
      logger.error(error);
      return { success: false, error };
    }

    const response = await fetchWithTimeout(`${apiUrl}/api/meldekort-status`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${tokenResult.token}`,
      },
    });

    if (!response.ok) {
      const error = `AAP API returned ${response.status}`;
      logger.error(error);
      return { success: false, error };
    }

    const data: unknown = await response.json();

    if (!validerMeldekortData(data)) {
      const error = 'AAP API returned invalid data structure';
      logger.error(error);
      return { success: false, error };
    }

    // Success - returner data selv om ingen aktive meldekort
    // (tomt data er ikke en feil, bare at brukeren ikke har aktive meldekort)
    if (!data.innsendteMeldekort && data.meldekortTilUtfylling.length === 0) {
      return { success: true };
    }

    return { success: true, data };
  } catch (error) {
    const errorMsg = `Error fetching AAP data: ${error instanceof Error ? error.message : 'Unknown error'}`;
    logger.error(errorMsg);
    return { success: false, error: errorMsg };
  }
}
