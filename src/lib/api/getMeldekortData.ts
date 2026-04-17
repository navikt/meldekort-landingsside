import { hentMeldekortDataFraDP } from './clients/dagpenger';
import { hentMeldekortDataFraAAP } from './clients/arbeidsavklaringspenger';
import { hentMeldekortDataFraTP } from './clients/tiltakspenger';
import { hentMeldekortDataFraArena } from './clients/arena';
import { shouldUseMockData, harAktiveMeldekort, isValidRedirectUrl } from './helpers';
import { getScenario } from './scenarios';
import { logger } from '../utils/logger';
import type { AlleMeldekortData } from '../types/meldekort';

export interface MeldekortDataResult {
  success: true;
  data: AlleMeldekortData;
  redirectUrl?: string;
}

export interface MeldekortDataError {
  success: false;
  status: number;
  error: string;
  details?: Record<string, unknown>;
}

export type MeldekortDataResponse = MeldekortDataResult | MeldekortDataError;

/**
 * Henter meldekortdata fra alle ytelser (dagpenger, AAP, tiltakspenger, arena).
 * Kan brukes både fra API-endepunkt og direkte fra Astro-sider.
 */
export async function getMeldekortData(
  token: string | null,
  scenario?: string | null,
): Promise<MeldekortDataResponse> {
  const useMock = shouldUseMockData();

  // Hvis mock mode OG scenario er satt, bruk scenario data direkte
  if (useMock && scenario) {
    const scenarioData = getScenario(scenario);
    return {
      success: true,
      data: {
        ...(scenarioData.dagpenger && { dagpenger: scenarioData.dagpenger }),
        ...(scenarioData.aap && { aap: scenarioData.aap }),
        ...(scenarioData.tiltakspenger && { tiltakspenger: scenarioData.tiltakspenger }),
      },
      ...(scenarioData.redirectUrl && { redirectUrl: scenarioData.redirectUrl }),
    };
  }

  // Normal flow
  const actualToken = useMock ? 'mock-token' : token;

  if (!actualToken) {
    logger.error('No token provided to getMeldekortData', {
      useMock,
      enforceLogin: import.meta.env.ENFORCE_LOGIN ?? process.env.ENFORCE_LOGIN,
    });
    return {
      success: false,
      status: 401,
      error: 'Unauthorized',
    };
  }

  // Hent data fra alle ytelser parallelt
  const [dpResult, aapResult, tpResult] = await Promise.all([
    hentMeldekortDataFraDP(actualToken),
    hentMeldekortDataFraAAP(actualToken),
    hentMeldekortDataFraTP(actualToken),
  ]);

  // Sjekk om noen API-kall feilet
  const apiKallFeilet = !dpResult.success || !aapResult.success || !tpResult.success;

  if (apiKallFeilet) {
    // Logger detaljert informasjon om hvilke tjenester som feiler
    const failedServices = [];
    if (!dpResult.success) failedServices.push('dagpenger');
    if (!aapResult.success) failedServices.push('aap');
    if (!tpResult.success) failedServices.push('tiltakspenger');

    logger.error('Ett eller flere API-kall til meldekort-tjenester feilet', {
      failedServices,
      errors: {
        dagpenger: dpResult.success ? null : dpResult.error,
        aap: aapResult.success ? null : aapResult.error,
        tiltakspenger: tpResult.success ? null : tpResult.error,
      },
    });

    return {
      success: false,
      status: 503,
      error: 'Failed to fetch data from one or more services',
      details: {
        dagpenger: dpResult.success ? 'ok' : dpResult.error,
        aap: aapResult.success ? 'ok' : aapResult.error,
        tiltakspenger: tpResult.success ? 'ok' : tpResult.error,
      },
    };
  }

  // Sjekk om noen ytelser har aktive meldekort
  const harAktiveYtelser =
    harAktiveMeldekort(dpResult.data) ||
    harAktiveMeldekort(aapResult.data) ||
    harAktiveMeldekort(tpResult.data);

  // Hvis ingen ytelser har aktive meldekort, sjekk arena for redirectUrl
  let redirectUrl: string | undefined;
  if (!harAktiveYtelser) {
    const arenaResult = await hentMeldekortDataFraArena(actualToken);

    // Hvis arena-kallet feiler, returner teknisk feil
    if (!arenaResult.success) {
      logger.error('Arena-kall (meldekort-api) feilet', {
        service: 'arena/meldekort-api',
        error: arenaResult.error,
      });
      return {
        success: false,
        status: 503,
        error: 'Failed to fetch data from Arena',
        details: {
          arena: arenaResult.error,
        },
      };
    }
    if (arenaResult.data) {
      // Valider redirectUrl før vi bruker den
      const arenaRedirectUrl = arenaResult.data.redirectUrl;

      // Arena returnerer tom string når det ikke er noen redirect
      if (arenaRedirectUrl === '') {
        // Ingen redirect - fortsett uten (vis tom landingsside)
        logger.info('Arena returnerte tom redirectUrl - ingen redirect tilgjengelig');
      } else if (isValidRedirectUrl(arenaRedirectUrl)) {
        redirectUrl = arenaRedirectUrl;
        logger.info('Arena returnerte gyldig redirectUrl', {
          redirectUrl: arenaRedirectUrl,
          type: arenaRedirectUrl.startsWith('/') ? 'relative' : 'absolute',
        });
      } else {
        // Ugyldig redirectUrl fra arena - logg og fortsett uten (vis tom landingsside)
        logger.warn('Ugyldig redirectUrl fra arena - må være sikker intern NAV URL', {
          redirectUrl: arenaRedirectUrl,
        });
      }
    }
  }

  const result: MeldekortDataResult = {
    success: true,
    data: {
      ...(dpResult.data && { dagpenger: dpResult.data }),
      ...(aapResult.data && { aap: aapResult.data }),
      ...(tpResult.data && { tiltakspenger: tpResult.data }),
    },
    ...(redirectUrl && { redirectUrl }),
  };

  logger.info('Successfully fetched meldekort data from all services', {
    hasDP: !!dpResult.data,
    hasAAP: !!aapResult.data,
    hasTP: !!tpResult.data,
    hasRedirectUrl: !!redirectUrl,
  });

  return result;
}
