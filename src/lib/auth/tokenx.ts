import { requestTokenxOboToken } from '@navikt/oasis';

/**
 * Bytter en OBO token til et nytt token for target audience
 *
 * Bruker @navikt/oasis biblioteket som håndterer TokenX token exchange.
 *
 * @param oboToken - Token fra innlogget bruker
 * @param targetAudience - Audience for target API (f.eks. "dev-gcp:meldekort:meldekort-api")
 * @returns Access token for target audience
 */
export async function exchangeToken(oboToken: string, targetAudience: string): Promise<string> {
  // I lokal utvikling, returner fake token
  if (import.meta.env.DEV) {
    console.warn('Using fake token in development mode');
    return 'fake-token-for-development';
  }

  const tokenResult = await requestTokenxOboToken(oboToken, targetAudience);

  if (!tokenResult.ok) {
    throw new Error(`Token exchange failed: ${tokenResult.error.message}`);
  }

  return tokenResult.token;
}
