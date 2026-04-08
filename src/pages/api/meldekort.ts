import type { APIRoute } from 'astro';
import { getMeldekortResultat } from '../../lib/api';
import { getValidatedTokenForAPI } from '../../lib/auth';

/**
 * Samlet API-endepunkt som returnerer meldekortdata for alle ytelser.
 *
 * Hvis brukeren kun har én ytelse, returneres en redirect-URL.
 * Hvis brukeren kun har Arena-meldekort, returneres redirect til felles-meldekort.
 * Ellers returneres data for alle ytelser.
 *
 * I prod: kaller reelle backend-APIer
 * I dev/demo: bruker mockdata
 */
export const GET: APIRoute = async (context) => {
  // Hent og valider token fra Wonderwall session
  // I demo-miljø brukes fallback token
  const token = await getValidatedTokenForAPI(context.request);

  const { redirectUrl, data: alleMeldekort } = await getMeldekortResultat(token);

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
