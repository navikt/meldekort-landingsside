import type { APIRoute } from 'astro';
import { getToken } from '@navikt/oasis';
import type { AlleMeldekortData } from '../../lib/types/meldekort';
import { dagpengerMock } from '../../lib/api/mockData';
import { hentMeldekortDataFraAAP } from '../../lib/api/clients/arbeidsavklaringspenger';
import { hentMeldekortDataFraTP } from '../../lib/api/clients/tiltakspenger';
import { harAktiveMeldekort } from '../../lib/api/helpers';

/**
 * Samlet API-endepunkt som returnerer meldekortdata for alle ytelser.
 *
 * Logikk:
 * - Hvis kun 1 ytelse har aktive meldekort → HTTP 307 redirect til den ytelsens URL
 * - Hvis 0 ytelser har aktive meldekort → returner data (tom landingsside vises)
 * - Hvis >1 ytelser har aktive meldekort → returner data (landingsside med flere ytelser vises)
 *
 * En ytelse regnes som aktiv hvis den har:
 * - innsendteMeldekort: true ELLER
 * - meldekortTilUtfylling: [{...}] (minst ett element)
 */
export const GET: APIRoute = async ({ request }) => {
  // Hent token fra request
  const token = getToken(request.headers);

  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // Hent data fra alle ytelser parallelt
  const [aapData, tpData] = await Promise.all([
    hentMeldekortDataFraAAP(token),
    hentMeldekortDataFraTP(token),
  ]);

  const dpData = dagpengerMock; // TODO: Bytt ut med faktisk kall til DP API

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
