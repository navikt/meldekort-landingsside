import type { DecoratorLocale } from '@navikt/nav-dekoratoren-moduler';
import { logger } from './logger';

interface DecoratorElements {
  DECORATOR_HEAD_ASSETS: string;
  DECORATOR_HEADER: string;
  DECORATOR_FOOTER: string;
  DECORATOR_SCRIPTS: string;
}

interface DecoratorParams {
  env?: 'prod' | 'dev' | 'localhost';
  context?: 'privatperson' | 'arbeidsgiver';
  simple?: boolean;
  enforceLogin?: boolean;
  level?: 'Level3' | 'Level4';
  redirectToApp?: boolean;
  language?: DecoratorLocale;
  availableLanguages?: Array<{
    locale: string;
    url: string;
    handleInApp?: boolean;
  }>;
}

export async function getDecoratorHTML(params: DecoratorParams = {}): Promise<DecoratorElements> {
  const {
    env = 'dev',
    context = 'privatperson',
    simple = false,
    enforceLogin = true,
    level = 'Level3',
    redirectToApp = true,
    language = 'nb',
    availableLanguages,
  } = params;

  const baseUrl =
    env === 'prod' ? 'https://www.nav.no/dekoratoren' : 'https://dekoratoren.ekstern.dev.nav.no';

  const queryParams = new URLSearchParams({
    context,
    simple: simple.toString(),
    enforceLogin: enforceLogin.toString(),
    level,
    redirectToApp: redirectToApp.toString(),
    language,
  });

  if (availableLanguages) {
    queryParams.set('availableLanguages', JSON.stringify(availableLanguages));
  }

  const url = `${baseUrl}/ssr?${queryParams.toString()}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch decorator: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      DECORATOR_HEAD_ASSETS: data.headAssets || '',
      DECORATOR_HEADER: data.header || '',
      DECORATOR_FOOTER: data.footer || '',
      DECORATOR_SCRIPTS: data.scripts || '',
    };
  } catch (error) {
    logger.error('Error fetching decorator:', error);
    return {
      DECORATOR_HEAD_ASSETS: '',
      DECORATOR_HEADER: '',
      DECORATOR_FOOTER: '',
      DECORATOR_SCRIPTS: '',
    };
  }
}
