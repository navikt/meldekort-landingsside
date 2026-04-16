import type { APIRoute } from 'astro';
import { getToken } from '@navikt/oasis';
import { getMeldekortData } from '../../lib/api/getMeldekortData';
import { handleMeldekortResponse } from '../../lib/api/helpers';

/**
 * Samlet API-endepunkt som returnerer meldekortdata for alle ytelser.
 *
 * Logikk:
 * 1. Hent data fra dagpenger, AAP og tiltakspenger
 * 2. Hvis ett eller flere API-kall feiler → HTTP 503 med feildetaljer
 * 3. Hvis ingen av disse har aktive meldekort → kall arena (meldekort-api) for redirectUrl
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
  const token = getToken(request.headers);
  const scenario = url.searchParams.get('scenario');

  const result = await getMeldekortData(token, scenario);

  if (!result.success) {
    return new Response(
      JSON.stringify({
        error: result.error,
        ...(result.details && { details: result.details }),
      }),
      {
        status: result.status,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  }

  return handleMeldekortResponse({
    ...result.data,
    ...(result.redirectUrl && { redirectUrl: result.redirectUrl }),
  });
};
