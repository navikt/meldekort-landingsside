import type { APIRoute } from 'astro';
import type { AlleMeldekortData } from '../../lib/types/meldekort';
import { dagpengerMock, aapMock, tiltakspengerMock } from '../../lib/api/mockData';
import { getRedirectUrlIfSingleYtelse } from '../../lib/api/utils';

/**
 * Samlet API-endepunkt som returnerer meldekortdata for alle ytelser.
 *
 * Hvis brukeren kun har én ytelse, returneres en redirect-URL.
 * Ellers returneres data for alle ytelser.
 *
 * I produksjon vil dette kalle reelle backend-APIer for hver ytelse.
 */
export const GET: APIRoute = async () => {
  // TODO: Bytt ut mock-data med reelle API-kall til backend når de er klare
  const alleMeldekort: AlleMeldekortData = {
    dagpenger: dagpengerMock,
    aap: aapMock,
    tiltakspenger: tiltakspengerMock,
  };

  const redirectUrl = getRedirectUrlIfSingleYtelse(alleMeldekort);

  if (redirectUrl) {
    return new Response(JSON.stringify({ redirectUrl }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  return new Response(JSON.stringify(alleMeldekort), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};
