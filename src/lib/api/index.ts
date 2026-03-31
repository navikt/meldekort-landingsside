import type { AlleMeldekortData } from '../types/meldekort';
import { hentMeldekortDataFraArena } from './arena';
import { hentMeldekortDataFraDP } from './dagpenger';
import { hentMeldekortDataFraTTL } from './tiltakspenger';

export async function hentAlleMeldekortData(oboToken: string): Promise<AlleMeldekortData> {
  const [dp, ttl] = await Promise.all([
    hentMeldekortDataFraDP(oboToken),
    hentMeldekortDataFraTTL(oboToken),
  ]);

  // Hvis bruker har én eller flere ytelser, trenger vi ikke å sjekke Arena
  if (dp || ttl) {
    return {
      ...(dp && { dp }),
      ...(ttl && { ttl }),
    };
  }

  // Kun hvis bruker ikke har noen ytelser, sjekk Arena
  const arena = await hentMeldekortDataFraArena(oboToken);

  return {
    ...(arena && { arena }),
  };
}
