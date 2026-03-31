import { requestTokenxOboToken } from '@navikt/oasis';
import type { MeldekortData } from '../types/meldekort';

export async function hentMeldekortDataFraTTL(
  oboToken: string,
): Promise<MeldekortData | undefined> {
  const apiUrl = process.env.TILTAKSPENGER_API_URL;
  const audience = process.env.TILTAKSPENGER_API_AUDIENCE;

  if (!apiUrl || !audience) {
    console.error('Missing TILTAKSPENGER_API_URL or TILTAKSPENGER_API_AUDIENCE');
    return undefined;
  }

  try {
    if (import.meta.env.DEV) {
      console.warn('Dev mode: using provided oboToken for Tiltakspenger API token exchange');
    }

    const tokenResult = await requestTokenxOboToken(oboToken, audience);

    if (!tokenResult.ok) {
      console.error('Token exchange failed:', tokenResult.error.message);
      return undefined;
    }

    const response = await fetch(`${apiUrl}/landingsside/status`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${tokenResult.token}`,
      },
    });

    if (!response.ok) {
      console.error(`Tiltakspenger API returned ${response.status}`);
      return undefined;
    }

    const data: MeldekortData = await response.json();

    if (!data.harInnsendteMeldekort && data.meldekortTilUtfylling.length === 0) {
      return undefined;
    }

    return data;
  } catch (error) {
    console.error('Error checking Tiltakspenger meldekort status:', error);
    return undefined;
  }
}
