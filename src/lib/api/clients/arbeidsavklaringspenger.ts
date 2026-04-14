import { requestTokenxOboToken } from '@navikt/oasis';
import type { MeldekortData } from '../../types/meldekort';
import { aapMock } from '../mockData';
import { logger } from '../../utils/logger';
import { shouldUseMockData, validerMeldekortData, fetchWithTimeout } from '../helpers';

/** Henter meldekortdata for arbeidsavklaringspenger. */
export async function hentMeldekortDataFraAAP(
  oboToken: string,
): Promise<MeldekortData | undefined> {
  if (shouldUseMockData()) {
    return aapMock;
  }

  const apiUrl = import.meta.env.AAP_API_URL;
  const audience = import.meta.env.AAP_API_AUDIENCE;

  if (!apiUrl || !audience) {
    logger.error(
      `Missing AAP API configuration: hasAapApiUrl=${Boolean(apiUrl)}, hasAapApiAudience=${Boolean(audience)}`,
    );
    return undefined;
  }

  try {
    const tokenResult = await requestTokenxOboToken(oboToken, audience);

    if (!tokenResult.ok) {
      logger.error(`AAP token exchange failed: ${tokenResult.error.message}`);
      return undefined;
    }

    const response = await fetchWithTimeout(`${apiUrl}/api/meldekort-status`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${tokenResult.token}`,
      },
    });

    if (!response.ok) {
      logger.error(`AAP API returned ${response.status}`);
      return undefined;
    }

    const data: unknown = await response.json();

    if (!validerMeldekortData(data)) {
      logger.error('AAP API returned invalid data structure');
      return undefined;
    }

    // Returner undefined hvis ingen aktive meldekort
    if (!data.innsendteMeldekort && data.meldekortTilUtfylling.length === 0) {
      return undefined;
    }

    return data;
  } catch (error) {
    logger.error(
      `Error fetching AAP data: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
    return undefined;
  }
}
