import type { APIRoute } from 'astro';
import type { AlleMeldekortData } from '../../lib/types/meldekort';
import { dagpengerMock, aapMock, tiltakspengerMock, arenaMock } from '../../lib/api/mockData';
import { getRedirectUrlIfSingleYtelse } from '../../lib/api/utils';

/**
 * Samlet API-endepunkt som returnerer meldekortdata for alle ytelser.
 *
 * Hvis brukeren kun har én ytelse, returneres en redirect-URL.
 * Hvis brukeren kun har Arena-meldekort, returneres redirect til felles-meldekort.
 * Ellers returneres data for alle ytelser.
 *
 * I produksjon vil dette kalle reelle backend-APIer for hver ytelse.
 */
export const GET: APIRoute = async () => {
  // TODO: Bytt ut mock-data med reelle API-kall til backend når de er klare

  // TESTING: Arena-redirect (brukeren har kun Arena-meldekort)
  const alleMeldekort: AlleMeldekortData = {
    arena: arenaMock,
  };

  // NORMAL: Alle ytelser (kommenter ut linja over og bruk denne for normal testing)
  // const alleMeldekort: AlleMeldekortData = {
  //   dagpenger: dagpengerMock,
  //   aap: aapMock,
  //   tiltakspenger: tiltakspengerMock,
  //   arena: undefined,
  // };

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
