import { requestTokenxOboToken } from '@navikt/oasis';
import type { ArenaMeldekortResponse } from '../../types/meldekort';
import { logger } from '../../utils/logger';
import { shouldUseMockData, fetchWithTimeout, type ApiResult } from '../helpers';

/**
 * Mock data for arena når ingen ytelser har aktive meldekort.
 * Returnerer redirectUrl til felles-meldekort.
 */
const arenaMock: ArenaMeldekortResponse = {
  harInnsendteMeldekort: false,
  meldekortTilUtfylling: [],
  redirectUrl: '/felles-meldekort',
};

/**
 * Validerer at data matcher ArenaMeldekortResponse typen.
 */
function validerArenaData(data: unknown): data is ArenaMeldekortResponse {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const obj = data as Record<string, unknown>;

  return (
    typeof obj.harInnsendteMeldekort === 'boolean' &&
    Array.isArray(obj.meldekortTilUtfylling) &&
    typeof obj.redirectUrl === 'string'
  );
}

/**
 * Henter meldekortdata fra arena (meldekort-api).
 * Kalles kun når ingen ytelser (dp/aap/tp) har aktive meldekort.
 */
export async function hentMeldekortDataFraArena(
  oboToken: string,
): Promise<ApiResult<ArenaMeldekortResponse>> {
  if (shouldUseMockData()) {
    return { success: true, data: arenaMock };
  }

  const apiUrl = import.meta.env.ARENA_API_URL ?? process.env.ARENA_API_URL;
  const audience = import.meta.env.ARENA_API_AUDIENCE ?? process.env.ARENA_API_AUDIENCE;

  if (!apiUrl || !audience) {
    const error = 'Missing Arena API configuration';
    logger.error(
      `${error}: hasArenaApiUrl=${Boolean(apiUrl)}, hasArenaApiAudience=${Boolean(audience)}`,
    );
    return { success: false, error };
  }

  try {
    const tokenResult = await requestTokenxOboToken(oboToken, audience);

    if (!tokenResult.ok) {
      const error = `Arena token exchange failed: ${tokenResult.error.message}`;
      logger.error(error);
      return { success: false, error };
    }

    const response = await fetchWithTimeout(`${apiUrl}/person/meldekortstatus`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${tokenResult.token}`,
      },
    });

    if (!response.ok) {
      const error = `Arena API returned ${response.status}`;
      logger.error(error);
      return { success: false, error };
    }

    const data: unknown = await response.json();

    if (!validerArenaData(data)) {
      const error = 'Arena API returned invalid data structure';
      logger.error(error);
      return { success: false, error };
    }

    logger.info('Arena API returned successfully', {
      hasRedirectUrl: !!data.redirectUrl && data.redirectUrl !== '',
      redirectUrl: data.redirectUrl || 'empty',
    });
    return { success: true, data };
  } catch (error) {
    const errorMsg = `Error fetching Arena data: ${error instanceof Error ? error.message : 'Unknown error'}`;
    logger.error(errorMsg);
    return { success: false, error: errorMsg };
  }
}
