import type { MeldekortData } from '../../types/meldekort';
import { hentMeldekortData, validerMeldekortData } from '../helpers';

/** Henter meldekortdata for arbeidsavklaringspenger. */
export async function hentMeldekortDataFraAAP(
  oboToken: string,
): Promise<MeldekortData | undefined> {
  return hentMeldekortData(oboToken, {
    apiUrl: process.env.AAP_API_URL,
    audience: process.env.AAP_API_AUDIENCE,
    path: '/api/meldekort-status',
    serviceName: 'AAP',
    validator: validerMeldekortData,
  });
}
