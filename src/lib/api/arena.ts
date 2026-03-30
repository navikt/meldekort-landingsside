import { requestTokenxOboToken } from '@navikt/oasis';

interface ArenaStatusResponse {
  etterregistrerteMeldekort: number;
  meldekort: number;
  nesteInnsendingAvMeldekort: unknown;
  nesteMeldekort: unknown;
}

export async function harMeldekortIArena(oboToken: string): Promise<boolean> {
  const apiUrl = process.env.MELDEKORT_API_URL;
  const audience = process.env.MELDEKORT_API_AUDIENCE;

  if (!apiUrl || !audience) {
    console.error('Missing MELDEKORT_API_URL or MELDEKORT_API_AUDIENCE');
    return false;
  }

  try {
    const token = import.meta.env.DEV ? 'fake-token' : oboToken;

    if (import.meta.env.DEV) {
      console.warn('Dev mode: using fake token for Arena API');
    }

    const tokenResult = await requestTokenxOboToken(token, audience);

    if (!tokenResult.ok) {
      console.error('Token exchange failed:', tokenResult.error.message);
      return false;
    }

    const response = await fetch(`${apiUrl}/person/meldekortstatus`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${tokenResult.token}`,
      },
    });

    if (!response.ok) {
      console.error(`Arena API returned ${response.status}`);
      return false;
    }

    const data: ArenaStatusResponse = await response.json();

    return (
      data.nesteMeldekort != null ||
      data.nesteInnsendingAvMeldekort != null ||
      data.etterregistrerteMeldekort > 0 ||
      data.meldekort > 0
    );
  } catch (error) {
    console.error('Error checking Arena meldekort status:', error);
    return false;
  }
}
