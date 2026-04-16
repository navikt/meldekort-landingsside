import { requestTokenxOboToken } from '@navikt/oasis';
import type { MeldekortData } from '../../types/meldekort';
import { tiltakspengerMock } from '../mockData';
import { logger } from '../../utils/logger';
import {
  shouldUseMockData,
  validerMeldekortData,
  fetchWithTimeout,
  type ApiResult,
} from '../helpers';

/** Henter meldekortdata for tiltakspenger. */
export async function hentMeldekortDataFraTP(oboToken: string): Promise<ApiResult<MeldekortData>> {
  if (shouldUseMockData()) {
    return { success: true, data: tiltakspengerMock };
  }

  const apiUrl = import.meta.env.TP_API_URL ?? process.env.TP_API_URL;
  const audience = import.meta.env.TP_API_AUDIENCE ?? process.env.TP_API_AUDIENCE;

  if (!apiUrl || !audience) {
    const error = 'Missing TP API configuration';
    logger.error(`${error}: hasTpApiUrl=${Boolean(apiUrl)}, hasTpApiAudience=${Boolean(audience)}`);
    return { success: false, error };
  }

  try {
    const tokenResult = await requestTokenxOboToken(oboToken, audience);

    if (!tokenResult.ok) {
      const error = `TP token exchange failed: ${tokenResult.error.message}`;
      logger.error(error);
      return { success: false, error };
    }

    const response = await fetchWithTimeout(`${apiUrl}/landingsside/status`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${tokenResult.token}`,
      },
    });

    if (!response.ok) {
      const error = `TP API returned ${response.status}`;
      logger.error(error);
      return { success: false, error };
    }

    const data: unknown = await response.json();

    if (!validerMeldekortData(data)) {
      const error = 'TP API returned invalid data structure';
      logger.error(error, {
        receivedData: data,
        expectedFields: {
          innsendteMeldekort: 'boolean',
          meldekortTilUtfylling: 'array',
          url: 'string',
        },
      });
      return { success: false, error };
    }

    // Success - returner data selv om ingen aktive meldekort
    // (tomt data er ikke en feil, bare at brukeren ikke har aktive meldekort)
    if (!data.innsendteMeldekort && data.meldekortTilUtfylling.length === 0) {
      return { success: true };
    }

    return { success: true, data };
  } catch (error) {
    const errorMsg = `Error fetching TP data: ${error instanceof Error ? error.message : 'Unknown error'}`;
    logger.error(errorMsg);
    return { success: false, error: errorMsg };
  }
}
