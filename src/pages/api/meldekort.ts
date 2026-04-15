import type { APIRoute } from 'astro';
import { getToken } from '@navikt/oasis';
import { dagpengerMock } from '../../lib/api/mockData';
import { hentMeldekortDataFraAAP } from '../../lib/api/clients/arbeidsavklaringspenger';
import { hentMeldekortDataFraTP } from '../../lib/api/clients/tiltakspenger';
import { hentMeldekortDataFraArena } from '../../lib/api/clients/arena';
import {
  shouldUseMockData,
  handleMeldekortResponse,
  harAktiveMeldekort,
} from '../../lib/api/helpers';
import { getScenario } from '../../lib/api/scenarios';

/**
 * Samlet API-endepunkt som returnerer meldekortdata for alle ytelser.
 *
 * Logikk:
 * 1. Hent data fra dagpenger, AAP og tiltakspenger
 * 2. Hvis ingen av disse har aktive meldekort → kall arena (meldekort-api) for redirectUrl
 * 3. Hvis ett eller flere API-kall feiler → HTTP 503 med feildetaljer
 * 4. Hvis 0 ytelser har aktive meldekort OG redirectUrl fra arena → HTTP 307 redirect til redirectUrl
 * 5. Hvis kun 1 ytelse har aktive meldekort → HTTP 307 redirect til den ytelsens URL
 * 6. Hvis 0 ytelser har aktive meldekort (uten redirectUrl) → returner data (tom landingsside vises)
 * 7. Hvis >1 ytelser har aktive meldekort → returner data (landingsside med flere ytelser vises)
 *
 * En ytelse regnes som aktiv hvis den har:
 * - innsendteMeldekort: true ELLER
 * - meldekortTilUtfylling: [{...}] (minst ett element)
 *
 * Mock mode med scenarier (kun når ENFORCE_LOGIN=false):
 * Bruk ?scenario=<navn> query parameter for å teste forskjellige tilstander.
 * Tilgjengelige scenarier: ingen-meldekort, kun-felles-meldekort, kun-dagpenger, kun-aap, kun-tp,
 * aap-og-tp, alle-ytelser, kun-innsendte, kun-utfylling
 * Se src/lib/api/scenarios.ts for alle scenarier.
 */
export const GET: APIRoute = async ({ request, url }) => {
  // I mock-modus, skip token-kravet
  const useMock = shouldUseMockData();

  // Sjekk om et scenario er spesifisert via query parameter
  const scenario = url.searchParams.get('scenario');

  // Hvis mock mode OG scenario er satt, bruk scenario data direkte
  if (useMock && scenario) {
    const scenarioData = getScenario(scenario);
    return handleMeldekortResponse({
      dagpenger: scenarioData.dagpenger,
      aap: scenarioData.aap,
      tiltakspenger: scenarioData.tiltakspenger,
      ...(scenarioData.redirectUrl && { redirectUrl: scenarioData.redirectUrl }),
    });
  }

  // Normal flow (ikke scenario mode)
  // Hent token fra request (dummy token i mock-modus)
  const token = useMock ? 'mock-token' : getToken(request.headers);

  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // Hent data fra alle ytelser parallelt
  const [aapResult, tpResult] = await Promise.all([
    hentMeldekortDataFraAAP(token),
    hentMeldekortDataFraTP(token),
  ]);

  const dpData = dagpengerMock; // TODO: Bytt ut med faktisk kall til DP API

  // Sjekk om noen API-kall feilet
  const apiKallFeilet = !aapResult.success || !tpResult.success;

  if (apiKallFeilet) {
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch data from one or more services',
        details: {
          aap: aapResult.success ? 'ok' : aapResult.error,
          tiltakspenger: tpResult.success ? 'ok' : tpResult.error,
        },
      }),
      {
        status: 503, // Service Unavailable
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  }

  // Sjekk om noen ytelser har aktive meldekort
  const harAktiveYtelser =
    harAktiveMeldekort(dpData) ||
    harAktiveMeldekort(aapResult.data) ||
    harAktiveMeldekort(tpResult.data);

  // Hvis ingen ytelser har aktive meldekort, sjekk arena for redirectUrl
  let redirectUrl: string | undefined;
  if (!harAktiveYtelser) {
    const arenaResult = await hentMeldekortDataFraArena(token);

    // Hvis arena-kallet feiler, logg men fortsett (vi viser tom landingsside)
    if (!arenaResult.success) {
      // Arena-feil er ikke kritisk, fortsett uten redirectUrl
    } else if (arenaResult.data) {
      redirectUrl = arenaResult.data.redirectUrl;
    }
  }

  // Hent data fra resultatene og returner response
  return handleMeldekortResponse({
    dagpenger: dpData,
    aap: aapResult.data,
    tiltakspenger: tpResult.data,
    ...(redirectUrl && { redirectUrl }),
  });
};
