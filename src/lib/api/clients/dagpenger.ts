import type { MeldekortData } from '../../types/meldekort';
import { hentMeldekortData, validerMeldekortData } from '../helpers';

/** Henter meldekortdata for dagpenger. */
export async function hentMeldekortDataFraDP(oboToken: string): Promise<MeldekortData | undefined> {
  return hentMeldekortData(oboToken, {
    apiUrl: process.env.DP_API_URL,
    audience: process.env.DP_API_AUDIENCE,
    path: '/meldekortstatus',
    serviceName: 'DP',
    validator: validerMeldekortData,
  });
}
