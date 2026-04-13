import { requestTokenxOboToken } from '@navikt/oasis';
import type { MeldekortData } from '../../types/meldekort';
import { tiltakspengerMock } from '../mockData';
import { logger } from '../../utils/logger';

function shouldUseMockData(): boolean {
  return process.env.ENFORCE_LOGIN === 'false';
}

function validerMeldekortData(data: unknown): data is MeldekortData {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const obj = data as Record<string, unknown>;

  return (
    typeof obj.innsendteMeldekort === 'boolean' &&
    Array.isArray(obj.meldekortTilUtfylling) &&
    typeof obj.url === 'string'
  );
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = 10000,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  }
}

/** Henter meldekortdata for tiltakspenger. */
export async function hentMeldekortDataFraTP(oboToken: string): Promise<MeldekortData | undefined> {
  if (shouldUseMockData()) {
    return tiltakspengerMock;
  }

  const apiUrl = process.env.TP_API_URL;
  const audience = process.env.TP_API_AUDIENCE;

  if (!apiUrl || !audience) {
    logger.error('Missing TP API configuration');
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
