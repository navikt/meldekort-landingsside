import type { ArenaMeldekortData } from '../../types/meldekort';
import { hentMeldekortData, validerArenaMeldekortData } from '../helpers';

/**
 * Henter meldekortdata fra Arena ORDS.
 * NB: Tregt endepunkt - harDP sjekkes først før dette kalles.
 */
export async function hentMeldekortDataFraArena(
  oboToken: string,
): Promise<ArenaMeldekortData | undefined> {
  return hentMeldekortData(oboToken, {
    apiUrl: process.env.MELDEKORT_API_URL,
    audience: process.env.MELDEKORT_API_AUDIENCE,
    path: '/person/meldekortstatus',
    serviceName: 'Arena',
    validator: validerArenaMeldekortData,
  });
}
