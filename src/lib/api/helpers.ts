import { requestTokenxOboToken } from '@navikt/oasis';
import type { MeldekortData, ArenaMeldekortData } from '../types/meldekort';
import { dpMock, ttlMock, aapMock, arenaMock } from './mockData';
import { logger } from '../logger';

/** Fetch med 10s timeout. */
export async function fetchWithTimeout(
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

export function shouldUseMockData(): boolean {
  const enforceLogin = import.meta.env.ENFORCE_LOGIN ?? process.env.ENFORCE_LOGIN;
  return enforceLogin === 'false';
}

function getMockDataForService(serviceName: string): MeldekortData | ArenaMeldekortData | null {
  switch (serviceName.toLowerCase()) {
    case 'dp':
      return dpMock;
    case 'ttl':
    case 'tiltakspenger':
      return ttlMock;
    case 'aap':
      return aapMock;
    case 'arena':
      return arenaMock;
    default:
      logger.warn(`No mock data for service: ${serviceName}`);
      return null;
  }
}

type ApiResult<T> = { success: true; data: T | null } | { success: false; error: string };

function validerMeldekortData(data: unknown): data is MeldekortData {
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

function validerArenaMeldekortData(data: unknown): data is ArenaMeldekortData {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const obj = data as Record<string, unknown>;

  return (
    typeof obj.harInnsendteMeldekort === 'boolean' &&
    Array.isArray(obj.meldekortTilUtfylling) &&
    typeof obj.redirectUrl === 'string' &&
    typeof obj.meldegruppe === 'string'
  );
}

function erTomMeldekortData(data: MeldekortData): boolean {
  return !data.harInnsendteMeldekort && data.meldekortTilUtfylling.length === 0;
}

/**
 * Lavnivå funksjon som gjør API-kall med TokenX OBO exchange.
 * Returnerer strukturert result med success/error.
 * Bruk hentMeldekortData() for standard bruk.
 */
export async function fetchMeldekortFromApi<T extends MeldekortData>(
  oboToken: string,
  config: {
    apiUrl: string | undefined;
    audience: string | undefined;
    path: string;
    serviceName: string;
    validator: (data: unknown) => data is T;
  },
): Promise<ApiResult<T>> {
  const { apiUrl, audience, path, serviceName, validator } = config;

  if (!apiUrl || !audience) {
    const error = `Missing ${serviceName} API configuration`;
    logger.error(error);
    return { success: false, error };
  }

  try {
    if (import.meta.env.DEV) {
      logger.warn(`Dev mode: using provided oboToken for ${serviceName} token exchange`);
    }

    const tokenResult = await requestTokenxOboToken(oboToken, audience);

    if (!tokenResult.ok) {
      const error = `Token exchange failed: ${tokenResult.error.message}`;
      logger.error(error);
      return { success: false, error };
    }

    const response = await fetchWithTimeout(`${apiUrl}${path}`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${tokenResult.token}`,
      },
    });

    if (!response.ok) {
      const error = `${serviceName} API returned ${response.status}`;
      logger.error(error);
      return { success: false, error };
    }

    const data: unknown = await response.json();

    if (!validator(data)) {
      const error = `${serviceName} API returned invalid data structure`;
      logger.error(error);
      return { success: false, error };
    }

    if (erTomMeldekortData(data)) {
      return { success: true, data: null };
    }

    return { success: true, data };
  } catch (error) {
    const errorMessage = `Error checking ${serviceName} status: ${error instanceof Error ? error.message : 'Unknown error'}`;
    logger.error(errorMessage);
    return { success: false, error: errorMessage };
  }
}

export async function hentMeldekortData<T extends MeldekortData>(
  oboToken: string,
  config: {
    apiUrl: string | undefined;
    audience: string | undefined;
    path: string;
    serviceName: string;
    validator: (data: unknown) => data is T;
  },
): Promise<T | undefined> {
  if (shouldUseMockData()) {
    logger.info(`[${config.serviceName}] Using mock data (ENFORCE_LOGIN=false)`);
    const mockData = getMockDataForService(config.serviceName);
    return mockData as T | undefined;
  }

  const result = await fetchMeldekortFromApi(oboToken, config);

  if (!result.success) {
    logger.error(`[${config.serviceName}] Failed to fetch meldekort data: ${result.error}`);
    return undefined;
  }

  if (result.data === null) {
    logger.info(`[${config.serviceName}] No meldekort data (user has no active meldekort)`);
    return undefined;
  }

  logger.info(`[${config.serviceName}] Successfully fetched meldekort data`);
  return result.data;
}

export { validerMeldekortData, validerArenaMeldekortData };
