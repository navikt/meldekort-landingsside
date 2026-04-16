import {
  type DecoratorEnvProps,
  type DecoratorFetchProps,
  fetchDecoratorHtml,
} from '@navikt/nav-dekoratoren-moduler/ssr';
import { logger } from './utils/logger';

export interface DecoratorElements {
  DECORATOR_HEAD_ASSETS: string;
  DECORATOR_HEADER: string;
  DECORATOR_FOOTER: string;
  DECORATOR_SCRIPTS: string;
}

interface DecoratorParams {
  env?: DecoratorEnvProps['env'];
  context?: 'privatperson' | 'arbeidsgiver';
  simple?: boolean;
  language?: string;
  availableLanguages?: Array<{
    locale: string;
    url: string;
    handleInApp?: boolean;
  }>;
}

/**
 * Henter dekoratør HTML fra NAV dekoratøren.
 * Følger samme pattern som meldekort-frontend.
 */
export async function getDecoratorHTML(params: DecoratorParams = {}): Promise<DecoratorElements> {
  const { env = 'dev', context = 'privatperson', simple = false, language = 'nb', availableLanguages } = params;

  const config: DecoratorFetchProps = {
    env: (import.meta.env.DEKORATOR_MILJO || env) as DecoratorEnvProps['env'],
    localUrl: 'https://dekoratoren.ekstern.dev.nav.no',
    // serviceDiscovery er kritisk for at dekoratøren skal kunne
    // kommunisere med Wonderwall/IDporten for innloggingsstatus
    serviceDiscovery: true,
    params: {
      context,
      simple,
      language,
      ...(availableLanguages && { availableLanguages }),
    },
  };

  try {
    const result = await fetchDecoratorHtml(config);
    return {
      DECORATOR_HEAD_ASSETS: result.headAssets || '',
      DECORATOR_HEADER: result.header || '',
      DECORATOR_FOOTER: result.footer || '',
      DECORATOR_SCRIPTS: result.scripts || '',
    };
  } catch (error) {
    logger.error('Error fetching decorator', { error, config });
    return {
      DECORATOR_HEAD_ASSETS: '',
      DECORATOR_HEADER: '',
      DECORATOR_FOOTER: '',
      DECORATOR_SCRIPTS: '',
    };
  }
}
