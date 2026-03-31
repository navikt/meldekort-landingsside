import { requestTokenxOboToken } from '@navikt/oasis';
import type { MeldekortData } from '../types/meldekort';

export async function hentMeldekortDataFraDP(oboToken: string): Promise<MeldekortData | undefined> {
  const apiUrl = process.env.DP_API_URL;
  const audience = process.env.DP_API_AUDIENCE;

  if (!apiUrl || !audience) {
    console.error('Missing DP_API_URL or DP_API_AUDIENCE');
    return undefined;
  }

  try {
    const token = import.meta.env.DEV ? 'fake-token' : oboToken;

    if (import.meta.env.DEV) {
      console.warn('Dev mode: using fake token for DP API');
    }

    const tokenResult = await requestTokenxOboToken(token, audience);

    if (!tokenResult.ok) {
      console.error('Token exchange failed:', tokenResult.error.message);
      return undefined;
    }

    const response = await fetch(`${apiUrl}/meldekortstatus`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${tokenResult.token}`,
      },
    });

    if (!response.ok) {
      console.error(`DP API returned ${response.status}`);
      return undefined;
    }

    const data: MeldekortData = await response.json();

    if (!data.harInnsendteMeldekort && data.meldekortTilUtfylling.length === 0) {
      return undefined;
    }

    return data;
  } catch (error) {
    console.error('Error checking DP meldekort status:', error);
    return undefined;
  }
}
