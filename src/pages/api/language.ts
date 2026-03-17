import type { APIRoute } from 'astro';
import { LANGUAGE_COOKIE, SUPPORTED_LANGUAGES } from '../../lib/language';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const { language } = body;

    if (!SUPPORTED_LANGUAGES.includes(language)) {
      return new Response(JSON.stringify({ error: 'Invalid language' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(request.url);
    const isSecure = url.protocol === 'https:';

    cookies.set(LANGUAGE_COOKIE, language, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      httpOnly: false,
      sameSite: 'lax',
      secure: isSecure,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const isJsonParseError = error instanceof SyntaxError;
    const status = isJsonParseError ? 400 : 500;
    const message = isJsonParseError ? 'Invalid JSON body' : 'Failed to set language';
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
