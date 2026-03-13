import type { DecoratorLocale } from '@navikt/nav-dekoratoren-moduler';

export const LANGUAGE_COOKIE = 'decorator-language';

export const DEFAULT_LANGUAGE: DecoratorLocale = 'nb';

export const SUPPORTED_LANGUAGES = ['nb', 'en'] as const;

// Cookie max age i sekunder (1 år)
const ONE_YEAR_IN_SECONDS = 365 * 24 * 60 * 60;

export function getLanguageFromCookie(cookieString: string | null): DecoratorLocale {
  if (!cookieString) return DEFAULT_LANGUAGE;

  const cookies = Object.fromEntries(
    cookieString.split(';').map((cookie) => {
      const [key, value] = cookie.trim().split('=');
      return [key, value];
    }),
  );

  const lang = cookies[LANGUAGE_COOKIE];
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(lang)
    ? (lang as (typeof SUPPORTED_LANGUAGES)[number])
    : DEFAULT_LANGUAGE;
}

export function setLanguageCookie(language: DecoratorLocale): string {
  return `${LANGUAGE_COOKIE}=${language}; Path=/; Max-Age=${ONE_YEAR_IN_SECONDS}; SameSite=Lax`;
}

// Fallback tittel hvis Sanity-data ikke er tilgjengelig
export const translations = {
  nb: {
    tittel: 'Meldekortene dine',
  },
  en: {
    tittel: 'Your employment status forms',
  },
};
