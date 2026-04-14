import { requestTokenxOboToken } from '@navikt/oasis';
import type { MeldekortData } from '../../types/meldekort';
import { tiltakspengerMock } from '../mockData';
import { logger } from '../../utils/logger';
import { shouldUseMockData, validerMeldekortData, fetchWithTimeout } from '../helpers';

/** Henter meldekortdata for tiltakspenger. */
export async function hentMeldekortDataFraTP(oboToken: string): Promise<MeldekortData | undefined> {
  if (shouldUseMockData()) {
    return tiltakspengerMock;
  }

  const apiUrl = import.meta.env.TP_API_URL;
  const audience = import.meta.env.TP_API_AUDIENCE;

  if (!apiUrl || !audience) {
    logger.error(
      `Missing TP API configuration: hasTpApiUrl=${Boolean(apiUrl)}, hasTpApiAudience=${Boolean(audience)}`,
    );
    return undefined;
  }

  try {
    const tokenResult = await requestTokenxOboToken(oboToken, audience);

    if (!tokenResult.ok) {
      logger.error(`TP token exchange failed: ${tokenResult.error.message}`);
      return undefined;
    }

    const response = await fetchWithTimeout(`${apiUrl}/api/meldekort-status`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${tokenResult.token}`,
      },
    });

    if (!response.ok) {
      logger.error(`TP API returned ${response.status}`);
      return undefined;
    }

    const data: unknown = await response.json();

    if (!validerMeldekortData(data)) {
      logger.error('TP API returned invalid data structure');
      return undefined;
    }

    // Returner undefined hvis ingen aktive meldekort
    if (!data.innsendteMeldekort && data.meldekortTilUtfylling.length === 0) {
      return undefined;
    }

    return data;
  } catch (error) {
    logger.error(
      `Error fetching TP data: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
    return undefined;
  }
}
