import { requestTokenxOboToken } from '@navikt/oasis';
import type { MeldekortData } from '../../types/meldekort';
import { dagpengerMock } from '../mockData';
import { logger } from '../../utils/logger';
import {
  shouldUseMockData,
  validerMeldekortData,
  fetchWithTimeout,
  type ApiResult,
} from '../helpers';

/** Henter meldekortdata for dagpenger. */
export async function hentMeldekortDataFraDP(oboToken: string): Promise<ApiResult<MeldekortData>> {
  if (shouldUseMockData()) {
    return { success: true, data: dagpengerMock };
  }

  const apiUrl = import.meta.env.DP_API_URL ?? process.env.DP_API_URL;
  const audience = import.meta.env.DP_API_AUDIENCE ?? process.env.DP_API_AUDIENCE;

  if (!apiUrl || !audience) {
    const error = 'Missing DP API configuration';
    logger.error(`${error}: hasDpApiUrl=${Boolean(apiUrl)}, hasDpApiAudience=${Boolean(audience)}`);
    return { success: false, error };
  }

  try {
    const tokenResult = await requestTokenxOboToken(oboToken, audience);

    if (!tokenResult.ok) {
      const error = `DP token exchange failed: ${tokenResult.error.message}`;
      logger.error(error);
      return { success: false, error };
    }

    const response = await fetchWithTimeout(`${apiUrl}/meldekortstatus`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${tokenResult.token}`,
      },
    });

    if (!response.ok) {
      // 404 betyr at bruker ikke finnes i DP - behandle som "ingen data"
      if (response.status === 404) {
        logger.info('DP API returned 404 - user not found, treating as no data');
        return { success: true };
      }
      const error = `DP API returned ${response.status}`;
      logger.error(error);
      return { success: false, error };
    }

    const data: unknown = await response.json();

    if (!validerMeldekortData(data)) {
      const error = 'DP API returned invalid data structure';
      logger.error(error, {
        receivedData: data,
        expectedFields: {
          harInnsendteMeldekort: 'boolean',
          meldekortTilUtfylling: 'array',
          redirectUrl: 'string',
        },
      });
      return { success: false, error };
    }

    // Success - returner data selv om ingen aktive meldekort
    // (tomt data er ikke en feil, bare at brukeren ikke har aktive meldekort)
    if (!data.harInnsendteMeldekort && data.meldekortTilUtfylling.length === 0) {
      logger.info('DP API returned successfully - no active meldekort');
      return { success: true };
    }

    logger.info('DP API returned successfully with meldekort data', {
      harInnsendteMeldekort: data.harInnsendteMeldekort,
      antallTilUtfylling: data.meldekortTilUtfylling.length,
    });
    return { success: true, data };
  } catch (error) {
    const errorMsg = `Error fetching DP data: ${error instanceof Error ? error.message : 'Unknown error'}`;
    logger.error(errorMsg);
    return { success: false, error: errorMsg };
  }
}
