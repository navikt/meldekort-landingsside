import type { AlleMeldekortData } from '../types/meldekort';
import { hentMeldekortDataFraArena } from './arena';
import { hentMeldekortDataFraDP } from './dagpenger';
import { hentMeldekortDataFraTTL } from './tiltakspenger';

export async function hentAlleMeldekortData(oboToken: string): Promise<AlleMeldekortData> {
  const [arena, dp, ttl] = await Promise.all([
    hentMeldekortDataFraArena(oboToken),
    hentMeldekortDataFraDP(oboToken),
    hentMeldekortDataFraTTL(oboToken),
  ]);

  return {
    ...(arena && { arena }),
    ...(dp && { dp }),
    ...(ttl && { ttl }),
  };
}
