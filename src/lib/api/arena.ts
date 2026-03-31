import { requestTokenxOboToken } from '@navikt/oasis';
import type { ArenaMeldekortData } from '../types/meldekort';

export async function hentMeldekortDataFraArena(
  oboToken: string,
): Promise<ArenaMeldekortData | undefined> {
  const apiUrl = process.env.MELDEKORT_API_URL;
  const audience = process.env.MELDEKORT_API_AUDIENCE;

  if (!apiUrl || !audience) {
    console.error('Missing MELDEKORT_API_URL or MELDEKORT_API_AUDIENCE');
    return undefined;
  }

  try {
    if (import.meta.env.DEV) {
      console.warn('Dev mode: using provided oboToken for Arena API token exchange');
    }

    const tokenResult = await requestTokenxOboToken(oboToken, audience);

    if (!tokenResult.ok) {
      console.error('Token exchange failed:', tokenResult.error.message);
      return undefined;
    }

    const response = await fetch(`${apiUrl}/person/meldekortstatus`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${tokenResult.token}`,
      },
    });

    if (!response.ok) {
      console.error(`Arena API returned ${response.status}`);
      return undefined;
    }

    const data: ArenaMeldekortData = await response.json();

    if (!data.harInnsendteMeldekort && data.meldekortTilUtfylling.length === 0) {
      return undefined;
    }

    return data;
  } catch (error) {
    console.error('Error checking Arena meldekort status:', error);
    return undefined;
  }
}
