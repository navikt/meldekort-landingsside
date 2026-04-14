import type { APIRoute } from 'astro';
import { getToken } from '@navikt/oasis';
import type { AlleMeldekortData } from '../../lib/types/meldekort';
import { dagpengerMock } from '../../lib/api/mockData';
import { hentMeldekortDataFraAAP } from '../../lib/api/clients/arbeidsavklaringspenger';
import { hentMeldekortDataFraTP } from '../../lib/api/clients/tiltakspenger';
import { harAktiveMeldekort, shouldUseMockData } from '../../lib/api/helpers';
import { getScenario } from '../../lib/api/scenarios';

/**
 * Samlet API-endepunkt som returnerer meldekortdata for alle ytelser.
 *
 * Logikk:
 * - Hvis ett eller flere API-kall feiler → HTTP 503 med feildetaljer
 * - Hvis kun 1 ytelse har aktive meldekort → HTTP 307 redirect til den ytelsens URL
 * - Hvis 0 ytelser har aktive meldekort → returner data (tom landingsside vises)
 * - Hvis >1 ytelser har aktive meldekort → returner data (landingsside med flere ytelser vises)
 *
 * En ytelse regnes som aktiv hvis den har:
 * - innsendteMeldekort: true ELLER
 * - meldekortTilUtfylling: [{...}] (minst ett element)
 *
 * Mock mode med scenarier (kun når ENFORCE_LOGIN=false):
 * Bruk ?scenario=<navn> query parameter for å teste forskjellige tilstander.
 * Tilgjengelige scenarier: ingen-meldekort, kun-dagpenger, kun-aap, kun-tp,
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
    const dpData = scenarioData.dagpenger;
    const aapData = scenarioData.aap;
    const tpData = scenarioData.tiltakspenger;

    // Tell antall ytelser med aktive meldekort
    const activeYtelser = [
      { name: 'dagpenger', data: dpData, active: harAktiveMeldekort(dpData) },
      { name: 'aap', data: aapData, active: harAktiveMeldekort(aapData) },
      { name: 'tiltakspenger', data: tpData, active: harAktiveMeldekort(tpData) },
    ].filter((ytelse) => ytelse.active);

    // Hvis kun 1 ytelse har aktive meldekort, gjør HTTP redirect
    if (activeYtelser.length === 1) {
      const ytelse = activeYtelser[0];
      if (ytelse?.data) {
        return Response.redirect(ytelse.data.url, 307);
      }
    }

    // Returner scenario data
    const alleMeldekort: AlleMeldekortData = {
      ...(dpData && { dagpenger: dpData }),
      ...(aapData && { aap: aapData }),
      ...(tpData && { tiltakspenger: tpData }),
    };

    return new Response(JSON.stringify(alleMeldekort), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
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

  // Hent data fra resultatene
  const aapData = aapResult.data;
  const tpData = tpResult.data;

  // Tell antall ytelser med aktive meldekort
  const activeYtelser = [
    { name: 'dagpenger', data: dpData, active: harAktiveMeldekort(dpData) },
    { name: 'aap', data: aapData, active: harAktiveMeldekort(aapData) },
    { name: 'tiltakspenger', data: tpData, active: harAktiveMeldekort(tpData) },
  ].filter((ytelse) => ytelse.active);

  // Hvis kun 1 ytelse har aktive meldekort, gjør HTTP redirect
  if (activeYtelser.length === 1) {
    const ytelse = activeYtelser[0];
    if (ytelse?.data) {
      return Response.redirect(ytelse.data.url, 307); // 307 = Temporary Redirect
    }
  }

  // Ellers (0 eller flere ytelser), returner JSON med meldekortdata
  // Frontend viser enten tom landingsside (0) eller landingsside med flere ytelser (>1)
  const alleMeldekort: AlleMeldekortData = {
    ...(dpData && { dagpenger: dpData }),
    ...(aapData && { aap: aapData }),
    ...(tpData && { tiltakspenger: tpData }),
  };

  return new Response(JSON.stringify(alleMeldekort), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};
