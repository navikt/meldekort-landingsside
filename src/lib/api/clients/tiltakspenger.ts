import type { MeldekortData } from '../../types/meldekort';
import { hentMeldekortData, validerMeldekortData } from '../helpers';

/** Henter meldekortdata for tiltakspenger. */
export async function hentMeldekortDataFraTTL(
  oboToken: string,
): Promise<MeldekortData | undefined> {
  return hentMeldekortData(oboToken, {
    apiUrl: process.env.TILTAKSPENGER_API_URL,
    audience: process.env.TILTAKSPENGER_API_AUDIENCE,
    path: '/landingsside/status',
    serviceName: 'Tiltakspenger',
    validator: validerMeldekortData,
  });
}
