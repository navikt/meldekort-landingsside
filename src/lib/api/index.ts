import type { AlleMeldekortData } from "../types/meldekort";
import { hentMeldekortDataFraArena } from "./clients/arena";
import { hentMeldekortDataFraDP } from "./clients/dagpenger";
import { hentMeldekortDataFraTTL } from "./clients/tiltakspenger";
import { hentMeldekortDataFraAAP } from "./clients/arbeidsavklaringspenger";
import { hentHarDP } from "./clients/harDP";

const DP_REDIRECT_URL =
  "https://arbeid.intern.dev.nav.no/arbeid/dagpenger/meldekort"; // TODO - skal denne med?????

export interface MeldekortResultat {
  redirectUrl?: string;
  data: AlleMeldekortData;
}

/**
 * Henter meldekortdata for alle ytelser og bestemmer redirect.
 *
 * Flyt:
 * 1. Hent data fra nye ytelser (DP, TTL, AAP) parallelt
 * 2. Hvis kun én ytelse → returner med redirectUrl
 * 3. Hvis flere ytelser → returner data uten redirect (vis landingsside)
 * 4. Hvis ingen nye ytelser → sjekk harDP først (rask sjekk mot dp-rapportering-personregister)
 *    - harDP = true → redirect til DP
 *    - harDP = false → hent fra Arena ORDS (tregere, men nødvendig for andre meldegrupper)
 *      → Hvis Arena har meldekort → redirect til felles-meldekort
 * 5. Ingen meldekort → returner tomt (vis empty state)
 *
 * @param oboToken - OBO token fra brukerens sesjon
 * @returns Resultat med redirectUrl (hvis single ytelse) eller data (hvis flere/ingen)
 */
export async function getMeldekortResultat(
  oboToken: string,
): Promise<MeldekortResultat> {
  // 1. Hent nye ytelser parallelt
  const results = await Promise.allSettled([
    hentMeldekortDataFraDP(oboToken),
    hentMeldekortDataFraTTL(oboToken),
    hentMeldekortDataFraAAP(oboToken),
  ]);

  // Ekstraher verdier fra fulfilled promises
  const dp = results[0].status === "fulfilled" ? results[0].value : undefined;
  const ttl = results[1].status === "fulfilled" ? results[1].value : undefined;
  const aap = results[2].status === "fulfilled" ? results[2].value : undefined;

  const antallNyeYtelser = [dp, ttl, aap].filter(Boolean).length;

  // 2. Hvis bruker har nye ytelser
  if (antallNyeYtelser > 0) {
    const data: AlleMeldekortData = {
      ...(dp && { dp }),
      ...(ttl && { ttl }),
      ...(aap && { aap }),
    };

    // Hvis kun én ytelse → redirect
    if (antallNyeYtelser === 1) {
      const redirectUrl =
        dp?.redirectUrl ?? ttl?.redirectUrl ?? aap?.redirectUrl ?? "";
      return { redirectUrl, data };
    }

    // Flere ytelser → vis landingsside
    return { data };
  }

  // 3. Ingen nye ytelser - hent Arena-meldekort
  const arenaMeldekort = await hentMeldekortDataFraArena(oboToken);

  if (arenaMeldekort) {
    // sjekk harDP først (rask boolean-sjekk)
    const harDP = await hentHarDP(oboToken);

    if (harDP) {
      // Bruker har DP i Arena → redirect til DPs
      return { redirectUrl: DP_REDIRECT_URL, data: {} };
    }

    // Hvis meldekort i Arena, men !harDP → redirect til felles-meldekort
    return {
      redirectUrl: arenaMeldekort.redirectUrl,
      data: { arena: arenaMeldekort },
    };
  }

  // 5. Ingen meldekort → vis tom landingsside
  return { data: {} };
}
