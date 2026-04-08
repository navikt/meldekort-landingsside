import { getToken, validateIdportenToken } from '@navikt/oasis';
import { logger } from './logger';

function isLoginEnforced(): boolean {
  const enforceLogin = import.meta.env.ENFORCE_LOGIN ?? process.env.ENFORCE_LOGIN;
  return enforceLogin !== 'false';
}

/**
 * Henter og validerer ID-porten token fra Wonderwall.
 * Returnerer tom string i mock mode (ENFORCE_LOGIN=false).
 */
export async function getValidatedToken(request: Request): Promise<string> {
  if (!isLoginEnforced()) {
    logger.info('Auth: Mock mode, no token needed');
    return '';
  }

  const token = getToken(request);
  if (!token) {
    logger.error('Auth: Missing token in request headers');
    throw new Error('Feil ved henting av token fra request');
  }

  const validation = await validateIdportenToken(token);
  if (!validation.ok) {
    logger.error('Auth: Token validation failed:', validation.error);
    throw new Error('Feil ved validering av token');
  }

  return token;
}

/**
 * Wrapper for API routes som konverterer Error til Response.
 */
export async function getValidatedTokenForAPI(request: Request): Promise<string> {
  try {
    return await getValidatedToken(request);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Response(null, {
      status: 500,
      statusText: message,
    });
  }
}
